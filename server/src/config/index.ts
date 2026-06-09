import dotenv from 'dotenv'
dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback
  if (isProduction && !value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value || ''
}

if (isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters in production')
  }
  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
    throw new Error('ENCRYPTION_KEY must be set and at least 32 characters in production')
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isProduction,

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'dev-encryption-key-change-in-production',
  },

  stellar: {
    network: process.env.STELLAR_NETWORK || 'testnet',
    issuerSecret: requireEnv('STELLAR_ISSUER_SECRET'),
    distributorSecret: requireEnv('STELLAR_DISTRIBUTOR_SECRET'),
    get isTestnet() { return this.network === 'testnet' },
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },

  navidrome: {
    url: process.env.NAVIDROME_URL || 'http://localhost:4533',
    adminUser: process.env.NAVIDROME_ADMIN_USER || 'ilemusiq',
    adminPass: process.env.NAVIDROME_ADMIN_PASS || 'iledecoin',
  },

  token: {
    assetCode: 'ILE',
    ratePerStream: 0.01,
    usdPerToken: 0.001,
    packages: [
      { tokens: 100, priceUSD: 0.10, label: '100 iLe' },
      { tokens: 1000, priceUSD: 1.00, label: '1,000 iLe' },
      { tokens: 5000, priceUSD: 4.50, label: '5,000 iLe' },
      { tokens: 10000, priceUSD: 8.00, label: '10,000 iLe' },
    ],
  },

  subscriptions: {
    tiers: {
      FREE: { priceUSD: 0, streamLimit: 20, label: 'Free' },
      BASIC: { priceUSD: 2.00, streamLimit: 200, label: 'Basic' },
      PREMIUM: { priceUSD: 5.00, streamLimit: -1, label: 'Premium' },
    },
    gracePeriodDays: 3,
  },
}
