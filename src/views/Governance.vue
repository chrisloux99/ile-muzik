<template>
  <div class="governance">
    <div class="governance__header">
      <h1 class="governance__title">
        <ui5-icon name="decision" class="governance__title-icon"></ui5-icon>
        Governance
      </h1>
      <ui5-button design="Emphasized" @click="showCreateDialog = true">
        <ui5-icon name="add" slot="icon"></ui5-icon>
        New Proposal
      </ui5-button>
    </div>

    <div class="governance__tabs">
      <ui5-button
        :design="filter === 'ALL' ? 'Emphasized' : 'Transparent'"
        @click="filter = 'ALL'; load()"
      >All</ui5-button>
      <ui5-button
        :design="filter === 'ACTIVE' ? 'Emphasized' : 'Transparent'"
        @click="filter = 'ACTIVE'; load()"
      >Active</ui5-button>
      <ui5-button
        :design="filter === 'PASSED' ? 'Emphasized' : 'Transparent'"
        @click="filter = 'PASSED'; load()"
      >Passed</ui5-button>
      <ui5-button
        :design="filter === 'REJECTED' ? 'Emphasized' : 'Transparent'"
        @click="filter = 'REJECTED'; load()"
      >Rejected</ui5-button>
    </div>

    <div class="governance__list">
      <ui5-card v-for="p in proposals" :key="p.id" class="governance__proposal" interactive @click="selectProposal(p)">
        <div class="governance__proposal-header">
          <h3>{{ p.title }}</h3>
          <ui5-tag :design="statusDesign(p.status)">{{ p.status }}</ui5-tag>
        </div>
        <p class="governance__proposal-desc">{{ p.description }}</p>
        <div class="governance__proposal-votes">
          <div class="governance__vote-bar">
            <div class="governance__vote-for" :style="{ width: votePercent(p, true) + '%' }"></div>
          </div>
          <div class="governance__vote-labels">
            <span>For: {{ p.votesFor.toFixed(2) }}</span>
            <span>Against: {{ p.votesAgainst.toFixed(2) }}</span>
          </div>
        </div>
        <div class="governance__proposal-meta">
          <span>Ends: {{ new Date(p.endDate).toLocaleDateString() }}</span>
          <span v-if="p.totalVoters">{{ p.totalVoters }} voters</span>
        </div>
      </ui5-card>

      <div v-if="proposals.length === 0 && !loading" class="governance__empty">
        No proposals found
      </div>
    </div>

    <!-- Create Proposal Dialog -->
    <ui5-dialog header="Create Proposal" :open="showCreateDialog" @close="showCreateDialog = false">
      <div class="governance__form">
        <ui5-label>Title</ui5-label>
        <ui5-input v-model="newProposal.title" placeholder="Proposal title" maxlength="200"></ui5-input>
        <ui5-label>Description</ui5-label>
        <ui5-textarea v-model="newProposal.description" placeholder="Describe your proposal" maxlength="2000" rows="4"></ui5-textarea>
        <ui5-label>Duration (days)</ui5-label>
        <ui5-input type="Number" v-model="newProposal.durationDays" min="1" max="30"></ui5-input>
      </div>
      <div slot="footer">
        <ui5-button design="Transparent" @click="showCreateDialog = false">Cancel</ui5-button>
        <ui5-button design="Emphasized" @click="createProposal" :disabled="creating">
          {{ creating ? 'Creating...' : 'Create' }}
        </ui5-button>
      </div>
    </ui5-dialog>

    <!-- Vote Dialog -->
    <ui5-dialog header="Cast Vote" :open="!!selectedProposal" @close="selectedProposal = null">
      <div v-if="selectedProposal" class="governance__vote-dialog">
        <h3>{{ selectedProposal.title }}</h3>
        <p>{{ selectedProposal.description }}</p>
        <div class="governance__vote-actions">
          <ui5-button design="Positive" @click="castVote(true)" :disabled="voting">
            {{ voting ? 'Voting...' : 'Vote For' }}
          </ui5-button>
          <ui5-button design="Negative" @click="castVote(false)" :disabled="voting">
            {{ voting ? 'Voting...' : 'Vote Against' }}
          </ui5-button>
        </div>
      </div>
    </ui5-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import type { Proposal } from '@/api/types'

const loading = ref(false)
const creating = ref(false)
const voting = ref(false)
const filter = ref('ALL')
const proposals = ref<Proposal[]>([])
const selectedProposal = ref<Proposal | null>(null)
const showCreateDialog = ref(false)
const newProposal = ref({ title: '', description: '', durationDays: 7 })

async function load() {
  loading.value = true
  try {
    const status = filter.value === 'ALL' ? undefined : filter.value
    proposals.value = await api.getProposals(status)
  } catch (err: any) {
    console.error('Failed to load proposals:', err)
  } finally {
    loading.value = false
  }
}

async function createProposal() {
  if (!newProposal.value.title || !newProposal.value.description) return
  creating.value = true
  try {
    await api.createProposal(
      newProposal.value.title,
      newProposal.value.description,
      newProposal.value.durationDays
    )
    showCreateDialog.value = false
    newProposal.value = { title: '', description: '', durationDays: 7 }
    await load()
  } catch (err: any) {
    alert(err.message || 'Failed to create proposal')
  } finally {
    creating.value = false
  }
}

function selectProposal(p: Proposal) {
  if (p.status === 'ACTIVE') {
    selectedProposal.value = p
  }
}

async function castVote(support: boolean) {
  if (!selectedProposal.value) return
  voting.value = true
  try {
    await api.vote(selectedProposal.value.id, support)
    selectedProposal.value = null
    await load()
  } catch (err: any) {
    alert(err.message || 'Failed to vote')
  } finally {
    voting.value = false
  }
}

function statusDesign(status: string) {
  switch (status) {
    case 'ACTIVE': return 'Information'
    case 'PASSED': return 'Positive'
    case 'REJECTED': return 'Negative'
    default: return 'Neutral'
  }
}

function votePercent(p: Proposal, isFor: boolean) {
  const total = p.votesFor + p.votesAgainst
  if (total === 0) return 50
  return isFor ? (p.votesFor / total) * 100 : (p.votesAgainst / total) * 100
}

onMounted(load)
</script>

<style scoped lang="scss">
.governance {
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

  &__tabs {
    display: flex;
    gap: 0.5rem;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__proposal {
    padding: 1.25rem;
    cursor: pointer;
    transition: transform 0.15s;

    &:hover {
      transform: translateY(-2px);
    }
  }

  &__proposal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;

    h3 {
      margin: 0;
      font-size: 1rem;
    }
  }

  &__proposal-desc {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin: 0 0 1rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__proposal-votes {
    margin-bottom: 0.75rem;
  }

  &__vote-bar {
    height: 6px;
    background: var(--surface-ground);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 0.25rem;
  }

  &__vote-for {
    height: 100%;
    background: var(--sapPositiveColor);
    transition: width 0.3s;
  }

  &__vote-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  &__proposal-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  &__empty {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    min-width: 400px;
  }

  &__vote-dialog {
    padding: 1.5rem;
    min-width: 350px;

    h3 { margin: 0 0 0.5rem; }
    p { margin: 0 0 1.5rem; color: var(--text-secondary); }
  }

  &__vote-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
}
</style>
