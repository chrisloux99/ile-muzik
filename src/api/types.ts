export interface User {
  id: string
  email: string
  displayName: string
  role: 'USER' | 'ADMIN'
  tier: 'FREE' | 'BASIC' | 'PREMIUM'
  stellarPublicKey: string | null
  tokenBalance?: string
  streamsThisMonth: number
  subscriptionExpiry: string | null
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface TokenPackage {
  tokens: number
  priceUSD: number
  label: string
}

export interface SubscriptionStatus {
  tier: string
  subscriptionExpiry: string | null
  streamsThisMonth: number
  streamLimit: number
  activeSubscription: any | null
  availableTiers: {
    tier: string
    priceUSD: number
    streamLimit: number
    label: string
  }[]
}

export interface StreamRecord {
  streamId: string
  tokenCost: number
  streamsThisMonth: number
  streamLimit: number
}

export interface CanPlayResult {
  canPlay: boolean
  reason?: string
  streamsThisMonth: number
  streamLimit: number
  tier: string
}

export interface Transaction {
  id: string
  type: string
  amount: string
  tokenAmount: string
  currency: string
  txHash: string | null
  status: string
  createdAt: string
}

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
