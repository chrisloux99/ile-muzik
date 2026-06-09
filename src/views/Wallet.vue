<template>
  <div class="wallet">
    <div class="wallet__header">
      <h1 class="wallet__title">
        <ui5-icon name="wallet" class="wallet__title-icon"></ui5-icon>
        Wallet
      </h1>
      <ui5-button design="Transparent" @click="load" :disabled="refreshing" class="wallet__refresh-btn">
        <ui5-icon name="refresh" :class="{ 'spinning': refreshing }"></ui5-icon>
      </ui5-button>
    </div>

    <ui5-card class="wallet__hero">
      <div class="wallet__hero-content">
        <div class="wallet__balance-section">
          <span class="wallet__balance-label">Your Balance</span>
          <div class="wallet__balance">
            <ui5-avatar initials="i" shape="Circle" size="S" color-scheme="Accent6"></ui5-avatar>
            <span class="wallet__amount">{{ balance.toFixed(4) }}</span>
            <span class="wallet__currency">iLe</span>
          </div>
          <span class="wallet__usd-equivalent">≈ ${{ usdEquivalent.toFixed(4) }} USD</span>
        </div>

        <div class="wallet__actions">
          <ui5-button design="Emphasized" @click="scrollToPackages" class="wallet__action-btn">
            <ui5-icon name="add" slot="icon"></ui5-icon>
            Buy Tokens
          </ui5-button>
          <ui5-button design="Transparent" @click="showSendDialog" class="wallet__action-btn">
            <ui5-icon name="paper-plane" slot="icon"></ui5-icon>
            Send
          </ui5-button>
          <ui5-button design="Transparent" @click="showReceiveDialog" class="wallet__action-btn">
            <ui5-icon name="download" slot="icon"></ui5-icon>
            Receive
          </ui5-button>
        </div>

        <div class="wallet__address" v-if="stellarKey">
          <span class="wallet__address-label">Stellar Wallet</span>
          <code class="wallet__address-key">{{ truncatedKey }}</code>
          <ui5-button design="Transparent" @click="copyKey" class="wallet__copy-btn">
            <ui5-icon :name="copied ? 'accept' : 'copy'"></ui5-icon>
          </ui5-button>
        </div>
      </div>
    </ui5-card>

    <section class="wallet__packages" id="packages-section">
      <div class="wallet__section-header">
        <h2 class="wallet__section-title">Buy iLe Tokens</h2>
        <div class="wallet__section-line"></div>
      </div>

      <div class="wallet__package-grid">
        <ui5-card
          v-for="(pkg, i) in packages"
          :key="i"
          class="wallet__package"
          :class="{ 'wallet__package--popular': i === 2 }"
          @click="purchasePackage(i)"
          interactive
          :disabled="purchasing"
        >
          <ui5-tag v-if="i === 2" class="wallet__package-badge" design="Positive">Best Value</ui5-tag>
          <div class="wallet__package-content">
            <div class="wallet__package-tokens">
              <ui5-avatar initials="i" shape="Circle" size="XS" color-scheme="Accent6"></ui5-avatar>
              {{ pkg.tokens.toLocaleString() }}
            </div>
            <div class="wallet__package-label">{{ pkg.label }}</div>
            <div class="wallet__package-price">${{ pkg.priceUSD.toFixed(2) }}</div>
            <div class="wallet__package-per">{{ (pkg.priceUSD / pkg.tokens).toFixed(4) }} / token</div>
          </div>
        </ui5-card>
      </div>
    </section>

    <section class="wallet__history">
      <div class="wallet__section-header">
        <h2 class="wallet__section-title">Recent Activity</h2>
        <div class="wallet__section-line"></div>
      </div>

      <div v-if="transactions.length" class="wallet__tx-list">
        <ui5-card v-for="tx in transactions" :key="tx.id" class="wallet__tx">
          <div class="wallet__tx-content">
            <div class="wallet__tx-icon" :class="'wallet__tx-icon--' + tx.type.toLowerCase()">
              <ui5-icon :name="getTxIcon(tx.type)"></ui5-icon>
            </div>
            <div class="wallet__tx-info">
              <span class="wallet__tx-type">{{ formatTxType(tx.type) }}</span>
              <span class="wallet__tx-date">{{ formatDate(tx.createdAt) }}</span>
            </div>
            <div class="wallet__tx-amount" :class="tx.type === 'PURCHASE' ? 'wallet__tx-amount--positive' : 'wallet__tx-amount--negative'">
              {{ tx.type === 'PURCHASE' ? '+' : '-' }}{{ parseFloat(tx.tokenAmount).toFixed(2) }} iLe
            </div>
          </div>
        </ui5-card>
      </div>

      <ui5-card v-else class="wallet__empty">
        <ui5-icon name="wallet" class="wallet__empty-icon"></ui5-icon>
        <p>No transactions yet</p>
        <span>Your purchase and stream history will appear here</span>
      </ui5-card>
    </section>

    <ui5-dialog ref="sendDialog" header-text="Send iLe Tokens">
      <div class="dialog-content">
        <ui5-input
          v-model="sendAddress"
          placeholder="Enter Stellar address"
          class="dialog-input"
        >
          <ui5-label slot="label">Recipient Address</ui5-label>
        </ui5-input>

        <ui5-input
          v-model="sendAmount"
          type="Number"
          placeholder="0.00"
          class="dialog-input"
        >
          <ui5-label slot="label">Amount (iLe)</ui5-label>
          <span slot="valueStateMessage">Balance: {{ balance.toFixed(4) }} iLe</span>
        </ui5-input>
      </div>

      <div slot="footer" class="dialog-footer">
        <ui5-button design="Transparent" @click="closeSendDialog">Cancel</ui5-button>
        <ui5-button design="Emphasized" @click="handleSend" :disabled="!sendAddress || !sendAmount">
          Send Tokens
        </ui5-button>
      </div>
    </ui5-dialog>

    <ui5-dialog ref="receiveDialog" header-text="Receive iLe Tokens">
      <div class="dialog-content">
        <p class="dialog-description">Share your Stellar address to receive iLe tokens from other users.</p>
        <div class="dialog-address">
          <code>{{ stellarKey }}</code>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <ui5-button design="Emphasized" @click="copyKey">
          <ui5-icon name="copy" slot="icon"></ui5-icon>
          {{ copied ? 'Copied!' : 'Copy Address' }}
        </ui5-button>
        <ui5-button design="Transparent" @click="closeReceiveDialog">Done</ui5-button>
      </div>
    </ui5-dialog>

    <ui5-message-strip v-if="message" :design="messageType" class="wallet__message" @close="message = ''">
      {{ message }}
    </ui5-message-strip>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/app'
import type { Transaction, TokenPackage } from '@/api/types'

import '@ui5/webcomponents/dist/Button.js'
import '@ui5/webcomponents/dist/Card.js'
import '@ui5/webcomponents/dist/Icon.js'
import '@ui5/webcomponents/dist/Avatar.js'
import '@ui5/webcomponents/dist/Dialog.js'
import '@ui5/webcomponents/dist/Input.js'
import '@ui5/webcomponents/dist/Label.js'
import '@ui5/webcomponents/dist/Tag.js'
import '@ui5/webcomponents/dist/MessageStrip.js'
import '@ui5/webcomponents-icons/dist/wallet.js'
import '@ui5/webcomponents-icons/dist/refresh.js'
import '@ui5/webcomponents-icons/dist/add.js'
import '@ui5/webcomponents-icons/dist/paper-plane.js'
import '@ui5/webcomponents-icons/dist/download.js'
import '@ui5/webcomponents-icons/dist/copy.js'
import '@ui5/webcomponents-icons/dist/accept.js'
import '@ui5/webcomponents-icons/dist/money-bills.js'
import '@ui5/webcomponents-icons/dist/headset.js'
import '@ui5/webcomponents-icons/dist/business-card.js'

const appStore = useAppStore()
const balance = ref(0)
const stellarKey = ref('')
const packages = ref<TokenPackage[]>([])
const transactions = ref<Transaction[]>([])
const purchasing = ref(false)
const refreshing = ref(false)
const copied = ref(false)
const sendAddress = ref('')
const sendAmount = ref('')
const message = ref('')
const messageType = ref<'Information' | 'Positive' | 'Negative'>('Information')

const sendDialog = ref<any>(null)
const receiveDialog = ref<any>(null)

const usdEquivalent = computed(() => balance.value * 0.001)
const truncatedKey = computed(() => {
  if (!stellarKey.value) return ''
  return stellarKey.value.slice(0, 8) + '...' + stellarKey.value.slice(-6)
})

async function load() {
  refreshing.value = true
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
  } finally {
    refreshing.value = false
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
      showMessage('Tokens purchased successfully!', 'Positive')
    }
  } catch (e: any) {
    showMessage(e.message || 'Purchase failed', 'Negative')
  } finally {
    purchasing.value = false
  }
}

function copyKey() {
  if (stellarKey.value) {
    navigator.clipboard.writeText(stellarKey.value)
    copied.value = true
    showMessage('Address copied to clipboard!', 'Positive')
    setTimeout(() => { copied.value = false }, 2000)
  }
}

function scrollToPackages() {
  const el = document.getElementById('packages-section')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

function showSendDialog() {
  sendDialog.value?.show()
}

function closeSendDialog() {
  sendDialog.value?.close()
  sendAddress.value = ''
  sendAmount.value = ''
}

function showReceiveDialog() {
  receiveDialog.value?.show()
}

function closeReceiveDialog() {
  receiveDialog.value?.close()
}

async function handleSend() {
  if (!sendAddress.value || !sendAmount.value) return
  
  try {
    const result = await api.sendTokens(sendAddress.value, parseFloat(sendAmount.value))
    showMessage(`Successfully sent ${sendAmount.value} iLe!`, 'Positive')
    closeSendDialog()
    await load()
    appStore.refreshProfile()
  } catch (e: any) {
    showMessage(e.message || 'Send failed', 'Negative')
  }
}

function showMessage(msg: string, type: 'Information' | 'Positive' | 'Negative' = 'Information') {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 5000)
}

function getTxIcon(type: string): string {
  const icons: Record<string, string> = {
    PURCHASE: 'money-bills',
    STREAM: 'headset',
    SUBSCRIPTION: 'business-card'
  }
  return icons[type] || 'document'
}

function formatTxType(type: string): string {
  const types: Record<string, string> = {
    PURCHASE: 'Token Purchase',
    STREAM: 'Stream',
    SUBSCRIPTION: 'Subscription'
  }
  return types[type] || type
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString()
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
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 900;

    &-icon {
      font-size: 1.5rem;
      color: var(--violet-bright);
    }
  }

  &__refresh-btn {
    min-width: 40px;
    height: 40px;
  }

  &__hero {
    margin-bottom: 32px;
    border-radius: var(--radius-lg);
    overflow: hidden;

    &-content {
      padding: 32px;
      position: relative;
      background: linear-gradient(135deg, rgba(120, 80, 255, 0.05), rgba(0, 229, 255, 0.02));

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--gold), var(--amber), var(--violet));
      }
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

  &__actions {
    display: flex;
    gap: 10px;
    margin-top: 24px;
  }

  &__action-btn {
    flex: 1;
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
    min-width: 32px;
    height: 32px;
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
    margin-bottom: 32px;
  }

  &__package {
    cursor: pointer;
    transition: all var(--transition-smooth);
    position: relative;
    overflow: hidden;

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-glow);
    }

    &--popular {
      border: 2px solid rgba(255, 215, 0, 0.3);

      &:hover {
        border-color: rgba(255, 215, 0, 0.5);
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.15);
      }
    }

    &-badge {
      position: absolute;
      top: 8px;
      right: 8px;
    }

    &-content {
      padding: 24px 20px;
      text-align: center;
    }

    &-tokens {
      font-family: var(--font-mono);
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--gold);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    &-label {
      font-size: 0.72rem;
      color: var(--text-secondary);
      margin: 6px 0;
    }

    &-price {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    &-per {
      font-size: 0.68rem;
      color: var(--text-muted);
      margin-top: 4px;
      font-family: var(--font-mono);
    }
  }

  &__tx-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__tx {
    transition: all var(--transition-fast);

    &:hover {
      box-shadow: var(--shadow-glow);
    }

    &-content {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
    }

    &-icon {
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

    &-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    &-type {
      font-size: 0.85rem;
      font-weight: 600;
    }

    &-date {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    &-amount {
      font-family: var(--font-mono);
      font-size: 0.85rem;
      font-weight: 600;

      &--positive { color: var(--emerald); }
      &--negative { color: var(--text-secondary); }
    }
  }

  &__empty {
    padding: 48px 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    &-icon {
      font-size: 3rem;
      color: var(--text-muted);
      opacity: 0.3;
    }

    p {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    span {
      font-size: 0.82rem;
      color: var(--text-muted);
    }
  }

  &__message {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    min-width: 300px;
    max-width: 500px;
  }
}

.dialog-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 350px;
}

.dialog-input {
  width: 100%;
}

.dialog-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 8px;
}

.dialog-address {
  width: 100%;
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  text-align: center;

  code {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--text-secondary);
    word-break: break-all;
    line-height: 1.6;
  }
}

.dialog-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 8px;
}

.spinning {
  animation: spin 1s linear infinite;
}
</style>
