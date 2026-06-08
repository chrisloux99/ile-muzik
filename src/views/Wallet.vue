<template>
  <div class="wallet">
    <div class="wallet__header">
      <h1 class="wallet__title">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/>
        </svg>
        Wallet
      </h1>
    </div>

    <div class="wallet__hero glass">
      <div class="wallet__balance-section">
        <span class="wallet__balance-label">Your Balance</span>
        <div class="wallet__balance">
          <span class="wallet__token-symbol">
            <span class="wallet__token-icon">i</span>
          </span>
          <span class="wallet__amount">{{ balance.toFixed(4) }}</span>
          <span class="wallet__currency">iLe</span>
        </div>
        <span class="wallet__usd-equivalent">≈ ${{ usdEquivalent.toFixed(4) }} USD</span>
      </div>

      <div class="wallet__address" v-if="stellarKey">
        <span class="wallet__address-label">Stellar Wallet</span>
        <code class="wallet__address-key">{{ truncatedKey }}</code>
        <button class="wallet__copy-btn" @click="copyKey">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>
    </div>

    <section class="wallet__packages">
      <div class="wallet__section-header">
        <h2 class="wallet__section-title">Buy iLe Tokens</h2>
        <div class="wallet__section-line"></div>
      </div>

      <div class="wallet__package-grid">
        <button
          v-for="(pkg, i) in packages"
          :key="i"
          class="wallet__package glass"
          :class="{ 'wallet__package--popular': i === 2 }"
          @click="purchasePackage(i)"
          :disabled="purchasing"
        >
          <div class="wallet__package-popular" v-if="i === 2">Best Value</div>
          <div class="wallet__package-tokens">
            <span class="wallet__package-icon">i</span>
            {{ pkg.tokens.toLocaleString() }}
          </div>
          <div class="wallet__package-label">{{ pkg.label }}</div>
          <div class="wallet__package-price">${{ pkg.priceUSD.toFixed(2) }}</div>
        </button>
      </div>
    </section>

    <section class="wallet__history" v-if="transactions.length">
      <div class="wallet__section-header">
        <h2 class="wallet__section-title">Recent Activity</h2>
        <div class="wallet__section-line"></div>
      </div>

      <div class="wallet__tx-list">
        <div v-for="tx in transactions" :key="tx.id" class="wallet__tx glass">
          <div class="wallet__tx-icon" :class="'wallet__tx-icon--' + tx.type.toLowerCase()">
            <svg v-if="tx.type === 'PURCHASE'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <svg v-else-if="tx.type === 'STREAM'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/>
            </svg>
          </div>
          <div class="wallet__tx-info">
            <span class="wallet__tx-type">{{ tx.type }}</span>
            <span class="wallet__tx-date">{{ new Date(tx.createdAt).toLocaleDateString() }}</span>
          </div>
          <div class="wallet__tx-amount" :class="tx.type === 'PURCHASE' ? 'wallet__tx-amount--positive' : 'wallet__tx-amount--negative'">
            {{ tx.type === 'PURCHASE' ? '+' : '-' }}{{ parseFloat(tx.tokenAmount).toFixed(2) }} iLe
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/app'
import type { Transaction, TokenPackage } from '@/api/types'

const appStore = useAppStore()
const balance = ref(0)
const stellarKey = ref('')
const packages = ref<TokenPackage[]>([])
const transactions = ref<Transaction[]>([])
const purchasing = ref(false)

const usdEquivalent = computed(() => balance.value * 0.001)
const truncatedKey = computed(() => {
  if (!stellarKey.value) return ''
  return stellarKey.value.slice(0, 8) + '...' + stellarKey.value.slice(-6)
})

async function load() {
  try {
    const [profile, pkgs, history] = await Promise.all([
      api.getProfile(),
      api.getTokenPackages(),
      api.getPurchaseHistory(),
    ])
    balance.value = parseFloat(profile.tokenBalance || '0')
    stellarKey.value = profile.stellarPublicKey || ''
    packages.value = pkgs
    transactions.value = history
  } catch (e) {
    console.error('[Wallet]', e)
  }
}

async function purchasePackage(index: number) {
  purchasing.value = true
  try {
    const result = await api.purchaseTokens(index)
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl
    } else {
      await load()
      appStore.refreshProfile()
    }
  } catch (e: any) {
    alert(e.message || 'Purchase failed')
  } finally {
    purchasing.value = false
  }
}

function copyKey() {
  if (stellarKey.value) {
    navigator.clipboard.writeText(stellarKey.value)
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.wallet {
  padding: 0 28px 40px;
  position: relative;
  z-index: 1;

  &__header {
    padding: 40px 0 24px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 900;
  }

  &__hero {
    border-radius: var(--radius-lg);
    padding: 32px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--gold), var(--amber), var(--violet));
    }

    &::after {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 215, 0, 0.06) 0%, transparent 70%);
      pointer-events: none;
    }
  }

  &__balance-label {
    font-size: 0.78rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 500;
  }

  &__balance {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 12px 0 8px;
  }

  &__token-symbol {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), var(--amber));
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
  }

  &__token-icon {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 900;
    color: var(--void);
  }

  &__amount {
    font-family: var(--font-mono);
    font-size: 2.4rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--gold), var(--amber-bright));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &__currency {
    font-size: 1rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  &__usd-equivalent {
    font-size: 0.82rem;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  &__address {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--glass-border);
    display: flex;
    align-items: center;
    gap: 10px;

    &-label {
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    &-key {
      font-family: var(--font-mono);
      font-size: 0.82rem;
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.04);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
    }
  }

  &__copy-btn {
    padding: 6px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);

    &:hover {
      color: var(--violet-bright);
      border-color: rgba(120, 80, 255, 0.3);
    }
  }

  &__section-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  &__section-title {
    font-size: 1.1rem;
    font-weight: 700;
    white-space: nowrap;
    font-family: var(--font-display);
  }

  &__section-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(120, 80, 255, 0.2), transparent);
  }

  &__package-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }

  &__package {
    padding: 24px 20px;
    border-radius: var(--radius);
    text-align: center;
    cursor: pointer;
    transition: all var(--transition-smooth);
    position: relative;
    overflow: hidden;

    &:hover:not(:disabled) {
      border-color: rgba(120, 80, 255, 0.3);
      transform: translateY(-4px);
      box-shadow: var(--shadow-glow);
    }

    &--popular {
      border-color: rgba(255, 215, 0, 0.3);

      &:hover:not(:disabled) {
        border-color: rgba(255, 215, 0, 0.5);
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.15);
      }
    }

    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  &__package-popular {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 4px;
    background: linear-gradient(90deg, var(--gold), var(--amber));
    color: var(--void);
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__package-tokens {
    font-family: var(--font-mono);
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--gold);
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  &__package-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), var(--amber));
    color: var(--void);
    font-family: var(--font-display);
    font-size: 0.75rem;
    font-weight: 900;
  }

  &__package-label {
    font-size: 0.72rem;
    color: var(--text-secondary);
    margin: 6px 0;
  }

  &__package-price {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__tx-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__tx {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: var(--radius);
  }

  &__tx-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &--purchase {
      background: rgba(0, 230, 118, 0.1);
      color: var(--emerald);
    }
    &--stream {
      background: rgba(120, 80, 255, 0.1);
      color: var(--violet-bright);
    }
    &--subscription {
      background: rgba(0, 229, 255, 0.1);
      color: var(--cyan);
    }
  }

  &__tx-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__tx-type {
    font-size: 0.85rem;
    font-weight: 600;
  }

  &__tx-date {
    font-size: 0.72rem;
    color: var(--text-muted);
  }

  &__tx-amount {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    font-weight: 600;

    &--positive { color: var(--emerald); }
    &--negative { color: var(--text-secondary); }
  }
}
</style>
