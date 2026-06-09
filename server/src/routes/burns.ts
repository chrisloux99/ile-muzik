import { Router } from 'express'
import { burnService } from '../services/burn.js'
import { authMiddleware } from '../middleware/auth.js'
import { z } from 'zod'
import { validate } from '../utils/validation.js'

const burnSchema = z.object({
  amount: z.number().positive('Amount must be positive').finite(),
  reason: z.string().max(200).optional(),
})

const router = Router()

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { amount, reason } = validate(burnSchema, req.body)
    const result = await burnService.burnTokens(req.user!.userId, amount, reason)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    const history = await burnService.getBurnHistory(req.user!.userId)
    res.json(history)
  } catch (err) {
    next(err)
  }
})

router.get('/total', async (_req, res, next) => {
  try {
    const result = await burnService.getTotalBurned()
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
