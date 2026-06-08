import { prisma } from '../config/database.js'
import { config } from '../config/index.js'
import { logger } from '../config/logger.js'

export class StreamService {
  async recordStream(userId: string, data: {
    trackId: string
    trackName?: string
    artistName?: string
    duration?: number
  }) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    // Check subscription limits
    const tierConfig = config.subscriptions.tiers[user.tier as keyof typeof config.subscriptions.tiers]
    if (tierConfig.streamLimit > 0 && user.streamsThisMonth >= tierConfig.streamLimit) {
      throw new Error('Monthly stream limit reached. Upgrade your subscription or purchase more tokens.')
    }

    const tokenCost = config.token.ratePerStream

    // Record the stream
    const stream = await prisma.stream.create({
      data: {
        userId,
        trackId: data.trackId,
        trackName: data.trackName,
        artistName: data.artistName,
        tokenCost,
        duration: data.duration || 0,
      },
    })

    // Update stream count
    await prisma.user.update({
      where: { id: userId },
      data: { streamsThisMonth: { increment: 1 } },
    })

    // Record transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: 'STREAM',
        amount: tokenCost * config.token.usdPerToken,
        tokenAmount: tokenCost,
        status: 'COMPLETED',
        metadata: JSON.stringify({ trackId: data.trackId, streamId: stream.id }),
      },
    })

    logger.info(`[Stream] ${user.email} played ${data.trackId} (${tokenCost} iLe)`)

    return {
      streamId: stream.id,
      tokenCost,
      streamsThisMonth: user.streamsThisMonth + 1,
      streamLimit: tierConfig.streamLimit,
    }
  }

  async canPlay(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { canPlay: false, reason: 'User not found' }

    const tierConfig = config.subscriptions.tiers[user.tier as keyof typeof config.subscriptions.tiers]

    // Check subscription expiry
    if (user.subscriptionExpiry && user.subscriptionExpiry < new Date()) {
      // Downgrade to free
      await prisma.user.update({
        where: { id: userId },
        data: { tier: 'FREE' },
      })
      user.tier = 'FREE'
    }

    // Check stream limit
    if (tierConfig.streamLimit > 0 && user.streamsThisMonth >= tierConfig.streamLimit) {
      return {
        canPlay: false,
        reason: 'Monthly stream limit reached',
        streamsThisMonth: user.streamsThisMonth,
        streamLimit: tierConfig.streamLimit,
        tier: user.tier,
      }
    }

    return {
      canPlay: true,
      streamsThisMonth: user.streamsThisMonth,
      streamLimit: tierConfig.streamLimit,
      tier: user.tier,
    }
  }

  async getStreamHistory(userId: string, limit = 50) {
    return prisma.stream.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      take: limit,
    })
  }

  async getStreamStats(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const totalStreams = await prisma.stream.count({ where: { userId } })
    const totalTokensSpent = await prisma.transaction.aggregate({
      where: { userId, type: 'STREAM' },
      _sum: { tokenAmount: true },
    })

    const tierConfig = config.subscriptions.tiers[user.tier as keyof typeof config.subscriptions.tiers]

    return {
      totalStreams,
      totalTokensSpent: totalTokensSpent._sum.tokenAmount || 0,
      streamsThisMonth: user.streamsThisMonth,
      streamLimit: tierConfig.streamLimit,
      tier: user.tier,
    }
  }
}

export const streamService = new StreamService()
