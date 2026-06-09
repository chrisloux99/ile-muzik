import { prisma } from '../config/database.js'
import { config } from '../config/index.js'
import { logger } from '../config/logger.js'

type ProposalStatus = 'ACTIVE' | 'PASSED' | 'REJECTED' | 'EXECUTED'

interface Proposal {
  id: string
  title: string
  description: string
  creatorId: string
  status: ProposalStatus
  votesFor: number
  votesAgainst: number
  startDate: Date
  endDate: Date
  executedAt?: Date
}

export class GovernanceService {
  async createProposal(userId: string, title: string, description: string, durationDays = 7) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    // Store proposal in transaction metadata (using existing schema)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + durationDays)

    const proposal = await prisma.transaction.create({
      data: {
        userId,
        type: 'GOVERNANCE_PROPOSAL',
        amount: 0,
        tokenAmount: 0,
        status: 'ACTIVE',
        metadata: JSON.stringify({
          title,
          description,
          votesFor: 0,
          votesAgainst: 0,
          endDate: endDate.toISOString(),
        }),
      },
    })

    logger.info(`[Governance] Proposal created: "${title}" by ${user.email}`)

    return {
      proposalId: proposal.id,
      title,
      description,
      endDate,
      status: 'ACTIVE',
    }
  }

  async vote(userId: string, proposalId: string, support: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')

    const proposal = await prisma.transaction.findUnique({ where: { id: proposalId } })
    if (!proposal || proposal.type !== 'GOVERNANCE_PROPOSAL') {
      throw new Error('Proposal not found')
    }

    const metadata = JSON.parse(proposal.metadata || '{}')
    if (metadata.endDate && new Date(metadata.endDate) < new Date()) {
      throw new Error('Voting period has ended')
    }

    // Get user's token balance for vote weight
    const balance = parseFloat(user.tokenBalance || '0')
    if (balance <= 0) throw new Error('Must hold tokens to vote')

    // Record vote as a transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: 'GOVERNANCE_VOTE',
        amount: 0,
        tokenAmount: balance,
        status: 'COMPLETED',
        metadata: JSON.stringify({
          proposalId,
          support,
          weight: balance,
        }),
      },
    })

    // Update proposal vote counts
    if (support) {
      metadata.votesFor = (metadata.votesFor || 0) + balance
    } else {
      metadata.votesAgainst = (metadata.votesAgainst || 0) + balance
    }

    await prisma.transaction.update({
      where: { id: proposalId },
      data: {
        metadata: JSON.stringify(metadata),
      },
    })

    logger.info(`[Governance] ${user.email} voted ${support ? 'FOR' : 'AGAINST'} proposal ${proposalId}`)

    return {
      proposalId,
      support,
      weight: balance,
      votesFor: metadata.votesFor,
      votesAgainst: metadata.votesAgainst,
    }
  }

  async getProposals(status?: ProposalStatus) {
    const proposals = await prisma.transaction.findMany({
      where: {
        type: 'GOVERNANCE_PROPOSAL',
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return proposals.map(p => {
      const metadata = JSON.parse(p.metadata || '{}')
      return {
        id: p.id,
        title: metadata.title,
        description: metadata.description,
        status: p.status,
        votesFor: metadata.votesFor || 0,
        votesAgainst: metadata.votesAgainst || 0,
        endDate: metadata.endDate,
        createdAt: p.createdAt,
      }
    })
  }

  async getProposal(proposalId: string) {
    const proposal = await prisma.transaction.findUnique({ where: { id: proposalId } })
    if (!proposal || proposal.type !== 'GOVERNANCE_PROPOSAL') {
      throw new Error('Proposal not found')
    }

    const metadata = JSON.parse(proposal.metadata || '{}')

    // Get votes for this proposal
    const votes = await prisma.transaction.findMany({
      where: {
        type: 'GOVERNANCE_VOTE',
        metadata: { contains: proposalId },
      },
    })

    return {
      id: proposal.id,
      title: metadata.title,
      description: metadata.description,
      status: proposal.status,
      votesFor: metadata.votesFor || 0,
      votesAgainst: metadata.votesAgainst || 0,
      endDate: metadata.endDate,
      totalVoters: votes.length,
      createdAt: proposal.createdAt,
    }
  }

  async getUserVotes(userId: string) {
    return prisma.transaction.findMany({
      where: {
        userId,
        type: 'GOVERNANCE_VOTE',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  async finalizeProposal(proposalId: string) {
    const proposal = await prisma.transaction.findUnique({ where: { id: proposalId } })
    if (!proposal || proposal.type !== 'GOVERNANCE_PROPOSAL') {
      throw new Error('Proposal not found')
    }

    const metadata = JSON.parse(proposal.metadata || '{}')
    const passed = (metadata.votesFor || 0) > (metadata.votesAgainst || 0)

    await prisma.transaction.update({
      where: { id: proposalId },
      data: { status: passed ? 'PASSED' : 'REJECTED' },
    })

    logger.info(`[Governance] Proposal ${proposalId} ${passed ? 'PASSED' : 'REJECTED'}`)

    return {
      proposalId,
      status: passed ? 'PASSED' : 'REJECTED',
      votesFor: metadata.votesFor,
      votesAgainst: metadata.votesAgainst,
    }
  }
}

export const governanceService = new GovernanceService()
