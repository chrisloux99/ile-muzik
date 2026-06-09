import { Router } from 'express'
import { paymentService } from '../services/payment.js'
import { authMiddleware } from '../middleware/auth.js'
import { validate, purchaseSchema, sendTokensSchema } from '../utils/validation.js'
import { config } from '../config/index.js'

const router = Router()

router.get('/packages', (_req, res) => {
  res.json(config.token.packages)
})

router.post('/purchase', authMiddleware, async (req, res, next) => {
  try {
    const { packageIndex } = validate(purchaseSchema, req.body)
    const result = await paymentService.createPurchase(req.user!.userId, packageIndex)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/send', authMiddleware, async (req, res, next) => {
  try {
    const { recipientAddress, amount } = validate(sendTokensSchema, req.body)
    const result = await paymentService.sendTokens(req.user!.userId, recipientAddress, amount)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'] as string
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' })
    }
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
