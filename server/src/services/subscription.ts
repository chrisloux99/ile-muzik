import { prisma } from '../config/database.js'
import { config } from '../config/index.js'
import { logger } from '../config/logger.js'
import { stellarService } from './stellar.js'

type Tier = 'FREE' | 'BASIC' | 'PREMIUM'

export class SubscriptionService {
  async subscribe(userId: string, tier: Tier) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const tierConfig = config.subscriptions.tiers[tier as keyof typeof config.subscriptions.tiers]
    if (!tierConfig) throw new Error('Invalid tier')

    const tokenCost = tierConfig.priceUSD / config.token.usdPerToken

    // Verify on-chain balance and deduct tokens for paid tiers
    let txHash: string | null = null
    if (tokenCost > 0 && user.stellarPublicKey) {
      const onChainBalance = await stellarService.getBalance(user.stellarPublicKey)
      const balance = parseFloat(onChainBalance)

      if (balance < tokenCost) {
        throw new Error(`Insufficient balance. Need ${tokenCost} iLe, have ${balance} iLe.`)
      }

      // Deduct subscription cost on-chain
      try {
        txHash = await stellarService.sendTokens(
          stellarService.distributorPublicKey,
          tokenCost.toFixed(7)
        )
      } catch (err: any) {
        logger.error(`[Subscription] Token deduction failed: ${err.message}`)
        throw new Error('Subscription payment failed. Please try again.')
      }

      // Update local balance cache
      await prisma.user.update({
        where: { id: userId },
        data: { tokenBalance: (balance - tokenCost).toString() },
      })
    }

    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    // Create subscription and update user atomically
    const [subscription] = await prisma.$transaction([
      prisma.subscription.create({
        data: {
          userId,
          tier,
          endDate,
          paymentTxHash: txHash,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          tier,
          subscriptionExpiry: endDate,
          streamsThisMonth: 0,
          streamResetDate: new Date(),
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'SUBSCRIPTION',
          amount: tierConfig.priceUSD,
          tokenAmount: tokenCost,
          txHash,
          status: 'COMPLETED',
          metadata: JSON.stringify({ tier }),
        },
      }),
    ])

    logger.info(`[Subscription] ${user.email} subscribed to ${tier}`)

    return {
      subscription,
      tier,
      endDate,
      txHash,
      tokenCost,
      streamLimit: tierConfig.streamLimit,
    }
  }

  async getStatus(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        endDate: { gte: new Date() },
      },
      orderBy: { endDate: 'desc' },
    })

    const tierConfig = config.subscriptions.tiers[user.tier as keyof typeof config.subscriptions.tiers]

    // Check if subscription expired
    if (user.subscriptionExpiry && user.subscriptionExpiry < new Date()) {
      await prisma.user.update({
        where: { id: userId },
        data: { tier: 'FREE' },
      })
      user.tier = 'FREE'
    }

    // Reset streams if month has passed
    const resetDate = new Date(user.streamResetDate)
    const now = new Date()
    if (resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear()) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          streamsThisMonth: 0,
          streamResetDate: now,
        },
      })
      user.streamsThisMonth = 0
    }

    // Grace period check
    let inGracePeriod = false
    if (user.subscriptionExpiry) {
      const graceEnd = new Date(user.subscriptionExpiry)
      graceEnd.setDate(graceEnd.getDate() + config.subscriptions.gracePeriodDays)
      inGracePeriod = now < graceEnd && now > user.subscriptionExpiry
    }

    return {
      tier: user.tier,
      subscriptionExpiry: user.subscriptionExpiry,
      streamsThisMonth: user.streamsThisMonth,
      streamLimit: tierConfig.streamLimit,
      activeSubscription,
      inGracePeriod,
      availableTiers: Object.entries(config.subscriptions.tiers).map(([key, value]) => ({
        tier: key,
        ...value,
      })),
    }
  }

  async cancel(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    await prisma.subscription.updateMany({
      where: { userId, endDate: { gte: new Date() } },
      data: { autoRenew: false },
    })

    logger.info(`[Subscription] ${user.email} cancelled auto-renew`)
    return { message: 'Auto-renewal cancelled' }
  }

  async processAutoRenewals() {
    // Find subscriptions expiring in the next 24 hours with autoRenew enabled
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const expiringSubs = await prisma.subscription.findMany({
      where: {
        autoRenew: true,
        endDate: { lte: tomorrow, gte: new Date() },
      },
      include: { user: true },
    })

    let renewed = 0
    let failed = 0

    for (const sub of expiringSubs) {
      try {
        const tierConfig = config.subscriptions.tiers[sub.tier as keyof typeof config.subscriptions.tiers]
        if (!tierConfig || tierConfig.priceUSD === 0) continue

        const tokenCost = tierConfig.priceUSD / config.token.usdPerToken

        // Check balance
        if (sub.user.stellarPublicKey) {
          const balance = parseFloat(await stellarService.getBalance(sub.user.stellarPublicKey))
          if (balance < tokenCost) {
            logger.warn(`[Subscription] Auto-renew failed for ${sub.user.email}: insufficient balance`)
            failed++
            continue
          }

          // Deduct tokens
          const txHash = await stellarService.sendTokens(
            stellarService.distributorPublicKey,
            tokenCost.toFixed(7)
          )

          // Extend subscription
          const newEndDate = new Date(sub.endDate)
          newEndDate.setMonth(newEndDate.getMonth() + 1)

          await prisma.$transaction([
            prisma.subscription.update({
              where: { id: sub.id },
              data: { endDate: newEndDate, paymentTxHash: txHash },
            }),
            prisma.user.update({
              where: { id: sub.userId },
              data: { subscriptionExpiry: newEndDate },
            }),
            prisma.transaction.create({
              data: {
                userId: sub.userId,
                type: 'SUBSCRIPTION',
                amount: tierConfig.priceUSD,
                tokenAmount: tokenCost,
                txHash,
                status: 'COMPLETED',
                metadata: JSON.stringify({ tier: sub.tier, autoRenew: true }),
              },
            }),
          ])

          renewed++
        }
      } catch (err: any) {
        logger.error(`[Subscription] Auto-renew error for ${sub.user.email}: ${err.message}`)
        failed++
      }
    }

    logger.info(`[Subscription] Auto-renewal complete: ${renewed} renewed, ${failed} failed`)
    return { renewed, failed }
  }
}

export const subscriptionService = new SubscriptionService()
