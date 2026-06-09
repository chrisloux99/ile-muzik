import { Router } from 'express'
import { stakingService } from '../services/staking.js'
import { authMiddleware } from '../middleware/auth.js'
import { z } from 'zod'
import { validate } from '../utils/validation.js'

const stakeSchema = z.object({
  amount: z.number().positive('Amount must be positive').finite().max(1000000),
})

const unstakeSchema = z.object({
  stakeId: z.string().min(1),
})

const router = Router()

router.post('/stake', authMiddleware, async (req, res, next) => {
  try {
    const { amount } = validate(stakeSchema, req.body)
    const result = await stakingService.stake(req.user!.userId, amount)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/unstake', authMiddleware, async (req, res, next) => {
  try {
    const { stakeId } = validate(unstakeSchema, req.body)
    const result = await stakingService.unstake(req.user!.userId, stakeId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/active', authMiddleware, async (req, res, next) => {
  try {
    const stakes = await stakingService.getActiveStakes(req.user!.userId)
    res.json(stakes)
  } catch (err) {
    next(err)
  }
})

router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    const history = await stakingService.getStakingHistory(req.user!.userId)
    res.json(history)
  } catch (err) {
    next(err)
  }
})

router.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    const stats = await stakingService.getStakingStats(req.user!.userId)
    res.json(stats)
  } catch (err) {
    next(err)
  }
})

export default router
