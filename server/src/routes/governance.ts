import { Router } from 'express'
import { governanceService } from '../services/governance.js'
import { authMiddleware } from '../middleware/auth.js'
import { z } from 'zod'
import { validate } from '../utils/validation.js'

const createProposalSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  durationDays: z.number().int().min(1).max(30).optional(),
})

const voteSchema = z.object({
  proposalId: z.string().min(1),
  support: z.boolean(),
})

const router = Router()

router.post('/proposals', authMiddleware, async (req, res, next) => {
  try {
    const { title, description, durationDays } = validate(createProposalSchema, req.body)
    const result = await governanceService.createProposal(
      req.user!.userId, title, description, durationDays
    )
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/proposals', async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined
    const proposals = await governanceService.getProposals(status as any)
    res.json(proposals)
  } catch (err) {
    next(err)
  }
})

router.get('/proposals/:id', async (req, res, next) => {
  try {
    const proposal = await governanceService.getProposal(req.params.id)
    res.json(proposal)
  } catch (err) {
    next(err)
  }
})

router.post('/vote', authMiddleware, async (req, res, next) => {
  try {
    const { proposalId, support } = validate(voteSchema, req.body)
    const result = await governanceService.vote(req.user!.userId, proposalId, support)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/my-votes', authMiddleware, async (req, res, next) => {
  try {
    const votes = await governanceService.getUserVotes(req.user!.userId)
    res.json(votes)
  } catch (err) {
    next(err)
  }
})

router.post('/proposals/:id/finalize', authMiddleware, async (req, res, next) => {
  try {
    const result = await governanceService.finalizeProposal(req.params.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
