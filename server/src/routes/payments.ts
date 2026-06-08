import { Router } from 'express'
import { paymentService } from '../services/payment.js'
import { authMiddleware } from '../middleware/auth.js'
import { config } from '../config/index.js'

const router = Router()

router.get('/packages', (_req, res) => {
  res.json(config.token.packages)
})

router.post('/purchase', authMiddleware, async (req, res, next) => {
  try {
    const result = await paymentService.createPurchase(req.user!.userId, req.body.packageIndex)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'] as string
    const result = await paymentService.handleStripeWebhook(req.body, signature)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    const history = await paymentService.getPurchaseHistory(req.user!.userId)
    res.json(history)
  } catch (err) {
    next(err)
  }
})

export default router
