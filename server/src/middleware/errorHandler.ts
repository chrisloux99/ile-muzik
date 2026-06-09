import type { Request, Response, NextFunction } from 'express'
import { ValidationError } from '../utils/validation.js'
import { logger } from '../config/logger.js'
import { config } from '../config/index.js'

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error(`${req.method} ${req.path}: ${err.message}`)
  if (!config.isProduction) {
    logger.debug(err.stack || '')
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message })
  }

  const message = config.isProduction ? 'Internal server error' : err.message
  return res.status(500).json({ error: message })
}
