// Player Store - Queue management, playback state, scrobbling
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Track } from '@/api/types'
import { api } from '@/api/client'
import { AudioController, ReplayGainMode } from '@/audio/engine'

const audio = new AudioController()

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export const usePlayerStore = defineStore('player', () => {
  const queue = ref<Track[]>([])
  const queueIndex = ref(-1)
  const duration = ref(0)
  const currentTime = ref(0)
  const isPlaying = ref(false)
  const repeat = ref(localStorage.getItem('player.repeat') === 'true')
  const shuffleMode = ref(localStorage.getItem('player.shuffle') === 'true')
  const volume = ref(parseFloat(localStorage.getItem('player.volume') || '1.0'))
  const replayGainMode = ref(parseInt(localStorage.getItem('player.replayGainMode') ?? '0'))
  const scrobbled = ref(false)
  const inTransition = ref(false)
  const wasPaused = ref(true)

  const track = computed(() => {
    if (queue.value && queueIndex.value >= 0) return queue.value[queueIndex.value]
    return null
  })

  const nextTrack = computed(() => {
    if (queue.value && queue.value.length > 0) {
      const next = (queueIndex.value + 1) % queue.value.length
      return queue.value[next]
    }
    return null
  })

  const hasNext = computed(() => queue.value && queueIndex.value < queue.value.length - 1)
  const hasPrevious = computed(() => queueIndex.value > 0)

  function setVolume(v: number) {
    audio.setVolume(v)
    volume.value = v
    localStorage.setItem('player.volume', String(v))
  }

  function toggleRepeat() {
    repeat.value = !repeat.value
    localStorage.setItem('player.repeat', String(repeat.value))
  }

  function toggleShuffle() {
    shuffleMode.value = !shuffleMode.value
    localStorage.setItem('player.shuffle', String(shuffleMode.value))
  }

  function toggleReplayGain() {
    const mode = (replayGainMode.value + 1) % ReplayGainMode._Length
    audio.setReplayGainMode(mode)
    replayGainMode.value = mode
    localStorage.setItem('player.replayGainMode', String(mode))
  }

  function setQueue(t: Track[]) {
    queue.value = t
    queueIndex.value = -1
  }

  function setQueueIndex(index: number) {
    if (!queue.value || queue.value.length === 0) {
      queueIndex.value = -1
      duration.value = 0
      return
    }
    index = Math.max(0, index)
    if (index >= queue.value.length) {
      if (repeat.value) {
        index = 0
      } else {
        queueIndex.value = queue.value.length - 1
        return
      }
    }
    queueIndex.value = index
    scrobbled.value = false
    duration.value = track.value?.duration || 0
    currentTime.value = 0

    // Update MediaSession metadata
    if (navigator.mediaSession && track.value) {
      const artwork: MediaImage[] = []
      if (track.value.image) {
        artwork.push(
          { src: track.value.image, sizes: '96x96', type: 'image/png' },
          { src: track.value.image, sizes: '256x256', type: 'image/png' },
          { src: track.value.image, sizes: '512x512', type: 'image/png' }
        )
      }
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.value.title,
        artist: track.value.artists?.map(a => a.name).join(', ') || '',
        album: track.value.album || '',
        artwork
      })
    }
  }

  async function playNow(tracks: Track[]) {
    shuffleMode.value = false
    await playTrackList(tracks, 0)
  }

  async function shuffleNow(tracks: Track[]) {
    shuffleMode.value = true
    await playTrackList(tracks)
  }

  async function playTrackList(tracks: Track[], index?: number) {
    inTransition.value = true
    if (index == null) {
      index = shuffleMode.value ? Math.floor(Math.random() * tracks.length) : 0
    }
    if (shuffleMode.value) {
      tracks = shuffle(tracks)
      index = 0
    }
    setQueue(tracks)
    setQueueIndex(index)
    if (track.value) {
      await audio.loadTrack({
        url: track.value.url,
        replayGain: track.value.replayGain,
        nextUrl: nextTrack.value?.url,
        fade: true
      })
    }
    inTransition.value = false
  }

  async function play() {
    wasPaused.value = false
    await audio.play()
  }

  async function pause() {
    wasPaused.value = true
    await audio.pause()
  }

  async function stop() {
    wasPaused.value = true
    await audio.stop()
  }

  async function playPause() {
    if (isPlaying.value) {
      await pause()
    } else {
      await play()
    }
  }

  async function next(fade = true) {
    if (hasNext.value || repeat.value) {
      inTransition.value = true
      setQueueIndex(queueIndex.value + 1)
      if (track.value) {
        await audio.loadTrack({
          url: track.value.url,
          replayGain: track.value.replayGain,
          nextUrl: nextTrack.value?.url,
          fade
        })
      }
      inTransition.value = false
    } else {
      // End of queue - try radio continuation
      await processQueueEnd()
    }
  }

  async function back() {
    if (currentTime.value > 3) {
      await seek(0)
    } else {
      inTransition.value = true
      setQueueIndex(queueIndex.value - 1)
      if (track.value) {
        await audio.loadTrack({
          url: track.value.url,
          replayGain: track.value.replayGain,
          nextUrl: nextTrack.value?.url,
          fade: true
        })
      }
      inTransition.value = false
    }
  }

  async function seek(position: number) {
    await audio.seek(position)
  }

  function addToQueue(tracks: Track[]) {
    queue.value.push(...tracks)
  }

  function setNextInQueue(tracks: Track[]) {
    queue.value.splice(queueIndex.value + 1, 0, ...tracks)
  }

  function removeFromQueue(index: number) {
    queue.value.splice(index, 1)
    if (index < queueIndex.value) queueIndex.value--
  }

  async function processQueueEnd() {
    if (!track.value?.url) return
    inTransition.value = true
    try {
      // Radio: continue with random tracks from same genre
      const genre = track.value.artists?.[0]?.name
      if (genre) {
        const randomTracks = await api.getRandomTracks({ size: 50 })
        if (randomTracks.length) {
          await playNow(randomTracks)
        }
      }
    } catch {
      // Reset to start
      setQueueIndex(0)
    }
    inTransition.value = false
  }

  // Wire up audio callbacks
  audio.onplay = () => {
    isPlaying.value = true
  }
  audio.onpause = () => {
    isPlaying.value = false
  }
  audio.ontimeupdate = (time: number) => {
    if (inTransition.value) return
    currentTime.value = time

    const t = track.value
    if (!t || !isPlaying.value || time < 20) return

    const d = duration.value
    const remaining = d - time
    if (remaining < 0.1 && hasNext.value) {
      next(false)
      return
    }

    // Scrobble after 50%
    if (!scrobbled.value && d > 0 && time / d > 0.5) {
      scrobbled.value = true
      api.scrobble(t.id).catch(() => {})
    }
  }
  audio.ondurationchange = (d: number) => {
    duration.value = d
  }
  audio.onended = () => {
    if (hasNext.value || repeat.value) {
      next(false)
    } else {
      processQueueEnd()
    }
  }
  audio.onerror = (error: MediaError | null) => {
    console.warn('[Audio] Error', error)
    if (hasNext.value) next(true)
    else if (hasPrevious.value) back()
  }

  // Save queue periodically
  setInterval(() => {
    if (queue.value && track.value && isPlaying.value) {
      api.savePlayQueue(queue.value, track.value, currentTime.value).catch(() => {})
    }
  }, 10000)

  // Restore volume
  audio.setVolume(volume.value)

  return {
    queue, queueIndex, duration, currentTime, isPlaying, repeat, shuffleMode,
    volume, replayGainMode, inTransition, wasPaused,
    track, nextTrack, hasNext, hasPrevious,
    setVolume, toggleRepeat, toggleShuffle, toggleReplayGain,
    playNow, shuffleNow, playTrackList, play, pause, stop, playPause,
    next, back, seek, addToQueue, setNextInQueue, removeFromQueue,
    processQueueEnd, setQueue, setQueueIndex
  }
})
