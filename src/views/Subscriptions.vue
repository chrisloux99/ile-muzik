<template>
  <div class="subs">
    <div class="subs__header">
      <h1 class="subs__title">
        <ui5-icon name="business-card" class="subs__title-icon"></ui5-icon>
        Plans
      </h1>
      <p class="subs__subtitle">Choose your streaming experience</p>
    </div>

    <ui5-card class="subs__current" v-if="status">
      <div class="subs__current-content">
        <div class="subs__current-info">
          <ui5-tag :design="getTierDesign(status.tier)">
            {{ status.tier }}
          </ui5-tag>
          <span class="subs__current-detail">
            {{ status.streamsThisMonth }}/{{ status.streamLimit === -1 ? '∞' : status.streamLimit }} streams this month
          </span>
        </div>
        <div class="subs__current-expiry" v-if="status.subscriptionExpiry">
          <ui5-icon name="appointment-2"></ui5-icon>
          Renews {{ new Date(status.subscriptionExpiry).toLocaleDateString() }}
        </div>
      </div>
    </ui5-card>

    <div class="subs__plans">
      <ui5-card
        v-for="tier in tiers"
        :key="tier.name"
        class="subs__plan"
        :class="{
          'subs__plan--active': status?.tier === tier.name,
          'subs__plan--recommended': tier.name === 'PREMIUM'
        }"
      >
        <ui5-tag v-if="tier.name === 'PREMIUM'" class="subs__plan-badge" design="Positive">
          Recommended
        </ui5-tag>

        <div class="subs__plan-content">
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
              <ui5-icon name="accept" class="subs__feature-icon"></ui5-icon>
              <span>{{ tier.streamLimit === -1 ? 'Unlimited' : tier.streamLimit }} streams/month</span>
            </div>
            <div class="subs__plan-feature" :class="{ 'subs__plan-feature--disabled': tier.name === 'FREE' }">
              <ui5-icon :name="tier.name === 'FREE' ? 'decline' : 'accept'" class="subs__feature-icon"></ui5-icon>
              <span>{{ tier.name === 'FREE' ? 'With ads' : 'No ads' }}</span>
            </div>
            <div class="subs__plan-feature" :class="{ 'subs__plan-feature--disabled': tier.name === 'FREE' }">
              <ui5-icon :name="tier.name === 'PREMIUM' ? 'accept' : 'decline'" class="subs__feature-icon"></ui5-icon>
              <span>{{ tier.name === 'PREMIUM' ? 'High quality audio' : 'Standard quality' }}</span>
            </div>
            <div class="subs__plan-feature" :class="{ 'subs__plan-feature--disabled': tier.name !== 'PREMIUM' }">
              <ui5-icon :name="tier.name === 'PREMIUM' ? 'accept' : 'decline'" class="subs__feature-icon"></ui5-icon>
              <span>{{ tier.name === 'PREMIUM' ? 'Offline downloads' : 'No offline' }}</span>
            </div>
          </div>

          <ui5-button
            :design="status?.tier === tier.name ? 'Default' : 'Emphasized'"
            :disabled="status?.tier === tier.name || subscribing"
            @click="handleSubscribe(tier.name)"
            class="subs__plan-btn"
          >
            <span v-if="status?.tier === tier.name">Current Plan</span>
            <span v-else-if="tier.name === 'FREE'">Downgrade</span>
            <span v-else>Subscribe</span>
          </ui5-button>
        </div>
      </ui5-card>
    </div>

    <ui5-message-strip v-if="message" :design="messageType" class="subs__message" @close="message = ''">
      {{ message }}
    </ui5-message-strip>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/app'
import type { SubscriptionStatus } from '@/api/types'

import '@ui5/webcomponents/dist/Button.js'
import '@ui5/webcomponents/dist/Card.js'
import '@ui5/webcomponents/dist/Icon.js'
import '@ui5/webcomponents/dist/Tag.js'
import '@ui5/webcomponents/dist/MessageStrip.js'
import '@ui5/webcomponents-icons/dist/business-card.js'
import '@ui5/webcomponents-icons/dist/accept.js'
import '@ui5/webcomponents-icons/dist/decline.js'
import '@ui5/webcomponents-icons/dist/appointment-2.js'

const appStore = useAppStore()
const status = ref<SubscriptionStatus | null>(null)
const subscribing = ref(false)
const message = ref('')
const messageType = ref<'Information' | 'Positive' | 'Negative'>('Information')

const tiers = [
  { name: 'FREE', label: 'Free', priceUSD: 0, streamLimit: 20 },
  { name: 'BASIC', label: 'Basic', priceUSD: 2.00, streamLimit: 200 },
  { name: 'PREMIUM', label: 'Premium', priceUSD: 5.00, streamLimit: -1 },
]

function getTierDesign(tier: string): string {
  const designs: Record<string, string> = {
    FREE: 'Neutral',
    BASIC: 'Information',
    PREMIUM: 'Positive'
  }
  return designs[tier] || 'Neutral'
}

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
    message.value = `Successfully subscribed to ${tier}!`
    messageType.value = 'Positive'
  } catch (e: any) {
    message.value = e.message || 'Subscription failed'
    messageType.value = 'Negative'
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

    &-icon {
      font-size: 1.5rem;
      color: var(--violet-bright);
    }
  }

  &__subtitle {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-top: 8px;
  }

  &__current {
    margin-bottom: 28px;
    border-radius: var(--radius);

    &-content {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    &-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    &-detail {
      font-size: 0.82rem;
      color: var(--text-secondary);
      font-family: var(--font-mono);
    }

    &-expiry {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      color: var(--text-muted);
    }
  }

  &__plans {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }

  &__plan {
    border-radius: var(--radius-lg);
    position: relative;
    overflow: hidden;
    transition: all var(--transition-smooth);

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-glow);
    }

    &--active {
      border: 2px solid rgba(120, 80, 255, 0.3);
    }

    &--recommended {
      border: 2px solid rgba(255, 215, 0, 0.3);

      &:hover {
        box-shadow: 0 0 40px rgba(255, 215, 0, 0.15);
      }
    }

    &-badge {
      position: absolute;
      top: 12px;
      right: 12px;
    }

    &-content {
      padding: 28px 24px;
    }

    &-header {
      margin-bottom: 20px;
      padding-top: 8px;
    }

    &-name {
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    &-price {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    &-amount {
      font-size: 2rem;
      font-weight: 800;
      font-family: var(--font-mono);
    }

    &-period {
      font-size: 0.82rem;
      color: var(--text-secondary);
    }

    &-features {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    &-feature {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
      color: var(--text-secondary);

      &--disabled {
        opacity: 0.4;
      }
    }

    &-btn {
      width: 100%;
    }
  }

  &__feature-icon {
    color: var(--emerald);
    font-size: 1rem;

    .subs__plan-feature--disabled & {
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
</style>
