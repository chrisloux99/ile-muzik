import { Router } from 'express'
import { subscriptionService } from '../services/subscription.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/status', authMiddleware, async (req, res, next) => {
  try {
    const status = await subscriptionService.getStatus(req.user!.userId)
    res.json(status)
  } catch (err) {
    next(err)
  }
})

router.post('/subscribe', authMiddleware, async (req, res, next) => {
  try {
    const result = await subscriptionService.subscribe(req.user!.userId, req.body.tier)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/cancel', authMiddleware, async (req, res, next) => {
  try {
    const result = await subscriptionService.cancel(req.user!.userId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
