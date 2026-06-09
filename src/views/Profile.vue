<template>
  <div class="profile">
    <div class="profile__header">
      <h1 class="profile__title">
        <ui5-icon name="account" class="profile__title-icon"></ui5-icon>
        Profile
      </h1>
    </div>

    <ui5-card class="profile__card">
      <div class="profile__user">
        <ui5-avatar :initials="userInitial" shape="Circle" size="XL" color-scheme="Accent7"></ui5-avatar>
        <div class="profile__info">
          <h2 class="profile__name">{{ user?.displayName || 'User' }}</h2>
          <p class="profile__email">{{ user?.email }}</p>
          <ui5-tag :design="getTierDesign(user?.tier || 'FREE')">{{ user?.tier || 'FREE' }}</ui5-tag>
        </div>
      </div>
    </ui5-card>

    <section class="profile__stats">
      <ui5-card class="profile__stat-card">
        <ui5-icon name="headset" class="profile__stat-icon"></ui5-icon>
        <div class="profile__stat-info">
          <span class="profile__stat-value">{{ user?.streamsThisMonth || 0 }}</span>
          <span class="profile__stat-label">Streams This Month</span>
        </div>
      </ui5-card>

      <ui5-card class="profile__stat-card">
        <ui5-icon name="wallet" class="profile__stat-icon profile__stat-icon--gold"></ui5-icon>
        <div class="profile__stat-info">
          <span class="profile__stat-value">{{ tokenBalance.toFixed(2) }}</span>
          <span class="profile__stat-label">iLe Balance</span>
        </div>
      </ui5-card>

      <ui5-card class="profile__stat-card">
        <ui5-icon name="business-card" class="profile__stat-icon profile__stat-icon--cyan"></ui5-icon>
        <div class="profile__stat-info">
          <span class="profile__stat-value">{{ user?.tier || 'FREE' }}</span>
          <span class="profile__stat-label">Current Plan</span>
        </div>
      </ui5-card>
    </section>

    <section class="profile__settings">
      <h2>Settings</h2>
      
      <ui5-card class="profile__setting-item">
        <div class="profile__setting-content">
          <ui5-icon name="key" class="profile__setting-icon"></ui5-icon>
          <div class="profile__setting-info">
            <span class="profile__setting-title">Change Password</span>
            <span class="profile__setting-desc">Update your account password</span>
          </div>
          <ui5-button design="Transparent" @click="showPasswordDialog">Change</ui5-button>
        </div>
      </ui5-card>

      <ui5-card class="profile__setting-item">
        <div class="profile__setting-content">
          <ui5-icon name="wallet" class="profile__setting-icon"></ui5-icon>
          <div class="profile__setting-info">
            <span class="profile__setting-title">Stellar Wallet</span>
            <span class="profile__setting-desc">{{ truncatedKey || 'No wallet connected' }}</span>
          </div>
          <ui5-button design="Transparent" @click="$router.push('/wallet')">Manage</ui5-button>
        </div>
      </ui5-card>

      <ui5-card class="profile__setting-item">
        <div class="profile__setting-content">
          <ui5-icon name="business-card" class="profile__setting-icon"></ui5-icon>
          <div class="profile__setting-info">
            <span class="profile__setting-title">Subscription</span>
            <span class="profile__setting-desc">Manage your streaming plan</span>
          </div>
          <ui5-button design="Transparent" @click="$router.push('/subscriptions')">Manage</ui5-button>
        </div>
      </ui5-card>
    </section>

    <ui5-dialog ref="passwordDialog" header-text="Change Password">
      <div class="dialog-content">
        <ui5-input type="Password" placeholder="Current password" class="dialog-input">
          <ui5-label slot="label">Current Password</ui5-label>
        </ui5-input>
        <ui5-input type="Password" placeholder="New password" class="dialog-input">
          <ui5-label slot="label">New Password</ui5-label>
        </ui5-input>
        <ui5-input type="Password" placeholder="Confirm new password" class="dialog-input">
          <ui5-label slot="label">Confirm Password</ui5-label>
        </ui5-input>
      </div>
      <div slot="footer" class="dialog-footer">
        <ui5-button design="Transparent" @click="closePasswordDialog">Cancel</ui5-button>
        <ui5-button design="Emphasized">Save</ui5-button>
      </div>
    </ui5-dialog>

    <ui5-message-strip v-if="message" :design="messageType" class="profile__message" @close="message = ''">
      {{ message }}
    </ui5-message-strip>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { api } from '@/api/client'

import '@ui5/webcomponents/dist/Button.js'
import '@ui5/webcomponents/dist/Card.js'
import '@ui5/webcomponents/dist/Icon.js'
import '@ui5/webcomponents/dist/Avatar.js'
import '@ui5/webcomponents/dist/Tag.js'
import '@ui5/webcomponents/dist/Input.js'
import '@ui5/webcomponents/dist/Label.js'
import '@ui5/webcomponents/dist/Dialog.js'
import '@ui5/webcomponents/dist/MessageStrip.js'
import '@ui5/webcomponents-icons/dist/account.js'
import '@ui5/webcomponents-icons/dist/headset.js'
import '@ui5/webcomponents-icons/dist/wallet.js'
import '@ui5/webcomponents-icons/dist/business-card.js'
import '@ui5/webcomponents-icons/dist/key.js'

const appStore = useAppStore()
const { user, tokenBalance } = storeToRefs(appStore)

const passwordDialog = ref<any>(null)
const message = ref('')
const messageType = ref<'Information' | 'Positive' | 'Negative'>('Information')

const userInitial = computed(() => {
  const name = user.value?.displayName || 'U'
  return name.charAt(0).toUpperCase()
})

const truncatedKey = computed(() => {
  const key = user.value?.stellarPublicKey
  if (!key) return ''
  return key.slice(0, 8) + '...' + key.slice(-6)
})

function getTierDesign(tier: string): string {
  const designs: Record<string, string> = {
    FREE: 'Neutral',
    BASIC: 'Information',
    PREMIUM: 'Positive'
  }
  return designs[tier] || 'Neutral'
}

function showPasswordDialog() {
  passwordDialog.value?.show()
}

function closePasswordDialog() {
  passwordDialog.value?.close()
}

onMounted(async () => {
  await appStore.refreshProfile()
})
</script>

<style scoped lang="scss">
.profile {
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

  &__card {
    margin-bottom: 24px;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px;
  }

  &__info {
    flex: 1;
  }

  &__name {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 4px;
  }

  &__email {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 32px;
  }

  &__stat-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
  }

  &__stat-icon {
    font-size: 1.5rem;
    color: var(--violet-bright);

    &--gold {
      color: var(--gold);
    }

    &--cyan {
      color: var(--cyan);
    }
  }

  &__stat-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__stat-value {
    font-family: var(--font-mono);
    font-size: 1.2rem;
    font-weight: 700;
  }

  &__stat-label {
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  &__settings {
    h2 {
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 16px;
    }
  }

  &__setting-item {
    margin-bottom: 8px;
  }

  &__setting-content {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
  }

  &__setting-icon {
    font-size: 1.3rem;
    color: var(--text-secondary);
  }

  &__setting-info {
    flex: 1;
  }

  &__setting-title {
    display: block;
    font-size: 0.95rem;
    font-weight: 600;
  }

  &__setting-desc {
    display: block;
    font-size: 0.78rem;
    color: var(--text-muted);
    margin-top: 2px;
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

.dialog-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 8px;
}
</style>
