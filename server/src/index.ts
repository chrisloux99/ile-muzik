import express from 'express'
import cors from 'cors'
import { config } from './config/index.js'
import { connectDB, disconnectDB } from './config/database.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import paymentRoutes from './routes/payments.js'
import subscriptionRoutes from './routes/subscriptions.js'
import streamRoutes from './routes/streams.js'

const app = express()

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}))

// Stripe webhook needs raw body
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))

// JSON parsing for other routes
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'iLe-Play API', version: '1.0.0' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/streams', streamRoutes)

// Error handler
app.use(errorHandler)

// Start server
async function start() {
  await connectDB()

  app.listen(config.port, () => {
    console.log(`[Server] iLe-Play API running on port ${config.port}`)
    console.log(`[Server] CORS origin: ${config.corsOrigin}`)
    console.log(`[Server] Stellar network: ${config.stellar.network}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

process.on('SIGINT', async () => {
  await disconnectDB()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await disconnectDB()
  process.exit(0)
})
