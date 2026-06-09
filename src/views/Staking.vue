<template>
  <div class="staking">
    <div class="staking__header">
      <h1 class="staking__title">
        <ui5-icon name="locked" class="staking__title-icon"></ui5-icon>
        Staking
      </h1>
      <ui5-button design="Transparent" @click="load" :disabled="loading">
        <ui5-icon name="refresh" :class="{ 'spinning': loading }"></ui5-icon>
      </ui5-button>
    </div>

    <ui5-card class="staking__stats">
      <div class="staking__stats-grid">
        <div class="staking__stat">
          <span class="staking__stat-label">Total Staked</span>
          <span class="staking__stat-value">{{ stats.totalStaked.toFixed(2) }} iLe</span>
        </div>
        <div class="staking__stat">
          <span class="staking__stat-label">Active Stakes</span>
          <span class="staking__stat-value">{{ stats.activeStakes }}</span>
        </div>
        <div class="staking__stat">
          <span class="staking__stat-label">Avg Reward Rate</span>
          <span class="staking__stat-value">{{ (stats.avgRewardRate * 100).toFixed(1) }}%</span>
        </div>
        <div class="staking__stat">
          <span class="staking__stat-label">Est. Annual Rewards</span>
          <span class="staking__stat-value">{{ stats.estimatedAnnualRewards.toFixed(2) }} iLe</span>
        </div>
      </div>
    </ui5-card>

    <ui5-card class="staking__action">
      <h2>Stake Tokens</h2>
      <p>Lock your iLe tokens to earn rewards. Standard rate: 5% APY.</p>
      <div class="staking__action-row">
        <ui5-input
          type="Number"
          placeholder="Amount to stake"
          v-model="stakeAmount"
          :disabled="staking"
        ></ui5-input>
        <ui5-button design="Emphasized" @click="stake" :disabled="staking || !stakeAmount">
          {{ staking ? 'Staking...' : 'Stake' }}
        </ui5-button>
      </div>
    </ui5-card>

    <section class="staking__active" v-if="activeStakes.length > 0">
      <h2>Active Stakes</h2>
      <div class="staking__list">
        <ui5-card v-for="s in activeStakes" :key="s.id" class="staking__item">
          <div class="staking__item-header">
            <span class="staking__item-amount">{{ s.amount.toFixed(4) }} iLe</span>
            <ui5-tag design="Positive">Active</ui5-tag>
          </div>
          <div class="staking__item-details">
            <span>Rate: {{ (s.rewardRate * 100).toFixed(1) }}%</span>
            <span>Since: {{ new Date(s.startDate).toLocaleDateString() }}</span>
          </div>
          <ui5-button design="Transparent" @click="unstake(s.id)" :disabled="unstakingId === s.id">
            {{ unstakingId === s.id ? 'Unstaking...' : 'Unstake + Rewards' }}
          </ui5-button>
        </ui5-card>
      </div>
    </section>

    <section class="staking__history" v-if="history.length > 0">
      <h2>Staking History</h2>
      <div class="staking__list">
        <div v-for="s in history" :key="s.id" class="staking__history-item">
          <ui5-icon :name="s.status === 'ACTIVE' ? 'locked' : 'unlocked'"></ui5-icon>
          <div class="staking__history-info">
            <span>{{ s.amount.toFixed(4) }} iLe</span>
            <span class="staking__history-date">{{ new Date(s.startDate).toLocaleDateString() }}</span>
          </div>
          <ui5-tag :design="s.status === 'ACTIVE' ? 'Positive' : 'Neutral'">{{ s.status }}</ui5-tag>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import type { Stake, StakingStats } from '@/api/types'

const loading = ref(false)
const staking = ref(false)
const unstakingId = ref<string | null>(null)
const stakeAmount = ref<number>(0)
const stats = ref<StakingStats>({ activeStakes: 0, totalStaked: 0, avgRewardRate: 0.05, estimatedAnnualRewards: 0 })
const activeStakes = ref<Stake[]>([])
const history = ref<Stake[]>([])

async function load() {
  loading.value = true
  try {
    const [s, active, h] = await Promise.all([
      api.getStakingStats(),
      api.getActiveStakes(),
      api.getStakingHistory(),
    ])
    stats.value = s
    activeStakes.value = active
    history.value = h
  } catch (err: any) {
    console.error('Failed to load staking data:', err)
  } finally {
    loading.value = false
  }
}

async function stake() {
  if (!stakeAmount.value || stakeAmount.value <= 0) return
  staking.value = true
  try {
    await api.stakeTokens(stakeAmount.value)
    stakeAmount.value = 0
    await load()
  } catch (err: any) {
    alert(err.message || 'Staking failed')
  } finally {
    staking.value = false
  }
}

async function unstake(stakeId: string) {
  unstakingId.value = stakeId
  try {
    const result = await api.unstakeTokens(stakeId)
    alert(`Unstaked ${result.principal} iLe + ${result.rewards} rewards`)
    await load()
  } catch (err: any) {
    alert(err.message || 'Unstaking failed')
  } finally {
    unstakingId.value = null
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.staking {
  max-width: 800px;
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
    color: var(--text-primary);
  }

  &__stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    padding: 1rem;
  }

  &__stat {
    text-align: center;
  }

  &__stat-label {
    display: block;
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }

  &__stat-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__action {
    padding: 1.5rem;

    h2 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
    }

    p {
      margin: 0 0 1rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
  }

  &__action-row {
    display: flex;
    gap: 0.5rem;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__item {
    padding: 1rem;
  }

  &__item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  &__item-amount {
    font-size: 1.1rem;
    font-weight: 600;
  }

  &__item-details {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
  }

  &__history-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--surface-ground);
    border-radius: 8px;
  }

  &__history-info {
    flex: 1;
    display: flex;
    flex-direction: column;

    span:first-child {
      font-weight: 500;
    }
  }

  &__history-date {
    font-size: 0.75rem;
    color: var(--text-secondary);
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
