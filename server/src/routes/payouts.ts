import { Router } from 'express'
import { payoutService } from '../services/payout.js'
import { authMiddleware } from '../middleware/auth.js'
import { adminMiddleware } from '../middleware/auth.js'
import { z } from 'zod'
import { validate } from '../utils/validation.js'

const processPayoutSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM format'),
})

const router = Router()

router.get('/calculate', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const period = req.query.period as string || new Date().toISOString().slice(0, 7)
    const payouts = await payoutService.calculatePayouts(period)
    res.json(payouts)
  } catch (err) {
    next(err)
  }
})

router.post('/process', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    const { period } = validate(processPayoutSchema, req.body)
    const results = await payoutService.processPayout(period)
    res.json(results)
  } catch (err) {
    next(err)
  }
})

router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    const artistName = req.query.artist as string | undefined
    const limit = parseInt(req.query.limit as string) || 50
    const history = await payoutService.getPayoutHistory(artistName, limit)
    res.json(history)
  } catch (err) {
    next(err)
  }
})

router.get('/summary/:period', authMiddleware, async (req, res, next) => {
  try {
    const summary = await payoutService.getPayoutSummary(req.params.period)
    res.json(summary)
  } catch (err) {
    next(err)
  }
})

export default router
