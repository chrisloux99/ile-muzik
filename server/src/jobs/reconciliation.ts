import { prisma } from '../config/database.js'
import { stellarService } from '../services/stellar.js'
import { logger } from '../config/logger.js'

export async function reconcileBalances() {
  logger.info('[Reconciliation] Starting balance reconciliation...')

  const users = await prisma.user.findMany({
    where: { stellarPublicKey: { not: null } },
    select: { id: true, email: true, stellarPublicKey: true, tokenBalance: true },
  })

  let checked = 0
  let discrepancies = 0
  let fixed = 0

  for (const user of users) {
    if (!user.stellarPublicKey) continue

    try {
      const onChainBalance = await stellarService.getBalance(user.stellarPublicKey)
      const dbBalance = user.tokenBalance || '0'

      const onChain = parseFloat(onChainBalance)
      const db = parseFloat(dbBalance)

      checked++

      if (Math.abs(onChain - db) > 0.0000001) {
        discrepancies++
        logger.warn(
          `[Reconciliation] Balance mismatch for ${user.email}: DB=${db}, Chain=${onChain}`
        )

        // Trust on-chain balance as source of truth
        await prisma.user.update({
          where: { id: user.id },
          data: { tokenBalance: onChainBalance },
        })
        fixed++
      }
    } catch (err: any) {
      logger.error(`[Reconciliation] Error checking ${user.email}: ${err.message}`)
    }
  }

  logger.info(`[Reconciliation] Complete: ${checked} checked, ${discrepancies} discrepancies, ${fixed} fixed`)
  return { checked, discrepancies, fixed }
}

export async function resetMonthlyStreams() {
  logger.info('[Stream Reset] Resetting monthly stream counts...')

  const result = await prisma.user.updateMany({
    where: {
      streamResetDate: {
        lt: new Date(new Date().setDate(1)), // Before first day of current month
      },
    },
    data: {
      streamsThisMonth: 0,
      streamResetDate: new Date(),
    },
  })

  logger.info(`[Stream Reset] Reset ${result.count} users`)
  return { reset: result.count }
}
