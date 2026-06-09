<template>
  <div class="artist-detail" v-if="artist">
    <div class="artist-detail__header">
      <button class="artist-detail__back" @click="$router.back()">
        <ui5-icon name="slim-arrow-left"></ui5-icon>
      </button>
      <ui5-avatar :src="artist.image" shape="Square" size="XL" class="artist-detail__avatar">
        <ui5-icon name="account" v-if="!artist.image"></ui5-icon>
      </ui5-avatar>
      <div class="artist-detail__info">
        <h1 class="artist-detail__name">{{ artist.name }}</h1>
        <p class="artist-detail__stats">{{ artist.albumCount }} albums</p>
      </div>
      <div class="artist-detail__actions">
        <ui5-button design="Emphasized" @click="playAll">
          <ui5-icon name="play" slot="icon"></ui5-icon>
          Play All
        </ui5-button>
        <ui5-button design="Transparent" @click="shufflePlay">
          <ui5-icon name="synchronize" slot="icon"></ui5-icon>
          Shuffle
        </ui5-button>
      </div>
    </div>

    <div class="artist-detail__bio" v-if="artist.description">
      <h3>About</h3>
      <p>{{ artist.description }}</p>
    </div>

    <section class="artist-detail__albums" v-if="artist.albums?.length">
      <h2>Albums</h2>
      <div class="artist-detail__album-grid">
        <ui5-card
          v-for="album in artist.albums"
          :key="album.id"
          class="album-card"
          interactive
          @click="$router.push('/album/' + album.id)"
        >
          <img :src="album.image" :alt="album.name" class="album-card__image" loading="lazy" />
          <div class="album-card__info">
            <span class="album-card__name">{{ album.name }}</span>
            <span class="album-card__year">{{ album.year }}</span>
          </div>
        </ui5-card>
      </div>
    </section>

    <section class="artist-detail__tracks" v-if="allTracks.length">
      <h2>Popular Tracks</h2>
      <div class="track-list">
        <div
          v-for="(track, index) in allTracks"
          :key="track.id"
          class="track-item"
          @click="playTrack(index)"
        >
          <span class="track-item__index">{{ index + 1 }}</span>
          <img v-if="track.image" :src="track.image" class="track-item__art" loading="lazy" />
          <div class="track-item__info">
            <span class="track-item__title">{{ track.title }}</span>
            <span class="track-item__album">{{ track.album }}</span>
          </div>
          <span class="track-item__duration">{{ formatDuration(track.duration) }}</span>
          <button class="track-item__fav" :class="{ 'track-item__fav--active': track.favourite }" @click.stop="toggleFavourite(track)">
            <svg v-if="track.favourite" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>
    </section>
  </div>

  <ui5-busy-indicator v-else active size="Large" class="loader"></ui5-busy-indicator>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { Artist, Track } from '@/api/types'
import { api } from '@/api/client'
import { usePlayerStore } from '@/stores/player'

import '@ui5/webcomponents/dist/Button.js'
import '@ui5/webcomponents/dist/Card.js'
import '@ui5/webcomponents/dist/Icon.js'
import '@ui5/webcomponents/dist/Avatar.js'
import '@ui5/webcomponents/dist/BusyIndicator.js'
import '@ui5/webcomponents-icons/dist/play.js'
import '@ui5/webcomponents-icons/dist/synchronize.js'
import '@ui5/webcomponents-icons/dist/slim-arrow-left.js'
import '@ui5/webcomponents-icons/dist/account.js'

const route = useRoute()
const player = usePlayerStore()
const artist = ref<Artist | null>(null)

const allTracks = computed(() => {
  if (!artist.value?.albums) return []
  const tracks: Track[] = []
  for (const album of artist.value.albums) {
    if (album.tracks) {
      tracks.push(...album.tracks)
    }
  }
  return tracks.slice(0, 20)
})

async function load() {
  try {
    const id = route.params.id as string
    artist.value = await api.getArtistDetails(id)
  } catch (e) {
    console.error('[ArtistDetail]', e)
  }
}

function playAll() {
  if (allTracks.value.length) {
    player.playNow(allTracks.value)
  }
}

function shufflePlay() {
  if (allTracks.value.length) {
    player.shuffleNow(allTracks.value)
  }
}

function playTrack(index: number) {
  player.playNow(allTracks.value)
  player.setQueueIndex(index)
}

async function toggleFavourite(track: Track) {
  try {
    if (track.favourite) {
      await api.removeFavourite(track.id, 'track')
      track.favourite = false
    } else {
      await api.addFavourite(track.id, 'track')
      track.favourite = true
    }
  } catch (e) {
    console.error('[ArtistDetail] Favourite toggle failed:', e)
  }
}

function formatDuration(seconds: number): string {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

onMounted(load)
</script>

<style scoped lang="scss">
.artist-detail {
  padding: 0 28px 40px;
  position: relative;
  z-index: 1;

  &__header {
    padding: 40px 0 24px;
    display: flex;
    align-items: center;
    gap: 24px;
  }

  &__back {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--glass-border);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-fast);

    &:hover {
      color: var(--text-primary);
      border-color: rgba(120, 80, 255, 0.3);
    }
  }

  &__avatar {
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
  }

  &__name {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 900;
  }

  &__stats {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-top: 4px;
  }

  &__actions {
    display: flex;
    gap: 10px;
  }

  &__bio {
    margin-bottom: 32px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: var(--radius);
    border: 1px solid var(--glass-border);

    h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 10px;
    }

    p {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }
  }

  &__albums {
    margin-bottom: 32px;

    h2 {
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 16px;
    }
  }

  &__album-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }

  &__tracks {
    h2 {
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 16px;
    }
  }
}

.album-card {
  cursor: pointer;
  transition: all var(--transition-smooth);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-glow);
  }

  &__image {
    width: 100%;
    height: 180px;
    object-fit: cover;
    display: block;
  }

  &__info {
    padding: 12px;
  }

  &__name {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__year {
    font-size: 0.78rem;
    color: var(--text-muted);
  }
}

.track-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 16px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  &__index {
    width: 24px;
    font-size: 0.82rem;
    color: var(--text-muted);
    text-align: center;
  }

  &__art {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__title {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__album {
    display: block;
    font-size: 0.78rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__duration {
    font-size: 0.82rem;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  &__fav {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: transparent;
    border: none;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-fast);

    &:hover {
      color: var(--magenta);
      background: rgba(255, 64, 129, 0.1);
    }

    &--active {
      color: var(--magenta);
    }
  }
}

.loader {
  display: flex;
  justify-content: center;
  padding: 120px 0;
}
</style>
