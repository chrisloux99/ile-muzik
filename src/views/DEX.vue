<template>
  <div class="dex">
    <div class="dex__header">
      <h1 class="dex__title">
        <ui5-icon name="business-objects-experience" class="dex__title-icon"></ui5-icon>
        DEX
      </h1>
      <ui5-button design="Transparent" @click="load" :disabled="loading">
        <ui5-icon name="refresh" :class="{ 'spinning': loading }"></ui5-icon>
      </ui5-button>
    </div>

    <ui5-card class="dex__price">
      <div class="dex__price-content">
        <div class="dex__price-main">
          <span class="dex__price-label">ILE / XLM</span>
          <span class="dex__price-value">{{ price.midPrice.toFixed(7) }}</span>
        </div>
        <div class="dex__price-details">
          <div>
            <span class="dex__price-detail-label">Bid</span>
            <span>{{ price.bestBid.toFixed(7) }}</span>
          </div>
          <div>
            <span class="dex__price-detail-label">Ask</span>
            <span>{{ price.bestAsk.toFixed(7) }}</span>
          </div>
          <div>
            <span class="dex__price-detail-label">Spread</span>
            <span>{{ price.spread.toFixed(7) }}</span>
          </div>
        </div>
      </div>
    </ui5-card>

    <div class="dex__columns">
      <ui5-card class="dex__orderbook">
        <h2>Orderbook</h2>
        <div class="dex__book-section">
          <h3>Bids</h3>
          <div class="dex__book-entries">
            <div v-for="(bid, i) in orderbook.bids.slice(0, 10)" :key="i" class="dex__entry dex__entry--bid">
              <span>{{ parseFloat(bid.price).toFixed(7) }}</span>
              <span>{{ parseFloat(bid.amount).toFixed(2) }}</span>
            </div>
          </div>
        </div>
        <div class="dex__book-section">
          <h3>Asks</h3>
          <div class="dex__book-entries">
            <div v-for="(ask, i) in orderbook.asks.slice(0, 10)" :key="i" class="dex__entry dex__entry--ask">
              <span>{{ parseFloat(ask.price).toFixed(7) }}</span>
              <span>{{ parseFloat(ask.amount).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </ui5-card>

      <ui5-card class="dex__trades">
        <h2>Recent Trades</h2>
        <div class="dex__trade-list">
          <div v-for="trade in trades.slice(0, 20)" :key="trade.id" class="dex__trade">
            <span class="dex__trade-price">{{ trade.price.toFixed(7) }}</span>
            <span class="dex__trade-amount">{{ parseFloat(trade.amount).toFixed(2) }}</span>
            <span class="dex__trade-time">{{ new Date(trade.timestamp).toLocaleTimeString() }}</span>
          </div>
        </div>
      </ui5-card>
    </div>

    <ui5-card class="dex__asset" v-if="assetInfo.found">
      <h2>ILE Token Info</h2>
      <div class="dex__asset-grid">
        <div>
          <span class="dex__asset-label">Holders</span>
          <span class="dex__asset-value">{{ assetInfo.numAccounts || 0 }}</span>
        </div>
        <div>
          <span class="dex__asset-label">Total Supply</span>
          <span class="dex__asset-value">{{ parseFloat(assetInfo.amount || '0').toFixed(2) }}</span>
        </div>
      </div>
    </ui5-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import type { Orderbook, MarketPrice, Trade, AssetInfo } from '@/api/types'

const loading = ref(false)
const orderbook = ref<Orderbook>({ bids: [], asks: [], base: 'ILE', counter: 'XLM' })
const price = ref<MarketPrice>({ base: 'ILE', quote: 'XLM', bestBid: 0, bestAsk: 0, midPrice: 0, spread: 0 })
const trades = ref<Trade[]>([])
const assetInfo = ref<AssetInfo>({ code: 'ILE', issuer: '', found: false })

async function load() {
  loading.value = true
  try {
    const [ob, p, t, ai] = await Promise.all([
      api.getOrderbook(),
      api.getMarketPrice(),
      api.getTradeHistory(),
      api.getAssetInfo(),
    ])
    orderbook.value = ob
    price.value = p
    trades.value = t
    assetInfo.value = ai
  } catch (err: any) {
    console.error('Failed to load DEX data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.dex {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.5rem;
  }

  &__price-content {
    padding: 1.5rem;
  }

  &__price-main {
    text-align: center;
    margin-bottom: 1rem;
  }

  &__price-label {
    display: block;
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }

  &__price-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__price-details {
    display: flex;
    justify-content: space-around;
    text-align: center;

    div {
      display: flex;
      flex-direction: column;
    }
  }

  &__price-detail-label {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  &__columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  &__orderbook, &__trades {
    padding: 1rem;

    h2 {
      margin: 0 0 1rem;
      font-size: 1rem;
    }

    h3 {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
  }

  &__book-entries {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__entry {
    display: flex;
    justify-content: space-between;
    padding: 4px 8px;
    font-size: 0.8rem;
    font-family: monospace;
    border-radius: 4px;

    &--bid {
      background: rgba(76, 175, 80, 0.1);
    }

    &--ask {
      background: rgba(244, 67, 54, 0.1);
    }
  }

  &__trade-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__trade {
    display: flex;
    gap: 1rem;
    padding: 4px 8px;
    font-size: 0.8rem;
    font-family: monospace;
  }

  &__trade-price {
    flex: 1;
  }

  &__trade-amount {
    flex: 1;
    text-align: right;
  }

  &__trade-time {
    color: var(--text-secondary);
    font-size: 0.75rem;
  }

  &__asset {
    padding: 1rem;

    h2 {
      margin: 0 0 1rem;
      font-size: 1rem;
    }
  }

  &__asset-grid {
    display: flex;
    gap: 2rem;
  }

  &__asset-label {
    display: block;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  &__asset-value {
    font-size: 1.25rem;
    font-weight: 600;
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
