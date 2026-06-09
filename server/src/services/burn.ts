import { prisma } from '../config/database.js'
import { config } from '../config/index.js'
import { logger } from '../config/logger.js'
import { stellarService } from './stellar.js'

export class BurnService {
  async burnTokens(userId: string, amount: number, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')
    if (!user.stellarPublicKey) throw new Error('User has no wallet')

    // Check on-chain balance
    const onChainBalance = await stellarService.getBalance(user.stellarPublicKey)
    const balance = parseFloat(onChainBalance)
    if (balance < amount) throw new Error('Insufficient balance to burn')

    // Send tokens to issuer account (effectively burning them by removing from circulation)
    let txHash: string | null = null
    try {
      txHash = await stellarService.sendTokens(
        stellarService.issuerPublicKey,
        amount.toFixed(7)
      )
    } catch (err: any) {
      logger.error(`[Burn] Token burn failed: ${err.message}`)
      throw new Error('Token burn failed')
    }

    // Update local balance and record burn atomically
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { tokenBalance: (balance - amount).toString() },
      }),
      prisma.burn.create({
        data: {
          userId,
          amount,
          reason,
          txHash,
        },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'BURN',
          amount: amount * config.token.usdPerToken,
          tokenAmount: amount,
          txHash,
          status: 'COMPLETED',
          metadata: JSON.stringify({ reason }),
        },
      }),
    ])

    logger.info(`[Burn] ${user.email} burned ${amount} iLe`)

    return {
      amount,
      txHash,
      reason,
      message: `Successfully burned ${amount} iLe tokens`,
    }
  }

  async getBurnHistory(userId: string) {
    return prisma.burn.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  async getTotalBurned() {
    const result = await prisma.burn.aggregate({
      _sum: { amount: true },
    })
    return { totalBurned: result._sum.amount || 0 }
  }
}

export const burnService = new BurnService()
