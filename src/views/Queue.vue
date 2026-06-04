<template>
  <div class="queue">
    <div class="queue__header">
      <div>
        <h1 class="queue__title">Queue</h1>
        <p class="queue__count" v-if="queue.length">{{ queue.length }} tracks</p>
      </div>
      <Btn3D v-if="queue.length" variant="ghost" size="sm" @click="clearQueue">Clear Queue</Btn3D>
    </div>

    <div v-if="!queue.length" class="empty">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.2">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
      <p>Your queue is empty</p>
      <span>Play some music to fill it up</span>
    </div>

    <div v-else class="queue__list">
      <div
        v-for="(t, i) in queue"
        :key="`${t.id}-${i}`"
        class="queue-item"
        :class="{ 'queue-item--active': i === queueIndex }"
        @click="playFrom(i)"
      >
        <div class="queue-item__indicator">
          <template v-if="i === queueIndex && isPlaying">
            <span class="queue-item__bar"></span>
            <span class="queue-item__bar"></span>
            <span class="queue-item__bar"></span>
          </template>
          <span v-else class="queue-item__num">{{ i + 1 }}</span>
        </div>

        <div class="queue-item__art">
          <img v-if="t.image" :src="t.image" loading="lazy" />
          <div v-else class="queue-item__art-placeholder">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          </div>
        </div>

        <div class="queue-item__info">
          <div class="queue-item__title">{{ t.title }}</div>
          <div class="queue-item__artist">{{ t.artists?.map(a => a.name).join(', ') }}</div>
        </div>

        <span class="queue-item__duration">{{ formatTime(t.duration) }}</span>

        <button class="queue-item__remove" @click.stop="removeTrack(i)" title="Remove">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePlayerStore } from '@/stores/player'
import Btn3D from '@/components/Btn3D.vue'

const player = usePlayerStore()
const { queue, queueIndex, isPlaying } = storeToRefs(player)

function formatTime(s: number) {
  if (!s) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function playFrom(index: number) {
  player.playTrackList(queue.value, index)
}

function removeTrack(index: number) {
  player.removeFromQueue(index)
}

function clearQueue() {
  player.stop()
  player.setQueue([])
}
</script>

<style scoped lang="scss">
.queue {
  position: relative;
  z-index: 1;
  padding: 32px 24px 40px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  &__title {
    font-size: 1.8rem;
    font-weight: 700;
    font-family: 'Playfair Display', serif;
  }

  &__count {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 2px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255,255,255,0.03);
    .queue-item__remove { opacity: 1; }
  }

  &--active {
    background: rgba(25,138,0,0.08);

    .queue-item__title { color: var(--zambia-green-light); }
    .queue-item__num { color: var(--zambia-green-light); }
  }

  &__indicator {
    width: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__num {
    font-size: 0.82rem;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }

  &__bar {
    width: 3px;
    background: var(--zambia-green);
    border-radius: 1px;
    animation: barPulse 0.5s ease-in-out infinite alternate;

    &:nth-child(1) { height: 10px; animation-delay: 0s; }
    &:nth-child(2) { height: 16px; animation-delay: 0.15s; }
    &:nth-child(3) { height: 8px; animation-delay: 0.3s; }

    & + & { margin-left: 2px; }
  }

  &__art {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    background: var(--bg-surface);

    img { width: 100%; height: 100%; object-fit: cover; }
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

  &__info {
    flex: 1;
    min-width: 0;
  }

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
    flex-shrink: 0;
  }

  &__remove {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 6px;
    border-radius: 50%;
    opacity: 0;
    transition: all 0.15s ease;
    flex-shrink: 0;

    &:hover {
      color: var(--zambia-red);
      background: rgba(222,32,16,0.1);
    }
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 80px 0;
  text-align: center;

  p {
    color: var(--text-secondary);
    font-size: 1rem;
    margin-top: 8px;
  }

  span {
    font-size: 0.82rem;
    color: var(--text-muted);
  }
}

@keyframes barPulse {
  0% { transform: scaleY(0.4); }
  100% { transform: scaleY(1); }
}
</style>
