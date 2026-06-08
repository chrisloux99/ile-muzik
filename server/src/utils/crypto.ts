import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { config } from '../config/index.js'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions)
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, config.jwt.secret) as JWTPayload
}

export function encryptSecret(secret: string): string {
  // Simple base64 encoding for dev; use proper encryption in production
  return Buffer.from(secret).toString('base64')
}

export function decryptSecret(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8')
}
