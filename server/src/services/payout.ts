import { prisma } from '../config/database.js'
import { config } from '../config/index.js'
import { logger } from '../config/logger.js'
import { stellarService } from './stellar.js'

export class PayoutService {
  async calculatePayouts(period: string) {
    // Calculate artist payouts based on stream counts
    const streams = await prisma.stream.groupBy({
      by: ['artistName'],
      where: {
        playedAt: {
          gte: new Date(new Date().setDate(1)), // Current month
        },
        artistName: { not: null },
      },
      _count: { id: true },
      _sum: { tokenCost: true },
    })

    const payouts = streams.map(s => ({
      artistName: s.artistName!,
      streamCount: s._count.id,
      tokenAmount: s._sum.tokenCost || 0,
    }))

    return payouts
  }

  async processPayout(period: string) {
    const payouts = await this.calculatePayouts(period)
    const results = []

    for (const payout of payouts) {
      if (payout.tokenAmount <= 0) continue

      // Record payout (actual Stellar transfer would go to artist wallet)
      const record = await prisma.payout.create({
        data: {
          artistName: payout.artistName,
          amount: payout.tokenAmount,
          period,
          streamCount: payout.streamCount,
          status: 'COMPLETED',
        },
      })

      results.push(record)
      logger.info(`[Payout] ${payout.artistName}: ${payout.tokenAmount} iLe for ${payout.streamCount} streams`)
    }

    logger.info(`[Payout] Processed ${results.length} payouts for ${period}`)
    return results
  }

  async getPayoutHistory(artistName?: string, limit = 50) {
    return prisma.payout.findMany({
      where: artistName ? { artistName } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async getPayoutSummary(period: string) {
    const payouts = await prisma.payout.findMany({
      where: { period },
    })

    return {
      period,
      totalArtists: payouts.length,
      totalStreams: payouts.reduce((sum, p) => sum + p.streamCount, 0),
      totalPaid: payouts.reduce((sum, p) => sum + p.amount, 0),
      payouts,
    }
  }
}

export const payoutService = new PayoutService()
