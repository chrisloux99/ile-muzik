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
  metadata?: string
  createdAt: string
}

export interface Stake {
  id: string
  userId: string
  amount: number
  startDate: string
  endDate: string | null
  status: string
  rewardRate: number
  txHash: string | null
}

export interface StakingStats {
  activeStakes: number
  totalStaked: number
  avgRewardRate: number
  estimatedAnnualRewards: number
}

export interface Burn {
  id: string
  userId: string
  amount: number
  reason: string | null
  txHash: string | null
  createdAt: string
}

export interface Proposal {
  id: string
  title: string
  description: string
  status: string
  votesFor: number
  votesAgainst: number
  endDate: string
  totalVoters?: number
  createdAt: string
}

export interface OrderbookEntry {
  price: string
  amount: string
}

export interface Orderbook {
  bids: OrderbookEntry[]
  asks: OrderbookEntry[]
  base: string
  counter: string
}

export interface MarketPrice {
  base: string
  quote: string
  bestBid: number
  bestAsk: number
  midPrice: number
  spread: number
}

export interface Trade {
  id: string
  price: number
  amount: string
  timestamp: string
}

export interface AssetInfo {
  code: string
  issuer: string
  found: boolean
  numAccounts?: number
  amount?: string
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
