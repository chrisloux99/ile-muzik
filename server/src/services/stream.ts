import { prisma } from '../config/database.js'
import { config } from '../config/index.js'
import { logger } from '../config/logger.js'
import { stellarService } from './stellar.js'

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

    // Check on-chain balance for token deduction
    let txHash: string | null = null
    if (user.stellarPublicKey && tokenCost > 0) {
      const onChainBalance = await stellarService.getBalance(user.stellarPublicKey)
      const balance = parseFloat(onChainBalance)

      if (balance < tokenCost) {
        throw new Error('Insufficient token balance. Please purchase more iLe tokens.')
      }

      // Deduct tokens on-chain: send stream cost to distributor (platform revenue)
      try {
        txHash = await stellarService.sendTokens(
          stellarService.distributorPublicKey,
          tokenCost.toFixed(7)
        )
      } catch (err: any) {
        logger.error(`[Stream] Token deduction failed: ${err.message}`)
        throw new Error('Token payment failed. Please try again.')
      }

      // Update local balance cache
      await prisma.user.update({
        where: { id: userId },
        data: { tokenBalance: (balance - tokenCost).toString() },
      })
    }

    // Record the stream atomically
    const [stream] = await prisma.$transaction([
      prisma.stream.create({
        data: {
          userId,
          trackId: data.trackId,
          trackName: data.trackName,
          artistName: data.artistName,
          tokenCost,
          txHash,
          duration: data.duration || 0,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { streamsThisMonth: { increment: 1 } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'STREAM',
          amount: tokenCost * config.token.usdPerToken,
          tokenAmount: tokenCost,
          txHash,
          status: 'COMPLETED',
          metadata: JSON.stringify({
            trackId: data.trackId,
            trackName: data.trackName,
            artistName: data.artistName,
          }),
        },
      }),
    ])

    logger.info(`[Stream] ${user.email} played ${data.trackId} (${tokenCost} iLe)`)

    return {
      streamId: stream.id,
      tokenCost,
      txHash,
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

    // Check token balance
    if (user.stellarPublicKey) {
      const onChainBalance = await stellarService.getBalance(user.stellarPublicKey)
      const balance = parseFloat(onChainBalance)
      const streamCost = config.token.ratePerStream

      if (balance < streamCost) {
        return {
          canPlay: false,
          reason: 'Insufficient token balance',
          streamsThisMonth: user.streamsThisMonth,
          streamLimit: tierConfig.streamLimit,
          tier: user.tier,
          tokenBalance: onChainBalance,
        }
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
