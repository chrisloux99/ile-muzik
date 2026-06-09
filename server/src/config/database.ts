import { PrismaClient } from '@prisma/client'
import { logger } from './logger.js'

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

export async function connectDB() {
  try {
    await prisma.$connect()
    logger.info('Database connected')
  } catch (err: any) {
    logger.error(`Database connection failed: ${err.message}`)
    process.exit(1)
  }
}

export async function disconnectDB() {
  await prisma.$disconnect()
  logger.info('Database disconnected')
}
