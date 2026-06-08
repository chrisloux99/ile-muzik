import { prisma } from '../config/database.js'
import { stellarService } from './stellar.js'
import { hashPassword, comparePassword, generateToken, encryptSecret } from '../utils/crypto.js'
import { validate, registerSchema, loginSchema } from '../utils/validation.js'
import { logger } from '../config/logger.js'

type Tier = 'FREE' | 'BASIC' | 'PREMIUM'

export class AuthService {
  async register(data: unknown) {
    const input = validate(registerSchema, data)

    const existing = await prisma.user.findUnique({ where: { email: input.email } })
    if (existing) throw new Error('Email already registered')

    const passwordHash = await hashPassword(input.password)

    // Generate Stellar wallet
    const keypair = await stellarService.generateKeypair()
    const encryptedSecret = encryptSecret(keypair.secret)

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        stellarPublicKey: keypair.publicKey,
        encryptedSecret,
      },
    })

    const safeUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      tier: user.tier,
      stellarPublicKey: user.stellarPublicKey,
      createdAt: user.createdAt,
    }

    // Create and fund Stellar account (non-blocking)
    stellarService.createAccount(keypair.publicKey)
      .then(() => stellarService.createTrustline(keypair.secret))
      .then(() => console.log(`[Auth] Stellar wallet created for ${user.email}`))
      .catch((err: any) => console.warn(`[Auth] Stellar setup deferred: ${err.message}`))

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return { user: safeUser, token }
  }

  async login(data: unknown) {
    const input = validate(loginSchema, data)

    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user) throw new Error('Invalid email or password')

    const valid = await comparePassword(input.password, user.passwordHash)
    if (!valid) throw new Error('Invalid email or password')

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        tier: user.tier,
        stellarPublicKey: user.stellarPublicKey,
        streamsThisMonth: user.streamsThisMonth,
        subscriptionExpiry: user.subscriptionExpiry,
        createdAt: user.createdAt,
      },
      token,
    }
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        tier: true,
        stellarPublicKey: true,
        streamsThisMonth: true,
        streamResetDate: true,
        subscriptionExpiry: true,
        createdAt: true,
      },
    })

    if (!user) throw new Error('User not found')

    // Get token balance from Stellar
    let tokenBalance = '0'
    if (user.stellarPublicKey) {
      tokenBalance = await stellarService.getBalance(user.stellarPublicKey)
    }

    return { ...user, tokenBalance }
  }
}

export const authService = new AuthService()
