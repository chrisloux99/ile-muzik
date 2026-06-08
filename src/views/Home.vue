<template>
  <div class="home">
    <section class="hero">
      <div class="hero__content">
        <div class="hero__greeting">
          <span class="hero__wave">Hello</span>
          <span class="hero__name">{{ userName }}</span>
        </div>
        <h1 class="hero__title">
          <span class="gradient-text">Discover</span> your sound
        </h1>
        <p class="hero__sub">
          <span class="hero__token-badge">
            <span class="hero__token-dot"></span>
            {{ tokenBalance.toFixed(2) }} iLe
          </span>
          <span class="hero__divider">|</span>
          <span>{{ streamsThisMonth }}/{{ streamLimit === -1 ? '∞' : streamLimit }} streams</span>
        </p>
      </div>

      <button class="hero__play-btn" @click="playRandom">
        <div class="hero__play-ring"></div>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
      </button>
    </section>

    <section class="section" v-if="genres.length">
      <div class="section__header">
        <h2 class="section__title">Genres</h2>
        <div class="section__line"></div>
      </div>
      <div class="genre-grid">
        <button
          v-for="(g, i) in genres"
          :key="g.name"
          class="genre-chip"
          :style="{ '--delay': i * 0.04 + 's' }"
          @click="playGenre(g.name)"
        >
          <span class="genre-chip__name">{{ g.name }}</span>
          <span class="genre-chip__count">{{ g.albumCount }}</span>
        </button>
      </div>
    </section>

    <section class="section" v-if="recentAlbums.length">
      <div class="section__header">
        <h2 class="section__title">Recently Played</h2>
        <div class="section__line"></div>
      </div>
      <div class="album-row">
        <div
          v-for="a in recentAlbums"
          :key="a.id"
          class="album-tile"
          @click="playAlbum(a)"
        >
          <div class="album-tile__art">
            <img :src="a.image" :alt="a.name" loading="lazy" />
            <div class="album-tile__play">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <div class="album-tile__meta">
            <span class="album-tile__name">{{ a.name }}</span>
            <span class="album-tile__artist">{{ a.artists?.[0]?.name }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section" v-if="newAlbums.length">
      <div class="section__header">
        <h2 class="section__title">Fresh Drops</h2>
        <div class="section__line"></div>
      </div>
      <div class="album-row">
        <div
          v-for="a in newAlbums"
          :key="a.id"
          class="album-tile"
          @click="playAlbum(a)"
        >
          <div class="album-tile__art">
            <img :src="a.image" :alt="a.name" loading="lazy" />
            <div class="album-tile__play">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <div class="album-tile__meta">
            <span class="album-tile__name">{{ a.name }}</span>
            <span class="album-tile__artist">{{ a.artists?.[0]?.name }}</span>
          </div>
        </div>
      </div>
    </section>

    <div v-if="loading" class="loader">
      <div class="loader__orb"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Album, Genre } from '@/api/types'
import { api } from '@/api/client'
import { useAppStore } from '@/stores/app'
import { usePlayerStore } from '@/stores/player'

const appStore = useAppStore()
const player = usePlayerStore()
const genres = ref<Genre[]>([])
const recentAlbums = ref<Album[]>([])
const newAlbums = ref<Album[]>([])
const loading = ref(true)

const userName = computed(() => appStore.user?.displayName || appStore.getDisplayName?.() || 'there')
const tokenBalance = computed(() => appStore.tokenBalance)
const streamsThisMonth = computed(() => appStore.user?.streamsThisMonth || 0)
const streamLimit = computed(() => {
  const tier = appStore.user?.tier || 'FREE'
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
  padding: 48px 0 40px;
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
    gap: 8px;
    margin-bottom: 8px;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  &__wave {
    animation: float 2s ease-in-out infinite;
    display: inline-block;
  }

  &__name {
    font-weight: 600;
    color: var(--text-primary);
  }

  &__title {
    font-family: var(--font-display);
    font-size: 2.2rem;
    font-weight: 900;
    line-height: 1.15;
    margin-bottom: 12px;

    @media (max-width: 768px) {
      font-size: 1.6rem;
    }
  }

  &__sub {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.82rem;
    color: var(--text-secondary);
  }

  &__token-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: rgba(255, 215, 0, 0.08);
    border: 1px solid rgba(255, 215, 0, 0.2);
    border-radius: 100px;
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--gold);
  }

  &__token-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--gold);
    animation: pulse 2s ease-in-out infinite;
  }

  &__divider {
    color: var(--text-muted);
  }

  &__play-btn {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--violet), var(--cyan));
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-smooth);

    &:hover {
      transform: scale(1.08);
      box-shadow: 0 0 40px rgba(120, 80, 255, 0.4);
    }

    &:active { transform: scale(0.95); }
  }

  &__play-ring {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid rgba(120, 80, 255, 0.2);
    animation: breathe 3s ease-in-out infinite;
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
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-smooth);
  animation: slideUp 0.4s ease both;
  animation-delay: var(--delay);

  &:hover {
    color: var(--text-primary);
    border-color: rgba(120, 80, 255, 0.3);
    background: rgba(120, 80, 255, 0.08);
    transform: translateY(-2px);
  }

  &__count {
    font-size: 0.7rem;
    color: var(--text-muted);
    font-family: var(--font-mono);
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

  &__art {
    width: 170px;
    height: 170px;
    border-radius: var(--radius);
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

    svg {
      transform: scale(0.8);
      transition: transform var(--transition-spring);
    }
  }

  &:hover {
    .album-tile__art img { transform: scale(1.08); }
    .album-tile__play {
      opacity: 1;
      svg { transform: scale(1); }
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

  &__orb {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--violet), var(--cyan));
    animation: breathe 1.5s ease-in-out infinite;
    box-shadow: 0 0 40px rgba(120, 80, 255, 0.3);
  }
}
</style>
