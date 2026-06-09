<template>
  <div class="album-detail" v-if="album">
    <div class="album-detail__header">
      <button class="album-detail__back" @click="$router.back()">
        <ui5-icon name="slim-arrow-left"></ui5-icon>
      </button>
      <img :src="album.image" :alt="album.name" class="album-detail__art" />
      <div class="album-detail__info">
        <span class="album-detail__type">{{ album.releaseType || 'Album' }}</span>
        <h1 class="album-detail__name">{{ album.name }}</h1>
        <div class="album-detail__meta">
          <span class="album-detail__artist" @click="goToArtist">{{ album.artists?.[0]?.name }}</span>
          <span class="album-detail__separator">•</span>
          <span class="album-detail__year">{{ album.year }}</span>
          <span class="album-detail__separator">•</span>
          <span class="album-detail__tracks">{{ album.tracks?.length || 0 }} tracks</span>
        </div>
      </div>
    </div>

    <div class="album-detail__actions">
      <ui5-button design="Emphasized" @click="playAll">
        <ui5-icon name="play" slot="icon"></ui5-icon>
        Play
      </ui5-button>
      <ui5-button design="Transparent" @click="shufflePlay">
        <ui5-icon name="synchronize" slot="icon"></ui5-icon>
        Shuffle
      </ui5-button>
      <ui5-button design="Transparent" @click="toggleAlbumFavourite">
        <ui5-icon :name="album.favourite ? 'heart' : 'heart-2'" slot="icon"></ui5-icon>
        {{ album.favourite ? 'Liked' : 'Like' }}
      </ui5-button>
    </div>

    <div class="album-detail__description" v-if="album.description">
      <p>{{ album.description }}</p>
    </div>

    <div class="album-detail__genres" v-if="album.genres?.length">
      <ui5-tag v-for="genre in album.genres" :key="genre.name" design="Information">
        {{ genre.name }}
      </ui5-tag>
    </div>

    <section class="album-detail__tracklist">
      <div
        v-for="(track, index) in album.tracks"
        :key="track.id"
        class="track-row"
        :class="{ 'track-row--active': currentTrackId === track.id }"
        @click="playTrack(index)"
      >
        <span class="track-row__index">
          <ui5-icon v-if="currentTrackId === track.id && isPlaying" name="pause" class="track-row__playing"></ui5-icon>
          <span v-else>{{ index + 1 }}</span>
        </span>
        <div class="track-row__info">
          <span class="track-row__title">{{ track.title }}</span>
          <span class="track-row__artist">{{ track.artists?.map(a => a.name).join(', ') }}</span>
        </div>
        <span class="track-row__duration">{{ formatDuration(track.duration) }}</span>
        <button class="track-row__fav" :class="{ 'track-row__fav--active': track.favourite }" @click.stop="toggleFavourite(track)">
          <svg v-if="track.favourite" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
    </section>
  </div>

  <ui5-busy-indicator v-else active size="Large" class="loader"></ui5-busy-indicator>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import type { Album, Track } from '@/api/types'
import { api } from '@/api/client'
import { usePlayerStore } from '@/stores/player'

import '@ui5/webcomponents/dist/Button.js'
import '@ui5/webcomponents/dist/Icon.js'
import '@ui5/webcomponents/dist/Tag.js'
import '@ui5/webcomponents/dist/BusyIndicator.js'
import '@ui5/webcomponents-icons/dist/play.js'
import '@ui5/webcomponents-icons/dist/synchronize.js'
import '@ui5/webcomponents-icons/dist/slim-arrow-left.js'
import '@ui5/webcomponents-icons/dist/heart.js'
import '@ui5/webcomponents-icons/dist/heart-2.js'
import '@ui5/webcomponents-icons/dist/pause.js'

const route = useRoute()
const router = useRouter()
const player = usePlayerStore()
const album = ref<Album | null>(null)

const { track: currentTrack, isPlaying } = storeToRefs(player)

const currentTrackId = computed(() => currentTrack.value?.id)

async function load() {
  try {
    const id = route.params.id as string
    album.value = await api.getAlbumDetails(id)
  } catch (e) {
    console.error('[AlbumDetail]', e)
  }
}

function playAll() {
  if (album.value?.tracks?.length) {
    player.playNow(album.value.tracks)
  }
}

function shufflePlay() {
  if (album.value?.tracks?.length) {
    player.shuffleNow(album.value.tracks)
  }
}

function playTrack(index: number) {
  if (album.value?.tracks?.length) {
    player.playNow(album.value.tracks)
    player.setQueueIndex(index)
  }
}

function goToArtist() {
  const artistId = album.value?.artists?.[0]?.id
  if (artistId) {
    router.push('/artist/' + artistId)
  }
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
    console.error('[AlbumDetail] Favourite toggle failed:', e)
  }
}

async function toggleAlbumFavourite() {
  if (!album.value) return
  try {
    if (album.value.favourite) {
      await api.removeFavourite(album.value.id, 'album')
      album.value.favourite = false
    } else {
      await api.addFavourite(album.value.id, 'album')
      album.value.favourite = true
    }
  } catch (e) {
    console.error('[AlbumDetail] Album favourite toggle failed:', e)
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
.album-detail {
  padding: 0 28px 40px;
  position: relative;
  z-index: 1;

  &__header {
    padding: 40px 0 24px;
    display: flex;
    align-items: flex-end;
    gap: 24px;
  }

  &__back {
    position: absolute;
    top: 16px;
    left: 16px;
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

  &__art {
    width: 200px;
    height: 200px;
    border-radius: var(--radius);
    object-fit: cover;
    box-shadow: var(--shadow-deep);
  }

  &__info {
    flex: 1;
  }

  &__type {
    font-size: 0.78rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__name {
    font-family: var(--font-display);
    font-size: 2.4rem;
    font-weight: 900;
    line-height: 1.1;
    margin: 8px 0;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  &__artist {
    font-weight: 600;
    cursor: pointer;
    transition: color var(--transition-fast);

    &:hover {
      color: var(--violet-bright);
    }
  }

  &__separator {
    color: var(--text-muted);
  }

  &__actions {
    display: flex;
    gap: 10px;
    margin-bottom: 24px;
  }

  &__description {
    margin-bottom: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: var(--radius-sm);
    border: 1px solid var(--glass-border);

    p {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }
  }

  &__genres {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 24px;
  }

  &__tracklist {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
}

.track-row {
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

  &--active {
    background: rgba(120, 80, 255, 0.08);

    .track-row__title {
      color: var(--violet-bright);
    }
  }

  &__index {
    width: 24px;
    font-size: 0.82rem;
    color: var(--text-muted);
    text-align: center;
  }

  &__playing {
    color: var(--violet-bright);
    animation: pulse 1s ease-in-out infinite;
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

  &__artist {
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
