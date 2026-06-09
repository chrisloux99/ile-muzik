import { Router } from 'express'
import { authService } from '../services/auth.js'
import { authMiddleware } from '../middleware/auth.js'
import { validate, registerSchema, loginSchema } from '../utils/validation.js'

const router = Router()

router.post('/register', async (req, res, next) => {
  try {
    const data = validate(registerSchema, req.body)
    const result = await authService.register(data)
    res.status(201).json(result)
  } catch (err: any) {
    if (err.message === 'Email already registered') {
      return res.status(409).json({ error: err.message })
    }
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const data = validate(loginSchema, req.body)
    const result = await authService.login(data)
    res.json(result)
  } catch (err: any) {
    if (err.message === 'Invalid email or password') {
      return res.status(401).json({ error: err.message })
    }
    next(err)
  }
})

router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user!.userId)
    res.json(profile)
  } catch (err) {
    next(err)
  }
})

export default router
