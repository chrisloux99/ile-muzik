<template>
  <div class="home">
    <section class="hero">
      <div class="hero__content">
        <div class="hero__greeting">
          <ui5-avatar :initials="userInitial" shape="Circle" size="M" color-scheme="Accent7"></ui5-avatar>
          <div class="hero__greeting-text">
            <span class="hero__wave">Welcome back</span>
            <span class="hero__name">{{ userName }}</span>
          </div>
        </div>
        <h1 class="hero__title">
          <span class="gradient-text">Discover</span> your sound
        </h1>
      </div>

      <ui5-button design="Emphasized" class="hero__play-btn" @click="playRandom">
        <ui5-icon name="play" slot="icon"></ui5-icon>
      </ui5-button>
    </section>

    <section class="stats-grid">
      <ui5-card class="stat-card" @click="$router.push('/wallet')" interactive>
        <div class="stat-card__content">
          <ui5-icon name="wallet" class="stat-card__icon stat-card__icon--gold"></ui5-icon>
          <div class="stat-card__info">
            <span class="stat-card__value">{{ tokenBalance.toFixed(2) }}</span>
            <span class="stat-card__label">iLe Balance</span>
          </div>
          <ui5-icon name="slim-arrow-right" class="stat-card__arrow"></ui5-icon>
        </div>
      </ui5-card>

      <ui5-card class="stat-card" @click="$router.push('/subscriptions')" interactive>
        <div class="stat-card__content">
          <ui5-icon name="headset" class="stat-card__icon stat-card__icon--violet"></ui5-icon>
          <div class="stat-card__info">
            <span class="stat-card__value">{{ streamsThisMonth }}/{{ streamLimit === -1 ? '∞' : streamLimit }}</span>
            <span class="stat-card__label">Streams This Month</span>
          </div>
          <ui5-icon name="slim-arrow-right" class="stat-card__arrow"></ui5-icon>
        </div>
      </ui5-card>

      <ui5-card class="stat-card" @click="$router.push('/subscriptions')" interactive>
        <div class="stat-card__content">
          <ui5-icon name="business-card" class="stat-card__icon stat-card__icon--cyan"></ui5-icon>
          <div class="stat-card__info">
            <span class="stat-card__value">{{ userTier }}</span>
            <span class="stat-card__label">Current Plan</span>
          </div>
          <ui5-icon name="slim-arrow-right" class="stat-card__arrow"></ui5-icon>
        </div>
      </ui5-card>
    </section>

    <section class="quick-actions">
      <ui5-button design="Transparent" class="action-btn" @click="playRandom">
        <ui5-icon name="synchronize" slot="icon"></ui5-icon>
        Shuffle Play
      </ui5-button>
      <ui5-button design="Transparent" class="action-btn" @click="$router.push('/wallet')">
        <ui5-icon name="wallet" slot="icon"></ui5-icon>
        Wallet
      </ui5-button>
      <ui5-button design="Transparent" class="action-btn" @click="$router.push('/subscriptions')">
        <ui5-icon name="business-card" slot="icon"></ui5-icon>
        Plans
      </ui5-button>
      <ui5-button design="Transparent" class="action-btn" @click="$router.push('/search')">
        <ui5-icon name="search" slot="icon"></ui5-icon>
        Search
      </ui5-button>
    </section>

    <section class="section" v-if="genres.length">
      <div class="section__header">
        <h2 class="section__title">Genres</h2>
        <div class="section__line"></div>
      </div>
      <div class="genre-grid">
        <ui5-token
          v-for="(g, i) in genres"
          :key="g.name"
          :text="g.name + ' (' + g.albumCount + ')'"
          :style="{ '--delay': i * 0.04 + 's' }"
          @click="playGenre(g.name)"
          class="genre-chip"
        ></ui5-token>
      </div>
    </section>

    <section class="section" v-if="recentAlbums.length">
      <div class="section__header">
        <h2 class="section__title">Recently Played</h2>
        <div class="section__line"></div>
      </div>
      <div class="album-row">
        <ui5-card
          v-for="a in recentAlbums"
          :key="a.id"
          class="album-tile"
          @click="playAlbum(a)"
          interactive
        >
          <div class="album-tile__art">
            <img :src="a.image" :alt="a.name" loading="lazy" />
            <div class="album-tile__play">
              <ui5-icon name="play" class="album-tile__play-icon"></ui5-icon>
            </div>
          </div>
          <div class="album-tile__meta">
            <span class="album-tile__name">{{ a.name }}</span>
            <span class="album-tile__artist">{{ a.artists?.[0]?.name }}</span>
          </div>
        </ui5-card>
      </div>
    </section>

    <section class="section" v-if="newAlbums.length">
      <div class="section__header">
        <h2 class="section__title">Fresh Drops</h2>
        <div class="section__line"></div>
      </div>
      <div class="album-row">
        <ui5-card
          v-for="a in newAlbums"
          :key="a.id"
          class="album-tile"
          @click="playAlbum(a)"
          interactive
        >
          <div class="album-tile__art">
            <img :src="a.image" :alt="a.name" loading="lazy" />
            <div class="album-tile__play">
              <ui5-icon name="play" class="album-tile__play-icon"></ui5-icon>
            </div>
          </div>
          <div class="album-tile__meta">
            <span class="album-tile__name">{{ a.name }}</span>
            <span class="album-tile__artist">{{ a.artists?.[0]?.name }}</span>
          </div>
        </ui5-card>
      </div>
    </section>

    <ui5-busy-indicator v-if="loading" active size="Large" class="loader"></ui5-busy-indicator>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Album, Genre } from '@/api/types'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/app'
import { usePlayerStore } from '@/stores/player'

import '@ui5/webcomponents/dist/Button.js'
import '@ui5/webcomponents/dist/Card.js'
import '@ui5/webcomponents/dist/Icon.js'
import '@ui5/webcomponents/dist/Avatar.js'
import '@ui5/webcomponents/dist/Token.js'
import '@ui5/webcomponents/dist/BusyIndicator.js'
import '@ui5/webcomponents-icons/dist/play.js'
import '@ui5/webcomponents-icons/dist/synchronize.js'
import '@ui5/webcomponents-icons/dist/search.js'
import '@ui5/webcomponents-icons/dist/wallet.js'
import '@ui5/webcomponents-icons/dist/business-card.js'
import '@ui5/webcomponents-icons/dist/headset.js'
import '@ui5/webcomponents-icons/dist/slim-arrow-right.js'

const appStore = useAppStore()
const player = usePlayerStore()
const genres = ref<Genre[]>([])
const recentAlbums = ref<Album[]>([])
const newAlbums = ref<Album[]>([])
const loading = ref(true)

const userName = computed(() => appStore.user?.displayName || appStore.getDisplayName?.() || 'there')
const userInitial = computed(() => {
  const name = userName.value
  return name ? name.charAt(0).toUpperCase() : 'U'
})
const tokenBalance = computed(() => appStore.tokenBalance)
const streamsThisMonth = computed(() => appStore.user?.streamsThisMonth || 0)
const userTier = computed(() => appStore.user?.tier || 'FREE')
const streamLimit = computed(() => {
  const tier = userTier.value
  const limits: Record<string, number> = { FREE: 20, BASIC: 200, PREMIUM: -1 }
  return limits[tier] ?? 20
})

async function load() {
  try {
    const [g, recent, fresh] = await Promise.all([
      api.getGenres(),
      api.getAlbums('recent', 12),
      api.getAlbums('newest', 12)
    ])
    genres.value = g
    recentAlbums.value = recent
    newAlbums.value = fresh
    await appStore.refreshProfile()
  } catch (e) {
    console.error('[Home]', e)
  } finally {
    loading.value = false
  }
}

async function playRandom() {
  const tracks = await api.getRandomTracks({ size: 50 })
  if (tracks.length) player.shuffleNow(tracks)
}

async function playGenre(name: string) {
  const tracks = await api.getRandomTracks({ size: 50, genre: name })
  if (tracks.length) player.shuffleNow(tracks)
}

async function playAlbum(album: Album) {
  if (album.tracks?.length) {
    player.playNow(album.tracks)
  } else {
    const details = await api.getAlbumDetails(album.id)
    if (details.tracks?.length) player.playNow(details.tracks)
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.home {
  position: relative;
  z-index: 1;
  padding: 0 28px 40px;
}

.hero {
  padding: 48px 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  &__content {
    flex: 1;
  }

  &__greeting {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__greeting-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__wave {
    font-size: 0.78rem;
    color: var(--text-muted);
    animation: float 2s ease-in-out infinite;
    display: inline-block;
  }

  &__name {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text-primary);
  }

  &__title {
    font-family: var(--font-display);
    font-size: 2.2rem;
    font-weight: 900;
    line-height: 1.15;

    @media (max-width: 768px) {
      font-size: 1.6rem;
    }
  }

  &__play-btn {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    min-width: 72px;
    padding: 0;
    animation: breathe 3s ease-in-out infinite;

    &:hover {
      transform: scale(1.08);
    }

    &:active { transform: scale(0.95); }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 28px;
}

.stat-card {
  cursor: pointer;
  transition: all var(--transition-smooth);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-glow);
  }

  &__content {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
  }

  &__icon {
    font-size: 1.5rem;

    &--gold {
      color: var(--gold);
    }

    &--violet {
      color: var(--violet-bright);
    }

    &--cyan {
      color: var(--cyan);
    }
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__value {
    font-family: var(--font-mono);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  &__label {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  &__arrow {
    color: var(--text-muted);
    transition: transform var(--transition-fast);
  }

  &:hover &__arrow {
    transform: translateX(4px);
    color: var(--violet-bright);
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 32px;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 12px;
  border-radius: var(--radius);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 500;
  height: auto;
  transition: all var(--transition-smooth);

  &:hover {
    color: var(--text-primary);
    background: rgba(120, 80, 255, 0.08);
  }

  &:active {
    transform: scale(0.95);
  }
}

.section {
  margin-bottom: 36px;

  &__header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 1.15rem;
    font-weight: 700;
    white-space: nowrap;
    font-family: var(--font-display);
  }

  &__line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(120, 80, 255, 0.2), transparent);
  }
}

.genre-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.genre-chip {
  cursor: pointer;
  transition: all var(--transition-smooth);
  animation: slideUp 0.4s ease both;
  animation-delay: var(--delay);

  &:hover {
    transform: translateY(-2px);
  }
}

.album-row {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;

  &::-webkit-scrollbar { height: 3px; }
}

.album-tile {
  flex: 0 0 170px;
  scroll-snap-align: start;
  cursor: pointer;
  transition: all var(--transition-smooth);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-glow);
  }

  &__art {
    width: 170px;
    height: 170px;
    overflow: hidden;
    position: relative;
    background: var(--surface);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
  }

  &__play {
    position: absolute;
    inset: 0;
    background: rgba(5, 5, 16, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all var(--transition-smooth);

    &-icon {
      font-size: 2rem;
      color: white;
      transform: scale(0.8);
      transition: transform var(--transition-spring);
    }
  }

  &:hover {
    .album-tile__art img { transform: scale(1.08); }
    .album-tile__play {
      opacity: 1;
      .album-tile__play-icon { transform: scale(1); }
    }
  }

  &__meta {
    padding: 10px 2px 0;
  }

  &__name {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__artist {
    display: block;
    font-size: 0.72rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }
}

.loader {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}
</style>
