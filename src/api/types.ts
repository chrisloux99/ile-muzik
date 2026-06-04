// Subsonic API types
export interface Track {
  id: string
  title: string
  duration: number
  favourite: boolean
  image?: string
  url?: string
  track?: number
  album?: string
  albumId?: string
  artists: { name: string; id: string }[]
  replayGain?: {
    trackGain: number
    trackPeak: number
    albumGain: number
    albumPeak: number
  }
}

export interface Album {
  id: string
  name: string
  description?: string
  artists: { name: string; id: string }[]
  year: number
  favourite: boolean
  genres: { name: string }[]
  image?: string
  tracks?: Track[]
  releaseType?: string
}

export interface Artist {
  id: string
  name: string
  description?: string
  genres: { name: string }[]
  albumCount: number
  trackCount: number
  favourite: boolean
  image?: string
  albums?: Album[]
}

export interface Genre {
  id: string
  name: string
  albumCount: number
  trackCount: number
}

export interface Playlist {
  id: string
  name: string
  comment: string
  trackCount: number
  duration: number
  image?: string
  tracks?: Track[]
}

export interface SearchResult {
  artists: Artist[]
  albums: Album[]
  tracks: Track[]
}

export interface PlayQueue {
  tracks: Track[]
  currentTrack: number
  currentTrackPosition: number
}
