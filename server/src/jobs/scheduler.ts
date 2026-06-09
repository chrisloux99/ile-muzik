import { prisma } from '../config/database.js'
import { logger } from '../config/logger.js'

export async function processAutoRenewals() {
  const { subscriptionService } = await import('../services/subscription.js')
  return subscriptionService.processAutoRenewals()
}

export async function expireSubscriptions() {
  logger.info('[Expiry] Checking for expired subscriptions...')

  const expired = await prisma.user.findMany({
    where: {
      tier: { not: 'FREE' },
      subscriptionExpiry: { lt: new Date() },
    },
    select: { id: true, email: true },
  })

  if (expired.length === 0) {
    logger.info('[Expiry] No expired subscriptions found')
    return { expired: 0 }
  }

  await prisma.user.updateMany({
    where: {
      id: { in: expired.map(u => u.id) },
    },
    data: { tier: 'FREE' },
  })

  logger.info(`[Expiry] Downgraded ${expired.length} users to FREE`)
  return { expired: expired.length }
}

// Run all scheduled jobs
export async function runScheduledJobs() {
  logger.info('[Scheduler] Running scheduled jobs...')

  try {
    await expireSubscriptions()
  } catch (err: any) {
    logger.error(`[Scheduler] Expiry job failed: ${err.message}`)
  }

  try {
    await processAutoRenewals()
  } catch (err: any) {
    logger.error(`[Scheduler] Auto-renew job failed: ${err.message}`)
  }

  logger.info('[Scheduler] Scheduled jobs complete')
}
