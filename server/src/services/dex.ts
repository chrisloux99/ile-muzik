import { config } from '../config/index.js'
import { logger } from '../config/logger.js'

let StellarSdk: any = null

async function loadSdk() {
  if (!StellarSdk) {
    try {
      StellarSdk = await import('stellar-sdk')
    } catch {
      if (config.isProduction) throw new Error('stellar-sdk required')
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

export class DexService {
  async getOrderbook(sellingAsset: string, buyingAsset: string) {
    const sdk = await loadSdk()
    if (!sdk) throw new Error('Stellar SDK not available')

    const horizonServer = new sdk.Horizon.Server(getServer())

    const selling = sellingAsset === 'XLM'
      ? sdk.Asset.native()
      : new sdk.Asset(sellingAsset, config.stellar.issuerSecret
          ? sdk.Keypair.fromSecret(config.stellar.issuerSecret).publicKey()
          : '')

    const buying = buyingAsset === 'XLM'
      ? sdk.Asset.native()
      : new sdk.Asset(buyingAsset, config.stellar.issuerSecret
          ? sdk.Keypair.fromSecret(config.stellar.issuerSecret).publicKey()
          : '')

    const orderbook = await horizonServer.orderbook(selling, buying).call()

    return {
      bids: orderbook.bids.map((b: any) => ({
        price: b.price,
        amount: b.amount,
      })),
      asks: orderbook.asks.map((a: any) => ({
        price: a.price,
        amount: a.amount,
      })),
      base: sellingAsset,
      counter: buyingAsset,
    }
  }

  async getTradeHistory(sellingAsset: string, buyingAsset: string, limit = 20) {
    const sdk = await loadSdk()
    if (!sdk) throw new Error('Stellar SDK not available')

    const horizonServer = new sdk.Horizon.Server(getServer())

    const selling = sellingAsset === 'XLM'
      ? sdk.Asset.native()
      : new sdk.Asset(sellingAsset, config.stellar.issuerSecret
          ? sdk.Keypair.fromSecret(config.stellar.issuerSecret).publicKey()
          : '')

    const buying = buyingAsset === 'XLM'
      ? sdk.Asset.native()
      : new sdk.Asset(buyingAsset, config.stellar.issuerSecret
          ? sdk.Keypair.fromSecret(config.stellar.issuerSecret).publicKey()
          : '')

    const trades = await horizonServer
      .trades()
      .forAssetPair(selling, buying)
      .order('desc')
      .limit(limit)
      .call()

    return trades.records.map((t: any) => ({
      id: t.id,
      price: t.price.n / t.price.d,
      amount: t.base_amount,
      timestamp: t.ledger_close_time,
    }))
  }

  async getMarketPrice(baseAsset: string, quoteAsset: string) {
    const sdk = await loadSdk()
    if (!sdk) throw new Error('Stellar SDK not available')

    const horizonServer = new sdk.Horizon.Server(getServer())

    const base = baseAsset === 'XLM'
      ? sdk.Asset.native()
      : new sdk.Asset(baseAsset, config.stellar.issuerSecret
          ? sdk.Keypair.fromSecret(config.stellar.issuerSecret).publicKey()
          : '')

    const quote = quoteAsset === 'XLM'
      ? sdk.Asset.native()
      : new sdk.Asset(quoteAsset, config.stellar.issuerSecret
          ? sdk.Keypair.fromSecret(config.stellar.issuerSecret).publicKey()
          : '')

    const orderbook = await horizonServer.orderbook(base, quote).call()

    // Calculate mid price from best bid and ask
    const bestBid = orderbook.bids[0] ? parseFloat(orderbook.bids[0].price) : 0
    const bestAsk = orderbook.asks[0] ? parseFloat(orderbook.asks[0].price) : 0
    const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid || bestAsk

    return {
      base: baseAsset,
      quote: quoteAsset,
      bestBid,
      bestAsk,
      midPrice,
      spread: bestAsk && bestBid ? bestAsk - bestBid : 0,
    }
  }

  async getAssetInfo() {
    const sdk = await loadSdk()
    if (!sdk) throw new Error('Stellar SDK not available')

    const horizonServer = new sdk.Horizon.Server(getServer())
    const issuerKeypair = config.stellar.issuerSecret
      ? sdk.Keypair.fromSecret(config.stellar.issuerSecret)
      : null

    if (!issuerKeypair) throw new Error('Issuer not configured')

    const assetCode = config.token.assetCode
    const issuer = issuerKeypair.publicKey()

    try {
      const assets = await horizonServer
        .assets()
        .forCode(assetCode)
        .forIssuer(issuer)
        .call()

      const asset = assets.records[0]
      if (!asset) {
        return {
          code: assetCode,
          issuer,
          found: false,
        }
      }

      return {
        code: assetCode,
        issuer,
        found: true,
        numAccounts: asset.num_accounts,
        amount: asset.amount,
        numClaimableBalances: asset.num_claimable_balances,
        flags: asset.flags,
      }
    } catch {
      return {
        code: assetCode,
        issuer,
        found: false,
      }
    }
  }
}

export const dexService = new DexService()
