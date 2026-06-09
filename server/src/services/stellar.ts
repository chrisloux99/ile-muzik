import { config } from '../config/index.js'
import { logger } from '../config/logger.js'

let StellarSdk: any = null

async function loadSdk() {
  if (!StellarSdk) {
    try {
      StellarSdk = await import('stellar-sdk')
    } catch {
      if (config.isProduction) {
        throw new Error('stellar-sdk is required in production')
      }
      logger.warn('[Stellar] stellar-sdk not installed - wallet features disabled')
    }
  }
  return StellarSdk
}

function getServer(): string {
  return config.stellar.isTestnet
    ? 'https://horizon-testnet.stellar.org'
    : 'https://horizon.stellar.org'
}

function getNetworkPassphrase(): string {
  return config.stellar.isTestnet
    ? 'Test SDF Network ; September 2015'
    : 'Public Global Stellar Network ; September 2015'
}

export class StellarService {
  private issuerKeypair: any = null
  private distributorKeypair: any = null
  private initialized = false

  private async init() {
    if (this.initialized) return
    const sdk = await loadSdk()
    if (!sdk) return

    if (config.stellar.issuerSecret) {
      this.issuerKeypair = sdk.Keypair.fromSecret(config.stellar.issuerSecret)
    }
    if (config.stellar.distributorSecret) {
      this.distributorKeypair = sdk.Keypair.fromSecret(config.stellar.distributorSecret)
    }
    this.initialized = true
  }

  get issuerPublicKey(): string {
    return this.issuerKeypair?.publicKey() || ''
  }

  get distributorPublicKey(): string {
    return this.distributorKeypair?.publicKey() || ''
  }

  async generateKeypair() {
    const sdk = await loadSdk()
    if (!sdk) {
      if (config.isProduction) throw new Error('Stellar SDK not available')
      return { publicKey: 'MOCK_' + Date.now(), secret: 'MOCK_SECRET_' + Date.now() }
    }
    const keypair = sdk.Keypair.random()
    return {
      publicKey: keypair.publicKey(),
      secret: keypair.secret(),
    }
  }

  async createAccount(publicKey: string): Promise<string> {
    await this.init()
    const sdk = await loadSdk()
    if (!sdk) {
      if (config.isProduction) throw new Error('Stellar SDK not available')
      return publicKey
    }

    try {
      if (config.stellar.isTestnet) {
        const response = await fetch(
          `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
        )
        if (!response.ok) throw new Error('Friendbot funding failed')
        logger.info(`[Stellar] Funded account via friendbot`)
        return publicKey
      }

      if (!this.distributorKeypair) throw new Error('Distributor not configured')

      const horizonServer = new sdk.Horizon.Server(getServer())
      const distributorAccount = await horizonServer.loadAccount(this.distributorKeypair.publicKey())
      const transaction = new sdk.TransactionBuilder(distributorAccount, {
        fee: sdk.BASE_FEE,
        networkPassphrase: getNetworkPassphrase(),
      })
        .addOperation(
          sdk.Operation.createAccount({
            destination: publicKey,
            startingBalance: '2',
          })
        )
        .setTimeout(30)
        .build()

      transaction.sign(this.distributorKeypair)
      await horizonServer.submitTransaction(transaction)
      logger.info(`[Stellar] Created account`)
      return publicKey
    } catch (err: any) {
      logger.error(`[Stellar] Create account failed: ${err.message}`)
      throw err
    }
  }

  async createTrustline(secret: string): Promise<string> {
    await this.init()
    const sdk = await loadSdk()
    if (!sdk) {
      if (config.isProduction) throw new Error('Stellar SDK not available')
      return 'MOCK_TX'
    }

    try {
      const keypair = sdk.Keypair.fromSecret(secret)
      const horizonServer = new sdk.Horizon.Server(getServer())
      const account = await horizonServer.loadAccount(keypair.publicKey())
      const asset = new sdk.Asset(config.token.assetCode, this.issuerPublicKey)

      const transaction = new sdk.TransactionBuilder(account, {
        fee: sdk.BASE_FEE,
        networkPassphrase: getNetworkPassphrase(),
      })
        .addOperation(sdk.Operation.changeTrust({ asset }))
        .setTimeout(30)
        .build()

      transaction.sign(keypair)
      const result = await horizonServer.submitTransaction(transaction)
      logger.info(`[Stellar] Trustline created`)
      return result.hash
    } catch (err: any) {
      logger.error(`[Stellar] Trustline failed: ${err.message}`)
      throw err
    }
  }

  async sendTokens(destinationPublicKey: string, amount: string): Promise<string> {
    await this.init()
    const sdk = await loadSdk()
    if (!sdk) {
      if (config.isProduction) throw new Error('Stellar SDK not available')
      return 'MOCK_TX_HASH'
    }

    try {
      if (!this.distributorKeypair) throw new Error('Distributor not configured')

      const asset = new sdk.Asset(config.token.assetCode, this.issuerPublicKey)
      const horizonServer = new sdk.Horizon.Server(getServer())
      const distributorAccount = await horizonServer.loadAccount(this.distributorKeypair.publicKey())

      const transaction = new sdk.TransactionBuilder(distributorAccount, {
        fee: sdk.BASE_FEE,
        networkPassphrase: getNetworkPassphrase(),
      })
        .addOperation(
          sdk.Operation.payment({
            destination: destinationPublicKey,
            asset,
            amount,
          })
        )
        .setTimeout(30)
        .build()

      transaction.sign(this.distributorKeypair)
      const result = await horizonServer.submitTransaction(transaction)
      logger.info(`[Stellar] Sent ${amount} ${config.token.assetCode}`)
      return result.hash
    } catch (err: any) {
      logger.error(`[Stellar] Send tokens failed: ${err.message}`)
      throw err
    }
  }

  async getBalance(publicKey: string): Promise<string> {
    await this.init()
    const sdk = await loadSdk()
    if (!sdk) {
      if (config.isProduction) throw new Error('Stellar SDK not available')
      return '0'
    }

    try {
      const horizonServer = new sdk.Horizon.Server(getServer())
      const account = await horizonServer.loadAccount(publicKey)
      const asset = config.token.assetCode
      const balance = account.balances.find(
        (b: any) => b.asset_code === asset && b.asset_issuer === this.issuerPublicKey
      )
      return balance ? balance.balance : '0'
    } catch {
      return '0'
    }
  }

  async getTransactionHistory(publicKey: string, limit = 20) {
    await this.init()
    const sdk = await loadSdk()
    if (!sdk) {
      if (config.isProduction) throw new Error('Stellar SDK not available')
      return []
    }

    try {
      const horizonServer = new sdk.Horizon.Server(getServer())
      const payments = await horizonServer
        .payments()
        .forAccount(publicKey)
        .order('desc')
        .limit(limit)
        .call()
      return payments.records
    } catch {
      return []
    }
  }
}

export const stellarService = new StellarService()
