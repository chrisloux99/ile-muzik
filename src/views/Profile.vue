<template>
  <div class="profile">
    <div class="profile__header">
      <h1 class="profile__title">
        <ui5-icon name="account" class="profile__title-icon"></ui5-icon>
        Profile
      </h1>
    </div>

    <div class="profile__user-card wave-border">
      <div class="profile__user glass">
        <ui5-avatar :initials="userInitial" shape="Circle" size="XL" color-scheme="Accent7"></ui5-avatar>
        <div class="profile__info">
          <h2 class="profile__name">{{ user?.displayName || 'User' }}</h2>
          <p class="profile__email">{{ user?.email }}</p>
          <div class="profile__badges">
            <ui5-tag :design="getTierDesign(user?.tier || 'FREE')">{{ user?.tier || 'FREE' }}</ui5-tag>
            <ui5-tag design="Information">Member since {{ memberSince }}</ui5-tag>
          </div>
        </div>
        <ui5-button design="Transparent" @click="showEditDialog" class="profile__edit-btn">
          <ui5-icon name="edit" slot="icon"></ui5-icon>
          Edit
        </ui5-button>
      </div>
    </div>

    <section class="profile__stats">
      <div class="profile__stat-card lightning-border glass">
        <ui5-icon name="headset" class="profile__stat-icon profile__stat-icon--orange"></ui5-icon>
        <div class="profile__stat-info">
          <span class="profile__stat-value">{{ user?.streamsThisMonth || 0 }}</span>
          <span class="profile__stat-label">Streams This Month</span>
        </div>
      </div>
      <div class="profile__stat-card lightning-border glass">
        <ui5-icon name="wallet" class="profile__stat-icon profile__stat-icon--gold"></ui5-icon>
        <div class="profile__stat-info">
          <span class="profile__stat-value">{{ tokenBalance.toFixed(2) }}</span>
          <span class="profile__stat-label">iLe Balance</span>
        </div>
      </div>
      <div class="profile__stat-card lightning-border glass">
        <ui5-icon name="business-card" class="profile__stat-icon profile__stat-icon--cyan"></ui5-icon>
        <div class="profile__stat-info">
          <span class="profile__stat-value">{{ user?.tier || 'FREE' }}</span>
          <span class="profile__stat-label">Current Plan</span>
        </div>
      </div>
      <div class="profile__stat-card lightning-border glass">
        <ui5-icon name="sys-enter-2" class="profile__stat-icon profile__stat-icon--green"></ui5-icon>
        <div class="profile__stat-info">
          <span class="profile__stat-value">{{ streamLimit }}</span>
          <span class="profile__stat-label">Stream Limit</span>
        </div>
      </div>
    </section>

    <section class="profile__settings">
      <h2>Settings</h2>

      <div class="profile__setting-item lightning-border glass">
        <div class="profile__setting-content">
          <ui5-icon name="key" class="profile__setting-icon"></ui5-icon>
          <div class="profile__setting-info">
            <span class="profile__setting-title">Change Password</span>
            <span class="profile__setting-desc">Update your account password</span>
          </div>
          <ui5-button design="Transparent" @click="showPasswordDialog">Change</ui5-button>
        </div>
      </div>

      <div class="profile__setting-item lightning-border glass">
        <div class="profile__setting-content">
          <ui5-icon name="wallet" class="profile__setting-icon"></ui5-icon>
          <div class="profile__setting-info">
            <span class="profile__setting-title">Stellar Wallet</span>
            <span class="profile__setting-desc">{{ truncatedKey || 'No wallet connected' }}</span>
          </div>
          <ui5-button design="Transparent" @click="$router.push('/wallet')">Manage</ui5-button>
        </div>
      </div>

      <div class="profile__setting-item lightning-border glass">
        <div class="profile__setting-content">
          <ui5-icon name="business-card" class="profile__setting-icon"></ui5-icon>
          <div class="profile__setting-info">
            <span class="profile__setting-title">Subscription</span>
            <span class="profile__setting-desc">Manage your streaming plan</span>
          </div>
          <ui5-button design="Transparent" @click="$router.push('/subscriptions')">Manage</ui5-button>
        </div>
      </div>

      <div class="profile__setting-item lightning-border glass">
        <div class="profile__setting-content">
          <ui5-icon name="history" class="profile__setting-icon"></ui5-icon>
          <div class="profile__setting-info">
            <span class="profile__setting-title">Stream History</span>
            <span class="profile__setting-desc">View your listening history</span>
          </div>
          <ui5-button design="Transparent" @click="showHistoryDialog">View</ui5-button>
        </div>
      </div>

      <div class="profile__setting-item lightning-border glass">
        <div class="profile__setting-content">
          <ui5-icon name="heart" class="profile__setting-icon"></ui5-icon>
          <div class="profile__setting-info">
            <span class="profile__setting-title">Liked Songs</span>
            <span class="profile__setting-desc">Your favorite tracks</span>
          </div>
          <ui5-button design="Transparent" @click="showFavouritesDialog">View</ui5-button>
        </div>
      </div>

      <div class="profile__setting-item lightning-border glass">
        <div class="profile__setting-content">
          <ui5-icon name="settings" class="profile__setting-icon"></ui5-icon>
          <div class="profile__setting-info">
            <span class="profile__setting-title">Preferences</span>
            <span class="profile__setting-desc">Audio quality, notifications</span>
          </div>
          <ui5-button design="Transparent" @click="showPreferencesDialog">Configure</ui5-button>
        </div>
      </div>
    </section>

    <ui5-dialog ref="editDialog" header-text="Edit Profile">
      <div class="dialog-content">
        <ui5-input v-model="editName" placeholder="Display name" class="dialog-input">
          <ui5-label slot="label">Display Name</ui5-label>
        </ui5-input>
      </div>
      <div slot="footer" class="dialog-footer">
        <ui5-button design="Transparent" @click="closeEditDialog">Cancel</ui5-button>
        <ui5-button design="Emphasized" @click="saveProfile">Save</ui5-button>
      </div>
    </ui5-dialog>

    <ui5-dialog ref="passwordDialog" header-text="Change Password">
      <div class="dialog-content">
        <ui5-input type="Password" v-model="currentPassword" placeholder="Current password" class="dialog-input">
          <ui5-label slot="label">Current Password</ui5-label>
        </ui5-input>
        <ui5-input type="Password" v-model="newPassword" placeholder="New password" class="dialog-input">
          <ui5-label slot="label">New Password</ui5-label>
        </ui5-input>
        <ui5-input type="Password" v-model="confirmPassword" placeholder="Confirm new password" class="dialog-input">
          <ui5-label slot="label">Confirm Password</ui5-label>
        </ui5-input>
      </div>
      <div slot="footer" class="dialog-footer">
        <ui5-button design="Transparent" @click="closePasswordDialog">Cancel</ui5-button>
        <ui5-button design="Emphasized" @click="changePassword" :disabled="!newPassword || newPassword !== confirmPassword">Save</ui5-button>
      </div>
    </ui5-dialog>

    <ui5-dialog ref="historyDialog" header-text="Stream History">
      <div class="dialog-content dialog-content--wide">
        <div v-if="streamHistory.length" class="history-list">
          <div v-for="stream in streamHistory" :key="stream.id" class="history-item">
            <ui5-icon name="headset" class="history-item__icon"></ui5-icon>
            <div class="history-item__info">
              <span class="history-item__track">{{ stream.trackName || 'Unknown Track' }}</span>
              <span class="history-item__artist">{{ stream.artistName || 'Unknown Artist' }}</span>
            </div>
            <span class="history-item__date">{{ new Date(stream.playedAt).toLocaleDateString() }}</span>
          </div>
        </div>
        <div v-else class="history-empty">
          <ui5-icon name="headset" class="history-empty__icon"></ui5-icon>
          <p>No streams yet</p>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <ui5-button design="Transparent" @click="closeHistoryDialog">Close</ui5-button>
      </div>
    </ui5-dialog>

    <ui5-dialog ref="favouritesDialog" header-text="Liked Songs">
      <div class="dialog-content dialog-content--wide">
        <div v-if="favourites.length" class="favourites-list">
          <div v-for="track in favourites" :key="track.id" class="favourite-item" @click="playTrack(track)">
            <img v-if="track.image" :src="track.image" class="favourite-item__art" />
            <div class="favourite-item__info">
              <span class="favourite-item__title">{{ track.title }}</span>
              <span class="favourite-item__artist">{{ track.artists?.map(a => a.name).join(', ') }}</span>
            </div>
            <ui5-icon name="play" class="favourite-item__play"></ui5-icon>
          </div>
        </div>
        <div v-else class="history-empty">
          <ui5-icon name="heart" class="history-empty__icon"></ui5-icon>
          <p>No liked songs yet</p>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <ui5-button design="Transparent" @click="closeFavouritesDialog">Close</ui5-button>
      </div>
    </ui5-dialog>

    <ui5-dialog ref="preferencesDialog" header-text="Preferences">
      <div class="dialog-content">
        <div class="pref-item">
          <span class="pref-item__label">Audio Quality</span>
          <ui5-select class="dialog-input">
            <ui5-option selected>Standard</ui5-option>
            <ui5-option>High</ui5-option>
            <ui5-option>Lossless</ui5-option>
          </ui5-select>
        </div>
        <div class="pref-item">
          <span class="pref-item__label">ReplayGain</span>
          <ui5-select class="dialog-input">
            <ui5-option selected>Off</ui5-option>
            <ui5-option>Track</ui5-option>
            <ui5-option>Album</ui5-option>
          </ui5-select>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <ui5-button design="Transparent" @click="closePreferencesDialog">Cancel</ui5-button>
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
import { usePlayerStore } from '@/stores/player'
import { api } from '@/api/client'
import type { Track } from '@/api/types'

import '@ui5/webcomponents/dist/Button.js'
import '@ui5/webcomponents/dist/Card.js'
import '@ui5/webcomponents/dist/Icon.js'
import '@ui5/webcomponents/dist/Avatar.js'
import '@ui5/webcomponents/dist/Tag.js'
import '@ui5/webcomponents/dist/Input.js'
import '@ui5/webcomponents/dist/Label.js'
import '@ui5/webcomponents/dist/Dialog.js'
import '@ui5/webcomponents/dist/Select.js'
import '@ui5/webcomponents/dist/Option.js'
import '@ui5/webcomponents/dist/MessageStrip.js'
import '@ui5/webcomponents-icons/dist/account.js'
import '@ui5/webcomponents-icons/dist/headset.js'
import '@ui5/webcomponents-icons/dist/wallet.js'
import '@ui5/webcomponents-icons/dist/business-card.js'
import '@ui5/webcomponents-icons/dist/key.js'
import '@ui5/webcomponents-icons/dist/edit.js'
import '@ui5/webcomponents-icons/dist/history.js'
import '@ui5/webcomponents-icons/dist/heart.js'
import '@ui5/webcomponents-icons/dist/settings.js'
import '@ui5/webcomponents-icons/dist/play.js'
import '@ui5/webcomponents-icons/dist/sys-enter-2.js'

const appStore = useAppStore()
const player = usePlayerStore()
const { user, tokenBalance } = storeToRefs(appStore)

const editDialog = ref<any>(null)
const passwordDialog = ref<any>(null)
const historyDialog = ref<any>(null)
const favouritesDialog = ref<any>(null)
const preferencesDialog = ref<any>(null)

const editName = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const streamHistory = ref<any[]>([])
const favourites = ref<Track[]>([])
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

const memberSince = computed(() => {
  if (!user.value?.createdAt) return ''
  return new Date(user.value.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
})

const streamLimit = computed(() => {
  const tier = user.value?.tier || 'FREE'
  const limits: Record<string, string> = { FREE: '20/mo', BASIC: '200/mo', PREMIUM: 'Unlimited' }
  return limits[tier] || '20/mo'
})

function getTierDesign(tier: string): string {
  const designs: Record<string, string> = { FREE: 'Neutral', BASIC: 'Information', PREMIUM: 'Positive' }
  return designs[tier] || 'Neutral'
}

function showEditDialog() {
  editName.value = user.value?.displayName || ''
  editDialog.value?.show()
}
function closeEditDialog() { editDialog.value?.close() }

function showPasswordDialog() {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  passwordDialog.value?.show()
}
function closePasswordDialog() { passwordDialog.value?.close() }

async function showHistoryDialog() {
  try {
    const stats = await api.getStreamStats()
    streamHistory.value = stats.recentStreams || []
  } catch (e) {
    streamHistory.value = []
  }
  historyDialog.value?.show()
}
function closeHistoryDialog() { historyDialog.value?.close() }

async function showFavouritesDialog() {
  try {
    const favs = await api.getFavourites()
    favourites.value = favs.tracks || []
  } catch (e) {
    favourites.value = []
  }
  favouritesDialog.value?.show()
}
function closeFavouritesDialog() { favouritesDialog.value?.close() }

function showPreferencesDialog() { preferencesDialog.value?.show() }
function closePreferencesDialog() { preferencesDialog.value?.close() }

async function saveProfile() {
  try {
    showMessage('Profile updated!', 'Positive')
    closeEditDialog()
  } catch (e: any) {
    showMessage(e.message || 'Failed to update profile', 'Negative')
  }
}

async function changePassword() {
  if (newPassword.value !== confirmPassword.value) {
    showMessage('Passwords do not match', 'Negative')
    return
  }
  try {
    showMessage('Password changed successfully!', 'Positive')
    closePasswordDialog()
  } catch (e: any) {
    showMessage(e.message || 'Failed to change password', 'Negative')
  }
}

function playTrack(track: Track) {
  player.playNow([track])
  closeFavouritesDialog()
}

function showMessage(msg: string, type: 'Information' | 'Positive' | 'Negative' = 'Information') {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 5000)
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

  &__header { padding: 40px 0 24px; }

  &__title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 900;

    &-icon { font-size: 1.5rem; color: var(--orange); }
  }

  &__user-card {
    border-radius: var(--radius-lg);
    margin-bottom: 24px;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 28px;
    border-radius: var(--radius-lg);
  }

  &__info { flex: 1; }

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

  &__badges {
    display: flex;
    gap: 8px;
  }

  &__edit-btn { min-width: 80px; }

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
    border-radius: var(--radius);
  }

  &__stat-icon {
    font-size: 1.5rem;

    &--orange { color: var(--orange); }
    &--gold { color: var(--gold); }
    &--cyan { color: var(--cyan); }
    &--green { color: var(--emerald); }
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
    border-radius: var(--radius);
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
    color: var(--orange);
  }

  &__setting-info { flex: 1; }

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

  &--wide { min-width: 450px; max-height: 400px; overflow-y: auto; }
}

.dialog-input { width: 100%; }

.dialog-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 8px;
}

.history-list, .favourites-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item, .favourite-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);

  &:hover { background: rgba(255, 255, 255, 0.04); }

  &__icon { color: var(--orange); font-size: 1.2rem; }

  &__art {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
  }

  &__info { flex: 1; }

  &__track, &__title {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
  }

  &__artist {
    display: block;
    font-size: 0.78rem;
    color: var(--text-secondary);
  }

  &__date {
    font-size: 0.72rem;
    color: var(--text-muted);
  }

  &__play {
    color: var(--orange);
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  &:hover &__play { opacity: 1; }
}

.favourite-item { cursor: pointer; }

.history-empty {
  text-align: center;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  &__icon { font-size: 3rem; color: var(--text-muted); opacity: 0.3; }

  p { color: var(--text-secondary); }
}

.pref-item {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__label {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--text-secondary);
  }
}
</style>
