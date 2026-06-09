import { config } from '../config/index.js'
import { prisma } from '../config/database.js'
import { stellarService } from './stellar.js'
import { logger } from '../config/logger.js'

let stripe: any = null
async function getStripe() {
  if (!stripe && config.stripe.secretKey) {
    try {
      const StripeMod = await import('stripe')
      stripe = new StripeMod.default(config.stripe.secretKey, { apiVersion: '2024-04-10' })
    } catch (err: any) {
      if (config.isProduction) {
        logger.error('[Payment] Failed to load Stripe SDK:', err.message)
        throw new Error('Payment service unavailable')
      }
      logger.warn('[Payment] Stripe SDK not available - dev mode auto-complete enabled')
    }
  }
  return stripe
}

export class PaymentService {
  async createPurchase(userId: string, packageIndex: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')
    if (!user.stellarPublicKey) throw new Error('User has no wallet')

    const pkg = config.token.packages[packageIndex]
    if (!pkg) throw new Error('Invalid package')

    // Idempotency: check for recent pending purchase of same package
    const recentPending = await prisma.transaction.findFirst({
      where: {
        userId,
        type: 'PURCHASE',
        status: 'PENDING',
        tokenAmount: pkg.tokens,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
    })
    if (recentPending) {
      const stripeClient = await getStripe()
      if (stripeClient && recentPending.stripeId) {
        return {
          transactionId: recentPending.id,
          checkoutUrl: null,
          sessionId: recentPending.stripeId,
          message: 'Purchase already in progress',
        }
      }
    }

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'PURCHASE',
        amount: pkg.priceUSD,
        tokenAmount: pkg.tokens,
        currency: 'USD',
        status: 'PENDING',
      },
    })

    // If Stripe is configured, create a checkout session
    const stripeClient = await getStripe()
    if (stripeClient) {
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${pkg.label} Token Pack`,
                description: `Purchase ${pkg.tokens} iLe tokens for iLe-Play`,
              },
              unit_amount: Math.round(pkg.priceUSD * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${config.corsOrigin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.corsOrigin}/payment/cancel`,
        metadata: {
          transactionId: transaction.id,
          userId,
          packageIndex: String(packageIndex),
        },
      })

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { stripeId: session.id },
      })

      return {
        transactionId: transaction.id,
        checkoutUrl: session.url,
        sessionId: session.id,
      }
    }

    // If no Stripe, auto-complete only in non-production
    if (config.isProduction) {
      throw new Error('Payment service not configured')
    }
    return this.completePurchase(transaction.id, userId, pkg.tokens)
  }

  async completePurchase(transactionId: string, userId: string, tokenAmount: number) {
    // Idempotency: atomically transition PENDING -> COMPLETED
    const updated = await prisma.transaction.updateMany({
      where: {
        id: transactionId,
        status: 'PENDING',
      },
      data: { status: 'PROCESSING' },
    })

    if (updated.count === 0) {
      // Already processed or doesn't exist
      const existing = await prisma.transaction.findUnique({ where: { id: transactionId } })
      if (!existing) throw new Error('Transaction not found')
      if (existing.status === 'COMPLETED') {
        return {
          transactionId,
          txHash: existing.txHash,
          tokenAmount: existing.tokenAmount,
          message: 'Transaction already completed',
        }
      }
      throw new Error('Transaction is being processed')
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.stellarPublicKey) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'FAILED' },
      })
      throw new Error('User or wallet not found')
    }

    // Send tokens on Stellar
    let txHash: string | null = null
    try {
      txHash = await stellarService.sendTokens(
        user.stellarPublicKey,
        tokenAmount.toFixed(7)
      )
    } catch (err: any) {
      logger.error(`[Payment] Token transfer failed: ${err.message}`)
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'FAILED' },
      })
      throw new Error('Token transfer failed')
    }

    // Update transaction and balance atomically
    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          txHash,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          tokenBalance: (parseFloat(user.tokenBalance || '0') + tokenAmount).toString(),
        },
      }),
    ])

    logger.info(`[Payment] Completed: ${tokenAmount} iLe to ${user.email}`)

    return {
      transactionId,
      txHash,
      tokenAmount,
      message: `Successfully purchased ${tokenAmount} iLe tokens`,
    }
  }

  async handleStripeWebhook(body: string | Buffer, signature: string) {
    const stripeClient = await getStripe()
    if (!stripeClient || !config.stripe.webhookSecret) {
      throw new Error('Stripe not configured')
    }

    if (!Buffer.isBuffer(body)) {
      throw new Error('Webhook body must be raw Buffer for signature verification')
    }

    const event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      config.stripe.webhookSecret
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const transactionId = session.metadata?.transactionId
      const userId = session.metadata?.userId
      const packageIndex = parseInt(session.metadata?.packageIndex || '0')

      if (transactionId && userId) {
        const pkg = config.token.packages[packageIndex]
        if (pkg) {
          await this.completePurchase(transactionId, userId, pkg.tokens)
        }
      }
    }

    return { received: true }
  }

  async getPurchaseHistory(userId: string) {
    return prisma.transaction.findMany({
      where: {
        userId,
        type: 'PURCHASE',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  async sendTokens(userId: string, recipientAddress: string, amount: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')
    if (!user.stellarPublicKey) throw new Error('User has no wallet')

    // Check on-chain balance instead of local cache
    const onChainBalance = await stellarService.getBalance(user.stellarPublicKey)
    const balance = parseFloat(onChainBalance)
    if (balance < amount) throw new Error('Insufficient balance')

    let txHash: string | null = null
    try {
      txHash = await stellarService.sendTokens(recipientAddress, amount.toFixed(7))
    } catch (err: any) {
      throw new Error(`Token transfer failed: ${err.message}`)
    }

    // Update local balance cache and record transaction atomically
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { tokenBalance: (balance - amount).toString() }
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'SEND',
          amount: 0,
          tokenAmount: amount,
          currency: 'ILE',
          status: 'COMPLETED',
          txHash,
          metadata: JSON.stringify({ recipientAddress }),
        }
      }),
    ])

    return {
      txHash,
      amount,
      message: `Successfully sent ${amount} iLe to ${recipientAddress}`
    }
  }
}

export const paymentService = new PaymentService()
