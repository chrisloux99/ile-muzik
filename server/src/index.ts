import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { config } from './config/index.js'
import { connectDB, disconnectDB } from './config/database.js'
import { errorHandler } from './middleware/errorHandler.js'
import { logger } from './config/logger.js'
import authRoutes from './routes/auth.js'
import paymentRoutes from './routes/payments.js'
import subscriptionRoutes from './routes/subscriptions.js'
import streamRoutes from './routes/streams.js'
import navidromeRoutes from './routes/navidrome.js'
import burnRoutes from './routes/burns.js'
import stakingRoutes from './routes/staking.js'
import payoutRoutes from './routes/payouts.js'
import governanceRoutes from './routes/governance.js'
import dexRoutes from './routes/dex.js'

const app = express()

// Security headers
app.use(helmet())

// CORS
const corsOrigin = config.corsOrigin
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin,
  credentials: corsOrigin !== '*',
}))

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/auth', authLimiter)
app.use('/api/payments', paymentLimiter)
app.use('/api', generalLimiter)

// Stripe webhook needs raw body (must be before json parser)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))

// JSON parsing for other routes
app.use(express.json({ limit: '10kb' }))

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    const { prisma } = await import('./config/database.js')
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', name: 'iLe-Play API', version: '1.0.0' })
  } catch {
    res.status(503).json({ status: 'unhealthy', error: 'Database connection failed' })
  }
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/streams', streamRoutes)
app.use('/api/navidrome', navidromeRoutes)
app.use('/api/burns', burnRoutes)
app.use('/api/staking', stakingRoutes)
app.use('/api/payouts', payoutRoutes)
app.use('/api/governance', governanceRoutes)
app.use('/api/dex', dexRoutes)

// Error handler
app.use(errorHandler)

// Start server
let server: ReturnType<typeof app.listen> | null = null

async function start() {
  await connectDB()

  server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(`iLe-Play API running on port ${config.port}`)
    logger.info(`CORS origin: ${config.corsOrigin}`)
    logger.info(`Stellar network: ${config.stellar.network}`)
    logger.info(`Environment: ${config.isProduction ? 'production' : 'development'}`)
  })
}

start().catch((err) => {
  logger.error('Failed to start server:', err.message)
  process.exit(1)
})

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`)

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed')
    })
  }

  // Force kill after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)

  await disconnectDB()
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason)
})

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err.message)
  process.exit(1)
})
