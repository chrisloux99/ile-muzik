<template>
  <div class="home">
    <section class="hero">
      <div class="hero__content">
        <Logo3D size="lg" />
        <p class="hero__subtitle">Welcome to the Sound of Zambia</p>
        <Btn3D variant="orange" size="lg" @click="playRandom">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          Play Random Mix
        </Btn3D>
      </div>
    </section>

    <section class="section" v-if="genres.length">
      <h2 class="section__title">Genres</h2>
      <div class="genres">
        <button
          v-for="g in genres"
          :key="g.name"
          class="genre-card"
          @click="playGenre(g.name)"
        >
          <span class="genre-card__name">{{ g.name }}</span>
          <span class="genre-card__count">{{ g.albumCount }} albums</span>
        </button>
      </div>
    </section>

    <section class="section" v-if="recentAlbums.length">
      <h2 class="section__title">Recently Played</h2>
      <div class="album-scroll">
        <div
          v-for="a in recentAlbums"
          :key="a.id"
          class="album-card"
          @click="playAlbum(a)"
        >
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

    <section class="section" v-if="newAlbums.length">
      <h2 class="section__title">Recently Added</h2>
      <div class="album-scroll">
        <div
          v-for="a in newAlbums"
          :key="a.id"
          class="album-card"
          @click="playAlbum(a)"
        >
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

    <div v-if="loading" class="loading">
      <div class="loading__spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Album, Genre } from '@/api/types'
import { api } from '@/api/client'
import { usePlayerStore } from '@/stores/player'
import Logo3D from '@/components/Logo3D.vue'
import Btn3D from '@/components/Btn3D.vue'

const player = usePlayerStore()
const genres = ref<Genre[]>([])
const recentAlbums = ref<Album[]>([])
const newAlbums = ref<Album[]>([])
const loading = ref(true)

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
  padding: 0 24px 40px;
}

.hero {
  padding: 40px 0 48px;
  text-align: center;

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  &__subtitle {
    font-size: 1rem;
    color: var(--text-secondary);
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }
}

.section {
  margin-bottom: 40px;

  &__title {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 18px;
    font-family: 'Playfair Display', serif;
  }
}

.genres {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.genre-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(25,138,0,0.06), rgba(239,125,0,0.04));
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover {
    border-color: rgba(25,138,0,0.3);
    transform: translateY(-2px);

    &::before { opacity: 1; }
  }

  &__name {
    display: block;
    font-size: 0.88rem;
    font-weight: 600;
    position: relative;
  }

  &__count {
    display: block;
    font-size: 0.72rem;
    color: var(--text-muted);
    margin-top: 4px;
    position: relative;
  }
}

.album-scroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;

  &::-webkit-scrollbar { height: 4px; }
}

.album-card {
  flex: 0 0 160px;
  scroll-snap-align: start;
  cursor: pointer;

  &__art {
    width: 160px;
    height: 160px;
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

  &:hover {
    .album-card__art img { transform: scale(1.05); }
    .album-card__overlay { opacity: 1; }
  }

  &__info {
    padding: 8px 2px 0;
  }

  &__name {
    font-size: 0.82rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__artist {
    font-size: 0.72rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    border: 3px solid rgba(25,138,0,0.2);
    border-top-color: var(--zambia-green);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
