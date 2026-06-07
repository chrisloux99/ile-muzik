<template>
  <div class="player" v-if="track">
    <div class="player__progress" @click="seekTo">
      <div class="player__progress-bar" :style="{ width: progressPct + '%' }"></div>
      <div class="player__progress-thumb" :style="{ left: progressPct + '%' }"></div>
    </div>

    <div class="player__inner">
      <div class="player__track" @click="goToQueue">
        <div class="player__art">
          <img v-if="track.image" :src="track.image" alt="" loading="lazy" />
          <div v-else class="player__art-placeholder">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          </div>
          <div v-if="isPlaying" class="player__viz">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
        <div class="player__info">
          <div class="player__title">{{ track.title }}</div>
          <div class="player__artist">{{ track.artists?.map(a => a.name).join(', ') }}</div>
        </div>
      </div>

      <div class="player__controls">
        <button class="player__btn player__btn--sm" :class="{ active: shuffleMode }" @click="handleShuffle">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
        </button>
        <button class="player__btn" @click="handleBack">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
        </button>
        <button class="player__btn player__btn--play" @click="handlePlayPause">
          <svg v-if="isPlaying" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button class="player__btn" @click="handleNext">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
        </button>
        <button class="player__btn player__btn--sm" :class="{ active: repeat }" @click="handleRepeat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        </button>
      </div>

      <div class="player__right">
        <span class="player__time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        <div class="player__volume-wrap">
          <button class="player__btn player__btn--sm" @click="toggleMute">
            <svg v-if="volume > 0" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
          </button>
          <input
            type="range"
            class="player__vol-slider"
            min="0"
            max="1"
            step="0.01"
            :value="volume"
            @input="onVolumeChange"
          />
        </div>
        <button class="player__btn player__btn--sm" :class="{ active: replayGainMode > 0 }" @click="handleReplayGain" title="ReplayGain">
          <span style="font-size:11px;font-weight:700;">RG</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePlayerStore } from '@/stores/player'

const router = useRouter()
const player = usePlayerStore()
const {
  track, isPlaying, currentTime, duration, volume,
  shuffleMode, repeat, replayGainMode
} = storeToRefs(player)

const progressPct = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

function formatTime(s: number) {
  if (!s || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function seekTo(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const pct = (e.clientX - rect.left) / rect.width
  player.seek(pct * duration.value)
}

function onVolumeChange(e: Event) {
  player.setVolume(parseFloat((e.target as HTMLInputElement).value))
}

function toggleMute() {
  player.setVolume(volume.value > 0 ? 0 : 1)
}

function goToQueue() {
  router.push('/queue')
}

function handlePlayPause() {
  player.playPause()
}

function handleNext() {
  player.next()
}

function handleBack() {
  player.back()
}

function handleShuffle() {
  player.toggleShuffle()
}

function handleRepeat() {
  player.toggleRepeat()
}

function handleReplayGain() {
  player.toggleReplayGain()
}
</script>

<style scoped lang="scss">
.player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(10,10,10,0.98);
  border-top: 1px solid var(--border);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
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
    opacity: 0.4;
  }

  &__progress {
    position: absolute;
    top: -3px;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(255,255,255,0.06);
    cursor: pointer;
    z-index: 2;

    &:hover {
      height: 6px;
      top: -4px;

      .player__progress-thumb { opacity: 1; transform: scale(1); }
    }
  }

  &__progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--zambia-green), var(--zambia-orange));
    border-radius: 0 2px 2px 0;
    transition: width 0.1s linear;
  }

  &__progress-thumb {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    background: var(--zambia-orange);
    border-radius: 50%;
    transform: scale(0);
    opacity: 0;
    transition: opacity 0.15s, transform 0.15s;
    margin-left: -6px;
    margin-top: -6px;
    box-shadow: 0 0 8px rgba(239,125,0,0.5);
  }

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    gap: 16px;
    max-width: 100%;
  }

  &__track {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
    flex: 1;
    cursor: pointer;
    max-width: 280px;

    @media (max-width: 768px) {
      max-width: none;
    }
  }

  &__art {
    width: 52px;
    height: 52px;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    position: relative;
    background: var(--bg-surface);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__art-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    background: linear-gradient(135deg, rgba(25,138,0,0.1), rgba(239,125,0,0.1));
  }

  &__viz {
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 2px;
    align-items: flex-end;
    height: 12px;

    span {
      width: 3px;
      background: var(--zambia-green);
      border-radius: 1px;
      animation: vizBar 0.6s ease-in-out infinite alternate;

      &:nth-child(1) { height: 40%; animation-delay: 0s; }
      &:nth-child(2) { height: 70%; animation-delay: 0.1s; }
      &:nth-child(3) { height: 50%; animation-delay: 0.2s; }
      &:nth-child(4) { height: 80%; animation-delay: 0.15s; }
      &:nth-child(5) { height: 30%; animation-delay: 0.25s; }
    }
  }

  &__info {
    min-width: 0;
  }

  &__title {
    font-size: 0.9rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__artist {
    font-size: 0.78rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 6px;

    @media (max-width: 768px) {
      gap: 2px;
    }
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.2s ease;

    &:hover { color: var(--text-primary); background: rgba(255,255,255,0.06); }

    &--sm {
      width: 36px;
      height: 36px;
      &.active { color: var(--zambia-green-light); }
    }

    &--play {
      width: 52px;
      height: 52px;
      background: linear-gradient(145deg, #22a800, #198A00);
      color: #fff;
      box-shadow: 0 2px 8px rgba(25,138,0,0.3);
      transition: all 0.15s ease;

      &:hover {
        background: linear-gradient(145deg, #2bc400, #22a800);
        transform: scale(1.05);
        box-shadow: 0 4px 16px rgba(25,138,0,0.4);
      }

      &:active { transform: scale(0.95); }

      @media (max-width: 768px) {
        width: 46px;
        height: 46px;
      }
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: flex-end;
    max-width: 280px;

    @media (max-width: 768px) {
      display: none;
    }
  }

  &__time {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  &__volume-wrap {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__vol-slider {
    width: 80px;
    height: 4px;
    appearance: none;
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 12px;
      height: 12px;
      background: var(--zambia-green);
      border-radius: 50%;
      cursor: pointer;
    }
  }
}

@keyframes vizBar {
  0% { transform: scaleY(0.3); }
  100% { transform: scaleY(1); }
}
</style>
