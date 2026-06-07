<template>
  <div class="home">
    <section class="hero">
      <div class="hero__instruments">
        <svg class="hero__kalimba" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="40" cy="90" rx="30" ry="25" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.12"/>
          <rect x="35" y="10" width="2" height="70" rx="1" fill="currentColor" opacity="0.1"/>
          <rect x="30" y="18" width="2" height="62" rx="1" fill="currentColor" opacity="0.08"/>
          <rect x="40" y="14" width="2" height="66" rx="1" fill="currentColor" opacity="0.1"/>
          <rect x="25" y="24" width="2" height="56" rx="1" fill="currentColor" opacity="0.06"/>
          <rect x="45" y="20" width="2" height="60" rx="1" fill="currentColor" opacity="0.08"/>
        </svg>
        <svg class="hero__silimba" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="20" width="80" height="30" rx="4" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.1"/>
          <rect x="15" y="10" width="3" height="40" rx="1.5" fill="currentColor" opacity="0.1"/>
          <rect x="22" y="12" width="3" height="38" rx="1.5" fill="currentColor" opacity="0.09"/>
          <rect x="29" y="8" width="3" height="42" rx="1.5" fill="currentColor" opacity="0.1"/>
          <rect x="36" y="14" width="3" height="36" rx="1.5" fill="currentColor" opacity="0.08"/>
          <rect x="43" y="10" width="3" height="40" rx="1.5" fill="currentColor" opacity="0.1"/>
          <rect x="50" y="12" width="3" height="38" rx="1.5" fill="currentColor" opacity="0.09"/>
          <rect x="57" y="8" width="3" height="42" rx="1.5" fill="currentColor" opacity="0.1"/>
          <rect x="64" y="14" width="3" height="36" rx="1.5" fill="currentColor" opacity="0.08"/>
          <rect x="71" y="10" width="3" height="40" rx="1.5" fill="currentColor" opacity="0.1"/>
          <rect x="78" y="12" width="3" height="38" rx="1.5" fill="currentColor" opacity="0.09"/>
        </svg>
      </div>

      <div class="hero__content">
        <Logo3D size="lg" />
        <p class="hero__subtitle">The Sound of Zambia</p>
        <Btn3D variant="orange" size="lg" @click="playRandom">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          Play Random Mix
        </Btn3D>
      </div>
    </section>

    <section class="section" v-if="genres.length">
      <div class="section__header-row">
        <h2 class="section__title">Genres</h2>
        <div class="section__pattern"></div>
      </div>
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
      <div class="section__header-row">
        <h2 class="section__title">Recently Played</h2>
        <div class="section__pattern"></div>
      </div>
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
      <div class="section__header-row">
        <h2 class="section__title">Recently Added</h2>
        <div class="section__pattern"></div>
      </div>
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
  position: relative;

  &__instruments {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  &__kalimba {
    position: absolute;
    width: 100px;
    height: 150px;
    top: 10%;
    left: 5%;
    color: var(--zambia-green);
    animation: floatInstrument 6s ease-in-out infinite;
  }

  &__silimba {
    position: absolute;
    width: 140px;
    height: 80px;
    top: 20%;
    right: 3%;
    color: var(--zambia-orange);
    animation: floatInstrument 7s ease-in-out infinite 1.5s;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    position: relative;
    z-index: 1;
  }

  &__subtitle {
    font-size: 1rem;
    color: var(--text-secondary);
    letter-spacing: 0.08em;
    margin-bottom: 8px;
    font-style: italic;
  }
}

.section {
  margin-bottom: 40px;

  &__header-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 18px;
  }

  &__title {
    font-size: 1.3rem;
    font-weight: 700;
    font-family: 'Playfair Display', serif;
    white-space: nowrap;
  }

  &__pattern {
    flex: 1;
    height: 2px;
    background: repeating-linear-gradient(
      90deg,
      var(--zambia-green) 0px,
      var(--zambia-green) 6px,
      var(--zambia-orange) 6px,
      var(--zambia-orange) 12px,
      var(--zambia-red) 12px,
      var(--zambia-red) 18px,
      transparent 18px,
      transparent 24px
    );
    opacity: 0.35;
    border-radius: 1px;
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

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--zambia-green), var(--zambia-orange), var(--zambia-red));
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover {
    border-color: rgba(25,138,0,0.3);
    transform: translateY(-2px);

    &::before { opacity: 1; }
    &::after { opacity: 0.5; }
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

@keyframes floatInstrument {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(2deg); }
}
</style>
