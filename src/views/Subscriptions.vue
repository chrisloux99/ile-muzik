<template>
  <div class="subs">
    <div class="subs__header">
      <h1 class="subs__title">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
        Plans
      </h1>
      <p class="subs__subtitle">Choose your streaming experience</p>
    </div>

    <div class="subs__current glass" v-if="status">
      <div class="subs__current-info">
        <span class="subs__current-tier" :class="'subs__current-tier--' + status.tier.toLowerCase()">
          {{ status.tier }}
        </span>
        <span class="subs__current-detail">
          {{ status.streamsThisMonth }}/{{ status.streamLimit === -1 ? '∞' : status.streamLimit }} streams this month
        </span>
      </div>
      <div class="subs__current-expiry" v-if="status.subscriptionExpiry">
        Renews {{ new Date(status.subscriptionExpiry).toLocaleDateString() }}
      </div>
    </div>

    <div class="subs__plans">
      <div
        v-for="tier in tiers"
        :key="tier.name"
        class="subs__plan glass"
        :class="{
          'subs__plan--active': status?.tier === tier.name,
          'subs__plan--recommended': tier.name === 'PREMIUM'
        }"
      >
        <div class="subs__plan-recommended" v-if="tier.name === 'PREMIUM'">Recommended</div>
        <div class="subs__plan-header">
          <h3 class="subs__plan-name">{{ tier.label }}</h3>
          <div class="subs__plan-price">
            <span class="subs__plan-amount" v-if="tier.priceUSD > 0">${{ tier.priceUSD.toFixed(2) }}</span>
            <span class="subs__plan-amount" v-else>Free</span>
            <span class="subs__plan-period" v-if="tier.priceUSD > 0">/month</span>
          </div>
        </div>

        <div class="subs__plan-features">
          <div class="subs__plan-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
            </svg>
            <span>{{ tier.streamLimit === -1 ? 'Unlimited' : tier.streamLimit }} streams/month</span>
          </div>
          <div class="subs__plan-feature" :class="{ 'subs__plan-feature--disabled': tier.name === 'FREE' }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
            </svg>
            <span>{{ tier.name === 'FREE' ? 'With ads' : 'No ads' }}</span>
          </div>
          <div class="subs__plan-feature" :class="{ 'subs__plan-feature--disabled': tier.name === 'FREE' }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
            </svg>
            <span>{{ tier.name === 'PREMIUM' ? 'High quality audio' : 'Standard quality' }}</span>
          </div>
          <div class="subs__plan-feature" :class="{ 'subs__plan-feature--disabled': tier.name !== 'PREMIUM' }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path v-if="tier.name === 'PREMIUM'" d="M9 12l2 2 4-4"/><path v-else d="M15 9l-6 6M9 9l6 6"/>
            </svg>
            <span>{{ tier.name === 'PREMIUM' ? 'Offline downloads' : 'No offline' }}</span>
          </div>
        </div>

        <button
          class="subs__plan-btn"
          :class="{
            'subs__plan-btn--current': status?.tier === tier.name,
            'subs__plan-btn--upgrade': tier.name !== 'FREE' && status?.tier !== tier.name
          }"
          :disabled="status?.tier === tier.name || subscribing"
          @click="handleSubscribe(tier.name)"
        >
          <span v-if="status?.tier === tier.name">Current Plan</span>
          <span v-else-if="tier.name === 'FREE'">Downgrade</span>
          <span v-else>Subscribe</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/app'
import type { SubscriptionStatus } from '@/api/types'

const appStore = useAppStore()
const status = ref<SubscriptionStatus | null>(null)
const subscribing = ref(false)

const tiers = [
  { name: 'FREE', label: 'Free', priceUSD: 0, streamLimit: 20 },
  { name: 'BASIC', label: 'Basic', priceUSD: 2.00, streamLimit: 200 },
  { name: 'PREMIUM', label: 'Premium', priceUSD: 5.00, streamLimit: -1 },
]

async function load() {
  try {
    status.value = await api.getSubscriptionStatus()
  } catch (e) {
    console.error('[Subs]', e)
  }
}

async function handleSubscribe(tier: string) {
  if (tier === 'FREE') return
  subscribing.value = true
  try {
    await api.subscribe(tier)
    await load()
    appStore.refreshProfile()
  } catch (e: any) {
    alert(e.message || 'Subscription failed')
  } finally {
    subscribing.value = false
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.subs {
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

  &__subtitle {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-top: 8px;
  }

  &__current {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-radius: var(--radius);
    margin-bottom: 28px;
  }

  &__current-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__current-tier {
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;

    &--free { background: rgba(255, 255, 255, 0.08); color: var(--text-secondary); }
    &--basic { background: rgba(120, 80, 255, 0.15); color: var(--violet-bright); }
    &--premium { background: rgba(255, 215, 0, 0.15); color: var(--gold); }
  }

  &__current-detail {
    font-size: 0.82rem;
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }

  &__current-expiry {
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  &__plans {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }

  &__plan {
    padding: 28px 24px;
    border-radius: var(--radius-lg);
    position: relative;
    overflow: hidden;
    transition: all var(--transition-smooth);

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-glow);
    }

    &--active {
      border-color: rgba(120, 80, 255, 0.3);
    }

    &--recommended {
      border-color: rgba(255, 215, 0, 0.3);

      &:hover {
        box-shadow: 0 0 40px rgba(255, 215, 0, 0.15);
      }
    }
  }

  &__plan-recommended {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 6px;
    background: linear-gradient(90deg, var(--gold), var(--amber));
    color: var(--void);
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-align: center;
  }

  &__plan-header {
    margin-bottom: 20px;
    padding-top: 8px;
  }

  &__plan-name {
    font-family: var(--font-display);
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 8px;
  }

  &__plan-price {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  &__plan-amount {
    font-size: 2rem;
    font-weight: 800;
    font-family: var(--font-mono);
  }

  &__plan-period {
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  &__plan-features {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  &__plan-feature {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.85rem;
    color: var(--text-secondary);

    svg { color: var(--emerald); }

    &--disabled {
      opacity: 0.4;
      svg { color: var(--text-muted); }
    }
  }

  &__plan-btn {
    width: 100%;
    padding: 12px;
    border-radius: var(--radius);
    border: 1px solid var(--glass-border);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-primary);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-smooth);

    &:hover:not(:disabled) {
      border-color: rgba(120, 80, 255, 0.3);
      background: rgba(120, 80, 255, 0.1);
    }

    &--current {
      background: rgba(120, 80, 255, 0.15);
      border-color: rgba(120, 80, 255, 0.3);
      color: var(--violet-bright);
      cursor: default;
    }

    &--upgrade {
      background: linear-gradient(135deg, var(--violet), var(--violet-dim));
      border: none;
      color: white;

      &:hover:not(:disabled) {
        box-shadow: 0 0 25px rgba(120, 80, 255, 0.3);
      }
    }

    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
}
</style>
