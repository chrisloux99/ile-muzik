import { Router } from 'express'
import { dexService } from '../services/dex.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/orderbook', async (req, res, next) => {
  try {
    const selling = (req.query.selling as string) || 'ILE'
    const buying = (req.query.buying as string) || 'XLM'
    const orderbook = await dexService.getOrderbook(selling, buying)
    res.json(orderbook)
  } catch (err) {
    next(err)
  }
})

router.get('/trades', async (req, res, next) => {
  try {
    const selling = (req.query.selling as string) || 'ILE'
    const buying = (req.query.buying as string) || 'XLM'
    const limit = parseInt(req.query.limit as string) || 20
    const trades = await dexService.getTradeHistory(selling, buying, limit)
    res.json(trades)
  } catch (err) {
    next(err)
  }
})

router.get('/price', async (req, res, next) => {
  try {
    const base = (req.query.base as string) || 'ILE'
    const quote = (req.query.quote as string) || 'XLM'
    const price = await dexService.getMarketPrice(base, quote)
    res.json(price)
  } catch (err) {
    next(err)
  }
})

router.get('/asset', async (_req, res, next) => {
  try {
    const info = await dexService.getAssetInfo()
    res.json(info)
  } catch (err) {
    next(err)
  }
})

export default router
