import { prisma } from '../config/database.js'
import { config } from '../config/index.js'
import { logger } from '../config/logger.js'
import { stellarService } from './stellar.js'

export class StakingService {
  async stake(userId: string, amount: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')
    if (!user.stellarPublicKey) throw new Error('User has no wallet')

    // Check on-chain balance
    const onChainBalance = await stellarService.getBalance(user.stellarPublicKey)
    const balance = parseFloat(onChainBalance)
    if (balance < amount) throw new Error('Insufficient balance to stake')

    // Transfer staked tokens to distributor (held in escrow)
    let txHash: string | null = null
    try {
      txHash = await stellarService.sendTokens(
        stellarService.distributorPublicKey,
        amount.toFixed(7)
      )
    } catch (err: any) {
      logger.error(`[Staking] Token transfer failed: ${err.message}`)
      throw new Error('Staking failed')
    }

    // Create stake record and update balance atomically
    const [stake] = await prisma.$transaction([
      prisma.stake.create({
        data: {
          userId,
          amount,
          txHash,
          status: 'ACTIVE',
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { tokenBalance: (balance - amount).toString() },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'STAKE',
          amount: amount * config.token.usdPerToken,
          tokenAmount: amount,
          txHash,
          status: 'COMPLETED',
        },
      }),
    ])

    logger.info(`[Staking] ${user.email} staked ${amount} iLe`)

    return {
      stakeId: stake.id,
      amount,
      txHash,
      rewardRate: stake.rewardRate,
      message: `Successfully staked ${amount} iLe tokens`,
    }
  }

  async unstake(userId: string, stakeId: string) {
    const stake = await prisma.stake.findFirst({
      where: { id: stakeId, userId, status: 'ACTIVE' },
      include: { user: true },
    })
    if (!stake) throw new Error('Active stake not found')

    // Calculate rewards (simple: amount * rewardRate * days staked)
    const daysStaked = Math.max(
      1,
      Math.floor((Date.now() - stake.startDate.getTime()) / (1000 * 60 * 60 * 24))
    )
    const rewards = stake.amount * stake.rewardRate * (daysStaked / 365)
    const totalPayout = stake.amount + rewards

    // Return staked tokens + rewards from distributor
    let txHash: string | null = null
    try {
      txHash = await stellarService.sendTokens(
        stake.user.stellarPublicKey!,
        totalPayout.toFixed(7)
      )
    } catch (err: any) {
      logger.error(`[Staking] Unstake transfer failed: ${err.message}`)
      throw new Error('Unstaking failed')
    }

    // Update stake status and balance atomically
    const currentBalance = parseFloat(stake.user.tokenBalance || '0')
    await prisma.$transaction([
      prisma.stake.update({
        where: { id: stakeId },
        data: { status: 'UNSTAKED', endDate: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { tokenBalance: (currentBalance + totalPayout).toString() },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'UNSTAKE',
          amount: totalPayout * config.token.usdPerToken,
          tokenAmount: totalPayout,
          txHash,
          status: 'COMPLETED',
          metadata: JSON.stringify({ stakeId, rewards, daysStaked }),
        },
      }),
    ])

    logger.info(`[Staking] ${stake.user.email} unstaked ${stake.amount} iLe + ${rewards.toFixed(7)} rewards`)

    return {
      stakeId,
      principal: stake.amount,
      rewards: parseFloat(rewards.toFixed(7)),
      totalPayout: parseFloat(totalPayout.toFixed(7)),
      txHash,
      message: `Successfully unstaked ${stake.amount} iLe + ${rewards.toFixed(7)} rewards`,
    }
  }

  async getActiveStakes(userId: string) {
    return prisma.stake.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { startDate: 'desc' },
    })
  }

  async getStakingHistory(userId: string) {
    return prisma.stake.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
      take: 50,
    })
  }

  async getStakingStats(userId: string) {
    const activeStakes = await prisma.stake.findMany({
      where: { userId, status: 'ACTIVE' },
    })

    const totalStaked = activeStakes.reduce((sum, s) => sum + s.amount, 0)
    const avgRewardRate = activeStakes.length > 0
      ? activeStakes.reduce((sum, s) => sum + s.rewardRate, 0) / activeStakes.length
      : 0

    return {
      activeStakes: activeStakes.length,
      totalStaked,
      avgRewardRate,
      estimatedAnnualRewards: totalStaked * avgRewardRate,
    }
  }
}

export const stakingService = new StakingService()
