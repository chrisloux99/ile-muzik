import { config } from '../config/index.js'
import { prisma } from '../config/database.js'
import { stellarService } from './stellar.js'

let stripe: any = null
async function getStripe() {
  if (!stripe && config.stripe.secretKey) {
    try {
      const StripeMod = await import('stripe')
      stripe = new StripeMod.default(config.stripe.secretKey, { apiVersion: '2024-04-10' })
    } catch {}
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

    // If no Stripe, auto-complete for dev/testing
    return this.completePurchase(transaction.id, userId, pkg.tokens)
  }

  async completePurchase(transactionId: string, userId: string, tokenAmount: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || !user.stellarPublicKey) throw new Error('User or wallet not found')

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

    // Update transaction
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'COMPLETED',
        txHash,
      },
    })

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

    const event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      config.stripe.webhookSecret
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
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
}

export const paymentService = new PaymentService()
