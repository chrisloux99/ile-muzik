import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const purchaseSchema = z.object({
  packageIndex: z.number().int().min(0).max(3),
  paymentMethodId: z.string().optional(),
})

export const subscribeSchema = z.object({
  tier: z.enum(['BASIC', 'PREMIUM']),
})

export const streamRecordSchema = z.object({
  trackId: z.string().min(1),
  trackName: z.string().optional(),
  artistName: z.string().optional(),
  duration: z.number().int().min(0).optional(),
})

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.errors.map(e => e.message).join(', ')
    throw new ValidationError(errors)
  }
  return result.data
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
