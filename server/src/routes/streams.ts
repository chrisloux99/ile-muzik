import { Router } from 'express'
import { streamService } from '../services/stream.js'
import { authMiddleware } from '../middleware/auth.js'
import { validate, streamRecordSchema } from '../utils/validation.js'

const router = Router()

router.post('/record', authMiddleware, async (req, res, next) => {
  try {
    const data = validate(streamRecordSchema, req.body)
    const result = await streamService.recordStream(req.user!.userId, data)
    res.json(result)
  } catch (err: any) {
    if (err.message.includes('limit reached')) {
      return res.status(403).json({ error: err.message })
    }
    next(err)
  }
})

router.get('/can-play', authMiddleware, async (req, res, next) => {
  try {
    const result = await streamService.canPlay(req.user!.userId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const history = await streamService.getStreamHistory(req.user!.userId, limit)
    res.json(history)
  } catch (err) {
    next(err)
  }
})

router.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    const stats = await streamService.getStreamStats(req.user!.userId)
    res.json(stats)
  } catch (err) {
    next(err)
  }
})

export default router
