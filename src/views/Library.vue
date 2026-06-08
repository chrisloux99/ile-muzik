<template>
  <div class="library">
    <div class="library__header">
      <h1 class="library__title">Library</h1>
      <div class="library__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="library__tab"
          :class="{ 'library__tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key as any"
        >{{ tab.label }}</button>
      </div>
    </div>

    <div v-if="activeTab === 'albums'" class="library__sort">
      <select v-model="sortType" @change="loadAlbums" class="library__select">
        <option value="recent">Recently Played</option>
        <option value="newest">Newest</option>
        <option value="frequent">Most Played</option>
        <option value="random">Random</option>
        <option value="alphabeticalByName">A-Z</option>
      </select>
    </div>

    <div v-if="activeTab === 'albums'" class="album-grid">
      <div
        v-for="a in albums"
        :key="a.id"
        class="album-card"
        @click="playAlbum(a)"
      >
        <div class="album-card__art">
          <img :src="a.image" :alt="a.name" loading="lazy" />
          <div class="album-card__overlay">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <button
            v-if="a.favourite"
            class="album-card__fav"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--zambia-red)"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
        </div>
        <div class="album-card__info">
          <div class="album-card__name">{{ a.name }}</div>
          <div class="album-card__artist">{{ a.artists?.[0]?.name }}</div>
        </div>
      </div>
    </div>

    <div v-else class="artist-grid">
      <div
        v-for="a in artists"
        :key="a.id"
        class="artist-card"
        @click="playArtist(a)"
      >
        <div class="artist-card__avatar">
          <img v-if="a.image" :src="a.image" :alt="a.name" loading="lazy" />
          <div v-else class="artist-card__placeholder">
            {{ a.name.charAt(0) }}
          </div>
        </div>
        <div class="artist-card__name">{{ a.name }}</div>
        <div class="artist-card__count">{{ a.albumCount }} albums</div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading__spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Album, Artist } from '@/api/types'
import { api } from '@/api/client'
import { usePlayerStore } from '@/stores/player'

const player = usePlayerStore()
const activeTab = ref<'albums' | 'artists'>('albums')
const sortType = ref('recent')
const albums = ref<Album[]>([])
const artists = ref<Artist[]>([])
const loading = ref(true)

const tabs = [
  { key: 'albums', label: 'Albums' },
  { key: 'artists', label: 'Artists' }
]

async function loadAlbums() {
  loading.value = true
  try {
    albums.value = await api.getAlbums(sortType.value, 50)
  } catch (e) {
    console.error('[Library]', e)
  } finally {
    loading.value = false
  }
}

async function loadArtists() {
  loading.value = true
  try {
    artists.value = await api.getArtists()
  } catch (e) {
    console.error('[Library]', e)
  } finally {
    loading.value = false
  }
}

async function playAlbum(album: Album) {
  if (album.tracks?.length) {
    player.playNow(album.tracks)
  } else {
    const details = await api.getAlbumDetails(album.id)
    if (details.tracks?.length) player.playNow(details.tracks)
  }
}

async function playArtist(artist: Artist) {
  try {
    const details = await api.getArtistDetails(artist.id)
    const allTracks = details.albums?.flatMap(a => a.tracks || []) || []
    if (allTracks.length) player.shuffleNow(allTracks)
  } catch (e) {
    console.error('[Library]', e)
  }
}

onMounted(() => {
  loadAlbums()
  loadArtists()
})
</script>

<style scoped lang="scss">
.library {
  position: relative;
  z-index: 1;
  padding: 0 28px 40px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 24px;
    padding-top: 40px;
  }

  &__title {
    font-size: 1.8rem;
    font-weight: 700;
    font-family: 'Playfair Display', serif;
  }

  &__tabs {
    display: flex;
    background: rgba(255,255,255,0.04);
    border-radius: var(--radius-sm);
    padding: 3px;
    gap: 2px;
  }

  &__tab {
    padding: 8px 20px;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;

    &--active {
      background: rgba(120, 80, 255, 0.15);
      color: var(--violet-bright);
    }

    &:hover:not(&--active) {
      color: var(--text-primary);
    }
  }

  &__sort {
    margin-bottom: 20px;
  }

  &__select {
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    padding: 8px 14px;
    font-size: 0.85rem;
    outline: none;
    cursor: pointer;

    option { background: var(--bg-dark); }
  }
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 18px;
}

.album-card {
  cursor: pointer;

  &__art {
    width: 100%;
    aspect-ratio: 1;
    border-radius: var(--radius);
    overflow: hidden;
    position: relative;
    background: var(--bg-surface);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &__fav {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0,0,0,0.6);
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  &:hover {
    .album-card__art img { transform: scale(1.05); }
    .album-card__overlay { opacity: 1; }
  }

  &__info { padding: 10px 2px 0; }

  &__name {
    font-size: 0.88rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__artist {
    font-size: 0.75rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }
}

.artist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 18px;
}

.artist-card {
  text-align: center;
  cursor: pointer;

  &__avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 auto 10px;
    background: linear-gradient(135deg, rgba(120, 80, 255, 0.15), rgba(0, 229, 255, 0.1));
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    font-weight: 700;
    font-family: 'Playfair Display', serif;
    color: var(--text-muted);
  }

  &__name {
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__count {
    font-size: 0.72rem;
    color: var(--text-muted);
    margin-top: 2px;
  }
}

.loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;

  &__spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(120, 80, 255, 0.2);
    border-top-color: var(--violet);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
