import { prisma } from '../config/database.js'
import { config } from '../config/index.js'
import { logger } from '../config/logger.js'

type Tier = 'FREE' | 'BASIC' | 'PREMIUM'

export class SubscriptionService {
  async subscribe(userId: string, tier: Tier) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const tierConfig = config.subscriptions.tiers[tier as keyof typeof config.subscriptions.tiers]
    if (!tierConfig) throw new Error('Invalid tier')

    const tokenCost = tierConfig.priceUSD / config.token.usdPerToken

    // Check if user has enough tokens (simplified - in production, do on-chain check)
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        tier,
        endDate,
      },
    })

    // Update user tier
    await prisma.user.update({
      where: { id: userId },
      data: {
        tier,
        subscriptionExpiry: endDate,
        streamsThisMonth: 0,
        streamResetDate: new Date(),
      },
    })

    // Record transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: 'SUBSCRIPTION',
        amount: tierConfig.priceUSD,
        tokenAmount: tokenCost,
        status: 'COMPLETED',
        metadata: JSON.stringify({ tier, subscriptionId: subscription.id }),
      },
    })

    logger.info(`[Subscription] ${user.email} subscribed to ${tier}`)

    return {
      subscription,
      tier,
      endDate,
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

    return {
      tier: user.tier,
      subscriptionExpiry: user.subscriptionExpiry,
      streamsThisMonth: user.streamsThisMonth,
      streamLimit: tierConfig.streamLimit,
      activeSubscription,
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
}

export const subscriptionService = new SubscriptionService()
