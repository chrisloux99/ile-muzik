// Audio Engine - Web Audio API pipeline with ReplayGain and gapless playback

export enum ReplayGainMode {
  None,
  Track,
  Album,
  _Length
}

type ReplayGain = {
  trackGain: number
  trackPeak: number
  albumGain: number
  albumPeak: number
}

type AudioPipeline = {
  audio: HTMLAudioElement
  volumeNode: GainNode
  replayGainNode: GainNode
  fadeNode: GainNode
  normalizerNode: DynamicsCompressorNode
  dispose(): void
}

function createPipeline(
  context: AudioContext,
  { audio = new Audio(), volume = 1, replayGain = 1 }
): AudioPipeline {
  audio.playbackRate = 1
  audio.crossOrigin = 'anonymous'

  const source = context.createMediaElementSource(audio)
  const volumeNode = context.createGain()
  const replayGainNode = context.createGain()
  const fadeNode = context.createGain()
  const normalizerNode = context.createDynamicsCompressor()

  volumeNode.gain.value = volume
  replayGainNode.gain.value = replayGain
  fadeNode.gain.value = 1
  normalizerNode.threshold.value = 0

  source
    .connect(volumeNode)
    .connect(replayGainNode)
    .connect(fadeNode)
    .connect(normalizerNode)
    .connect(context.destination)

  function dispose() {
    audio.pause()
    source.disconnect()
    volumeNode.disconnect()
    replayGainNode.disconnect()
    fadeNode.disconnect()
    normalizerNode.disconnect()
    audio.src = ''
    try { audio.load() } catch {}
  }

  return { audio, volumeNode, replayGainNode, fadeNode, normalizerNode, dispose }
}

export class AudioController {
  private fadeTime = 0.3
  private changeToken = 0
  private buffer: HTMLAudioElement | null = null
  private replayGainMode = ReplayGainMode.None
  private replayGain: ReplayGain | null = null
  private _context: AudioContext | null = null
  private pipeline: AudioPipeline | null = null

  private lastLoadOptions: any = null
  private retryCount = 0
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private readonly maxRetries = 4
  private readonly retryDelays = [2000, 4000, 8000, 16000]

  // Callbacks
  ontimeupdate = (_: number) => {}
  ondurationchange = (_: number) => {}
  onpause = () => {}
  onplay = () => {}
  onended = () => {}
  onerror = (_: MediaError | null) => {}
  onretrying = (_: number, __: number) => {}
  onfailed = () => {}

  private get activePipeline(): AudioPipeline {
    if (!this.pipeline) {
      this.pipeline = createPipeline(this.context, {})
    }
    return this.pipeline
  }

  private get context(): AudioContext {
    if (!this._context) {
      this._context = new AudioContext()
    }
    return this._context
  }

  get audioElement(): HTMLAudioElement | undefined {
    return this.activePipeline.audio
  }

  currentTime() {
    return this.activePipeline.audio.currentTime
  }

  duration() {
    return this.activePipeline.audio.duration
  }

  async setBuffer(url: string) {
    this.buffer = new Audio()
    this.buffer.crossOrigin = 'anonymous'
    this.buffer.preload = 'auto'
    this.buffer.src = url
    try { this.buffer.load() } catch {}
  }

  setVolume(value: number) {
    this.activePipeline.volumeNode.gain.value = value
  }

  setReplayGainMode(value: ReplayGainMode) {
    this.replayGainMode = value
    this.activePipeline.replayGainNode.gain.value = this.replayGainFactor()

    if (value === ReplayGainMode.None) {
      this.activePipeline.normalizerNode.threshold.value = 0
      this.activePipeline.normalizerNode.knee.value = 0
      this.activePipeline.normalizerNode.ratio.value = 1
    } else {
      this.activePipeline.normalizerNode.threshold.value = -3
      this.activePipeline.normalizerNode.knee.value = 3
      this.activePipeline.normalizerNode.ratio.value = 2
      this.activePipeline.normalizerNode.attack.value = 0.01
      this.activePipeline.normalizerNode.release.value = 0.1
    }
  }

  async stop() {
    this.changeToken++
    this.cancelRetry()
    this.disposePipeline(this.activePipeline)
    this._context = null
  }

  async pause() {
    await this.fadeOut(this.fadeTime)
    this.activePipeline.audio.pause()
  }

  async play() {
    if (!this._context || this._context.state === 'closed') {
      this._context = new AudioContext()
      this.pipeline = null
    }
    if (this._context.state === 'suspended') {
      await this._context.resume()
    }
    await this.activePipeline.audio.play()
    await this.fadeIn(this.fadeTime / 2)
  }

  async seek(value: number) {
    if (!this.activePipeline.audio.paused) {
      this.fadeOut(this.fadeTime / 2)
    }
    this.activePipeline.audio.currentTime = value
    if (!this.activePipeline.audio.paused) {
      this.fadeIn(this.fadeTime / 2)
    }
  }

  retryCurrentTrack() {
    if (this.lastLoadOptions) {
      void this.loadTrack({ ...this.lastLoadOptions, fade: false })
    }
  }

  private cancelRetry() {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
  }

  private scheduleRetry() {
    if (this.retryCount >= this.maxRetries) {
      this.retryCount = 0
      this.onfailed()
      return
    }
    const delay = this.retryDelays[this.retryCount]
    this.onretrying(this.retryCount + 1, this.maxRetries)
    this.retryCount++
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      this.retryCurrentTrack()
    }, delay)
  }

  async loadTrack(options: {
    url?: string
    nextUrl?: string
    paused?: boolean
    replayGain?: ReplayGain
    fade?: boolean
  }) {
    if (!options.url) return
    const currentUrl = options.url
    const nextUrl = options.nextUrl

    const token = ++this.changeToken
    this.cancelRetry()
    this.retryCount = 0
    this.lastLoadOptions = options
    this.replayGain = options.replayGain ?? null

    if (!this.buffer || this.buffer.src !== currentUrl || this.buffer.error) {
      await this.setBuffer(currentUrl)
    }

    const nextPipeline = createPipeline(this.context, {
      audio: this.buffer!,
      volume: this.activePipeline.volumeNode.gain.value,
      replayGain: this.replayGainFactor()
    })

    if (token !== this.changeToken) {
      nextPipeline.dispose()
      return
    }

    if (options.fade) {
      await this.fadeOut(this.fadeTime)
    }

    this.replacePipeline(nextPipeline)
    this.setReplayGainMode(this.replayGainMode)

    const audio = this.activePipeline.audio

    let stalledTimer: ReturnType<typeof setTimeout> | null = null
    const clearStalledTimer = () => {
      if (stalledTimer !== null) { clearTimeout(stalledTimer); stalledTimer = null }
    }

    const playFromBufferOrRetry = () => {
      const bufferedUpTo = audio.buffered.length > 0
        ? audio.buffered.end(audio.buffered.length - 1)
        : 0
      if (bufferedUpTo > audio.currentTime + 1) {
        void audio.play().catch(() => this.scheduleRetry())
      } else {
        this.scheduleRetry()
      }
    }

    audio.onerror = () => {
      clearStalledTimer()
      playFromBufferOrRetry()
    }
    audio.onended = () => {
      clearStalledTimer()
      this.onended()
    }
    audio.onpause = () => {
      clearStalledTimer()
      this.onpause()
    }
    audio.onplay = () => this.onplay()
    audio.onstalled = () => {
      clearStalledTimer()
      stalledTimer = setTimeout(() => {
        stalledTimer = null
        if (token !== this.changeToken || audio.paused) return
        playFromBufferOrRetry()
      }, 5000)
    }
    audio.onplaying = () => {
      clearStalledTimer()
      this.retryCount = 0
    }
    audio.ontimeupdate = () => this.ontimeupdate(audio.currentTime)

    audio.addEventListener('loadedmetadata', () => {
      const d = audio.duration
      if (Number.isFinite(d) && d > 0) {
        this.ondurationchange(d)
      }
    })

    if (audio.readyState < 1) {
      try { audio.load() } catch {}
    }

    if (!options.paused) {
      try {
        await this.play()
      } catch (err: any) {
        if (err.name !== 'AbortError') throw err
      }
    }

    // Pre-buffer next track after 15s
    setTimeout(async () => {
      if (token === this.changeToken && nextUrl) {
        this.setBuffer(nextUrl)
      }
    }, Math.min(15000, (audio.duration || 30) * 0.5 * 1000))
  }

  private replacePipeline(next: AudioPipeline) {
    this.disposePipeline(this.activePipeline)
    this.pipeline = next
  }

  private disposePipeline(pipeline: AudioPipeline) {
    pipeline.audio.onended = null
    pipeline.audio.onerror = null
    pipeline.audio.onpause = null
    pipeline.audio.onplay = null
    pipeline.audio.onplaying = null
    pipeline.audio.onstalled = null
    pipeline.audio.onwaiting = null
    pipeline.audio.ontimeupdate = null
    pipeline.audio.ondurationchange = null
    setTimeout(() => pipeline.dispose(), 500)
  }

  private async fadeIn(duration = 0) {
    const gain = this.activePipeline.fadeNode.gain
    const now = this.context.currentTime
    gain.cancelScheduledValues(0)
    gain.setValueAtTime(gain.value, now)
    gain.linearRampToValueAtTime(1, now + duration)
    await new Promise(r => setTimeout(r, duration * 1000))
  }

  private async fadeOut(duration = 0) {
    const gain = this.activePipeline.fadeNode.gain
    const now = this.context.currentTime
    gain.cancelScheduledValues(0)
    gain.setValueAtTime(gain.value, now)
    gain.linearRampToValueAtTime(0, now + duration)
    await new Promise(r => setTimeout(r, duration * 1000))
  }

  private replayGainFactor(): number {
    if (this.replayGainMode === ReplayGainMode.None || !this.replayGain) {
      return 1
    }
    const gain = this.replayGainMode === ReplayGainMode.Track
      ? this.replayGain.trackGain
      : this.replayGain.albumGain
    const peak = this.replayGainMode === ReplayGainMode.Track
      ? this.replayGain.trackPeak
      : this.replayGain.albumPeak

    if (!Number.isFinite(gain) || !Number.isFinite(peak) || peak <= 0) {
      return 1
    }
    const preAmp = 6
    return Math.min(Math.pow(10, (gain + preAmp) / 20), 1 / peak)
  }
}
