import type { Request, Response, NextFunction } from 'express'
import { ValidationError } from '../utils/validation.js'

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message)
  console.error(err.stack)

  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message })
  }

  return res.status(500).json({ error: err.message || 'Internal server error' })
}
