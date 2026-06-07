<template>
  <div class="search">
    <div class="search__bar">
      <svg class="search__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input
        v-model="query"
        type="text"
        placeholder="Search your music..."
        class="search__input"
        autofocus
      />
      <button v-if="query" class="search__clear" @click="query = ''">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div v-if="query && !loading" class="search__filters">
      <button
        v-for="f in filters"
        :key="f.key"
        class="search__filter"
        :class="{ 'search__filter--active': activeFilter === f.key }"
        @click="activeFilter = f.key as any"
      >
        {{ f.label }}
        <span v-if="f.count > 0" class="search__filter-count">{{ f.count }}</span>
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading__spinner"></div>
    </div>

    <template v-else-if="query && hasResults">
      <section v-if="(activeFilter === 'all' || activeFilter === 'tracks') && results.tracks.length" class="section">
        <div class="section__header">
          <h2 class="section__title">Tracks</h2>
          <Btn3D variant="ghost" size="sm" @click="playAllTracks">Play All</Btn3D>
        </div>
        <div class="track-list">
          <div
            v-for="(t, i) in results.tracks"
            :key="t.id"
            class="track-item"
            @click="playTrack(i)"
          >
            <span class="track-item__num">{{ i + 1 }}</span>
            <div class="track-item__art">
              <img v-if="t.image" :src="t.image" loading="lazy" />
            </div>
            <div class="track-item__info">
              <div class="track-item__title">{{ t.title }}</div>
              <div class="track-item__artist">{{ t.artists?.map(a => a.name).join(', ') }}</div>
            </div>
            <span class="track-item__duration">{{ formatTime(t.duration) }}</span>
          </div>
        </div>
      </section>

      <section v-if="(activeFilter === 'all' || activeFilter === 'albums') && results.albums.length" class="section">
        <h2 class="section__title">Albums</h2>
        <div class="album-grid">
          <div v-for="a in results.albums" :key="a.id" class="album-card" @click="playAlbum(a)">
            <div class="album-card__art">
              <img :src="a.image" :alt="a.name" loading="lazy" />
              <div class="album-card__overlay">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
            <div class="album-card__info">
              <div class="album-card__name">{{ a.name }}</div>
              <div class="album-card__artist">{{ a.artists?.[0]?.name }}</div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="(activeFilter === 'all' || activeFilter === 'artists') && results.artists.length" class="section">
        <h2 class="section__title">Artists</h2>
        <div class="artist-grid">
          <div v-for="a in results.artists" :key="a.id" class="artist-card" @click="playArtist(a)">
            <div class="artist-card__avatar">
              <img v-if="a.image" :src="a.image" loading="lazy" />
              <div v-else class="artist-card__placeholder">{{ a.name.charAt(0) }}</div>
            </div>
            <div class="artist-card__name">{{ a.name }}</div>
          </div>
        </div>
      </section>
    </template>

    <div v-else-if="query && !loading" class="empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <p>No results found for "{{ query }}"</p>
    </div>

    <div v-else-if="!query" class="empty">
      <svg width="56" height="56" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="40" cy="90" rx="30" ry="25" fill="none" stroke="var(--zambia-green)" stroke-width="1.5" opacity="0.2"/>
        <rect x="35" y="10" width="2" height="70" rx="1" fill="var(--zambia-green)" opacity="0.2"/>
        <rect x="30" y="18" width="2" height="62" rx="1" fill="var(--zambia-orange)" opacity="0.15"/>
        <rect x="40" y="14" width="2" height="66" rx="1" fill="var(--zambia-green)" opacity="0.2"/>
        <rect x="25" y="24" width="2" height="56" rx="1" fill="var(--zambia-red)" opacity="0.1"/>
        <rect x="45" y="20" width="2" height="60" rx="1" fill="var(--zambia-orange)" opacity="0.15"/>
      </svg>
      <p>Search your music library</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Album, Artist, Track, SearchResult } from '@/api/types'
import { api } from '@/api/client'
import { usePlayerStore } from '@/stores/player'
import Btn3D from '@/components/Btn3D.vue'

const player = usePlayerStore()
const query = ref('')
const activeFilter = ref<'all' | 'tracks' | 'albums' | 'artists'>('all')
const loading = ref(false)
const results = ref<SearchResult>({ albums: [], artists: [], tracks: [] })

let debounceTimer: ReturnType<typeof setTimeout>

const hasResults = computed(() =>
  results.value.albums.length + results.value.artists.length + results.value.tracks.length > 0
)

const filters = computed(() => [
  { key: 'all', label: 'All', count: 0 },
  { key: 'albums', label: 'Albums', count: results.value.albums.length },
  { key: 'artists', label: 'Artists', count: results.value.artists.length },
  { key: 'tracks', label: 'Tracks', count: results.value.tracks.length }
])

watch(query, () => {
  clearTimeout(debounceTimer)
  if (!query.value.trim()) {
    results.value = { albums: [], artists: [], tracks: [] }
    return
  }
  debounceTimer = setTimeout(doSearch, 300)
})

async function doSearch() {
  if (!query.value.trim()) return
  loading.value = true
  try {
    results.value = await api.search(query.value.trim())
  } catch (e) {
    console.error('[Search]', e)
  } finally {
    loading.value = false
  }
}

function formatTime(s: number) {
  if (!s) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function playAllTracks() {
  if (results.value.tracks.length) player.playNow(results.value.tracks)
}

function playTrack(index: number) {
  player.playTrackList(results.value.tracks, index)
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
  const details = await api.getArtistDetails(artist.id)
  const allTracks = details.albums?.flatMap(a => a.tracks || []) || []
  if (allTracks.length) player.shuffleNow(allTracks)
}
</script>

<style scoped lang="scss">
.search {
  position: relative;
  z-index: 1;
  padding: 32px 24px 40px;

  &__bar {
    position: relative;
    max-width: 560px;
    margin-bottom: 24px;
  }

  &__icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }

  &__input {
    width: 100%;
    padding: 14px 44px 14px 48px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--text-primary);
    font-size: 1rem;
    outline: none;
    transition: all 0.2s ease;

    &::placeholder { color: var(--text-muted); }
    &:focus {
      border-color: rgba(25,138,0,0.4);
      box-shadow: 0 0 0 3px rgba(25,138,0,0.1);
    }
  }

  &__clear {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    &:hover { color: var(--text-primary); }
  }

  &__filters {
    display: flex;
    gap: 6px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  &__filter {
    padding: 6px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 20px;
    color: var(--text-secondary);
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;

    &--active {
      background: rgba(25,138,0,0.15);
      border-color: rgba(25,138,0,0.3);
      color: var(--zambia-green-light);
    }

    &:hover:not(&--active) {
      border-color: rgba(255,255,255,0.15);
      color: var(--text-primary);
    }
  }

  &__filter-count {
    font-size: 0.7rem;
    opacity: 0.6;
  }
}

.section {
  margin-bottom: 32px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  &__title {
    font-size: 1.2rem;
    font-weight: 700;
    font-family: 'Playfair Display', serif;
  }
}

.track-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover { background: rgba(255,255,255,0.04); }

  &__num {
    width: 24px;
    text-align: center;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  &__art {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
    background: var(--bg-surface);

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__info { flex: 1; min-width: 0; }

  &__title {
    font-size: 0.88rem;
    font-weight: 500;
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
    margin-top: 1px;
  }

  &__duration {
    font-size: 0.78rem;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
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

    img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover {
    .album-card__art img { transform: scale(1.05); }
    .album-card__overlay { opacity: 1; }
  }

  &__info { padding: 8px 2px 0; }

  &__name {
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__artist {
    font-size: 0.72rem;
    color: var(--text-secondary);
    margin-top: 2px;
  }
}

.artist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.artist-card {
  text-align: center;
  cursor: pointer;

  &__avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 auto 8px;
    background: linear-gradient(135deg, rgba(25,138,0,0.15), rgba(239,125,0,0.1));

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
    font-family: 'Playfair Display', serif;
    color: var(--text-muted);
  }

  &__name {
    font-size: 0.82rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;

  &__spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(25,138,0,0.2);
    border-top-color: var(--zambia-green);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
