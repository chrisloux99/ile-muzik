import type { Track, Album, Artist, Genre, Playlist, SearchResult, PlayQueue } from './types'
import type { User, AuthResponse, TokenPackage, SubscriptionStatus, StreamRecord, CanPlayResult, Transaction } from './types'
import { getApiBase, getNavidromeUrl, getNavidromeUser, getNavidromePass } from './config'

function toQueryString(params: Record<string, any>): string {
  return Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}

function md5(string: string): string {
  function md5cycle(x: number[], k: number[]) {
    let a = x[0], b = x[1], c = x[2], d = x[3]
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586)
    c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330)
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426)
    c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983)
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417)
    c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162)
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101)
    c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329)
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632)
    c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302)
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083)
    c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848)
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690)
    c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501)
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784)
    c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734)
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463)
    c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556)
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353)
    c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640)
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222)
    c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189)
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835)
    c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651)
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415)
    c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055)
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606)
    c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799)
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744)
    c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649)
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379)
    c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551)
    x[0] = add32(a, x[0]); x[1] = add32(b, x[1])
    x[2] = add32(c, x[2]); x[3] = add32(d, x[3])
  }
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = add32(add32(a, q), add32(x, t))
    return add32((a << s) | (a >>> (32 - s)), b)
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t)
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t)
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t)
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | (~d)), a, b, x, s, t)
  }
  function md51(s: string) {
    const n = s.length
    let state = [1732584193, -271733879, -1732584194, 271733878]
    let i: number
    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)))
    }
    s = s.substring(i - 64)
    const tail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    for (i = 0; i < s.length; i++)
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3)
    tail[i >> 2] |= 0x80 << ((i % 4) << 3)
    if (i > 55) {
      md5cycle(state, tail)
      for (i = 0; i < 16; i++) tail[i] = 0
    }
    tail[14] = n * 8
    md5cycle(state, tail)
    return state
  }
  function md5blk(s: string) {
    const md5blks: number[] = []
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i+1) << 8) + (s.charCodeAt(i+2) << 16) + (s.charCodeAt(i+3) << 24)
    }
    return md5blks
  }
  const hex_chr = '0123456789abcdef'.split('')
  function rhex(n: number) {
    let s = ''
    for (let j = 0; j < 4; j++)
      s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F]
    return s
  }
  function hex(x: number[]) {
    return x.map(rhex).join('')
  }
  function add32(a: number, b: number) {
    return (a + b) & 0xFFFFFFFF
  }
  return hex(md51(string))
}

export class ILeAPI {
  private token: string | null = null
  private displayName: string | null = null

  constructor() {
    this.token = localStorage.getItem('ile_token')
    this.displayName = localStorage.getItem('ile_displayName')
  }

  private get authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`
    return headers
  }

  private async backendFetch(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${getApiBase()}${path}`
    const response = await fetch(url, {
      ...options,
      headers: { ...this.authHeaders, ...options.headers as Record<string, string> },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // ---- Auth ----
  async register(email: string, password: string, displayName: string): Promise<AuthResponse> {
    const result = await this.backendFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    })
    this.setSession(result.token, result.user.displayName)
    return result
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await this.backendFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    this.setSession(result.token, result.user.displayName)
    return result
  }

  private setSession(token: string, displayName: string) {
    this.token = token
    this.displayName = displayName
    localStorage.setItem('ile_token', token)
    localStorage.setItem('ile_displayName', displayName)
  }

  logout() {
    this.token = null
    this.displayName = null
    localStorage.removeItem('ile_token')
    localStorage.removeItem('ile_displayName')
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  getDisplayName(): string {
    return this.displayName || ''
  }

  async getProfile(): Promise<User & { tokenBalance: string }> {
    return this.backendFetch('/auth/profile')
  }

  // ---- Payments ----
  async getTokenPackages(): Promise<TokenPackage[]> {
    return this.backendFetch('/payments/packages')
  }

  async purchaseTokens(packageIndex: number): Promise<any> {
    return this.backendFetch('/payments/purchase', {
      method: 'POST',
      body: JSON.stringify({ packageIndex }),
    })
  }

  async sendTokens(recipientAddress: string, amount: number): Promise<any> {
    return this.backendFetch('/payments/send', {
      method: 'POST',
      body: JSON.stringify({ recipientAddress, amount }),
    })
  }

  async getPurchaseHistory(): Promise<Transaction[]> {
    return this.backendFetch('/payments/history')
  }

  // ---- Subscriptions ----
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    return this.backendFetch('/subscriptions/status')
  }

  async subscribe(tier: string): Promise<any> {
    return this.backendFetch('/subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    })
  }

  async cancelSubscription(): Promise<any> {
    return this.backendFetch('/subscriptions/cancel', { method: 'POST' })
  }

  // ---- Streams ----
  async recordStream(trackId: string, trackName?: string, artistName?: string): Promise<StreamRecord> {
    return this.backendFetch('/streams/record', {
      method: 'POST',
      body: JSON.stringify({ trackId, trackName, artistName }),
    })
  }

  async canPlay(): Promise<CanPlayResult> {
    return this.backendFetch('/streams/can-play')
  }

  async getStreamStats(): Promise<any> {
    return this.backendFetch('/streams/stats')
  }

  // ---- Subsonic (music data) ----
  private get subsonicParams(): string {
    return toQueryString({
      u: getNavidromeUser(),
      p: getNavidromePass(),
      v: '1.16.1',
      f: 'json',
      c: 'iLe-Play',
    })
  }

  private async subsonicFetch(path: string, params: Record<string, any> = {}): Promise<any> {
    const url = `${getNavidromeUrl()}/rest/${path}?${toQueryString(params)}&${this.subsonicParams}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Subsonic request failed: ${response.status}`)
    const json = await response.json()
    const res = json['subsonic-response']
    if (res.status !== 'ok') throw new Error(res.error?.message || 'Unknown error')
    return res
  }

  getStreamUrl(id: string): string {
    return `${getNavidromeUrl()}/rest/stream?id=${id}&v=1.16.1&${this.subsonicParams}`
  }

  getCoverArtUrl(id: string): string {
    return `${getNavidromeUrl()}/rest/getCoverArt?id=${id}&v=1.16.1&${this.subsonicParams}&size=300`
  }

  private normalizeTrack(item: any): Track {
    return {
      id: item.id,
      title: item.title,
      duration: item.duration,
      favourite: !!item.starred,
      track: item.track,
      album: item.album,
      albumId: item.albumId,
      artists: item.artists?.length
        ? item.artists
        : [{ id: item.artistId, name: item.artist }],
      url: this.getStreamUrl(item.id),
      image: item.albumId ? this.getCoverArtUrl(item.albumId) : undefined,
      replayGain: item.replayGain || undefined
    }
  }

  private normalizeAlbum(item: any): Album {
    return {
      id: item.id,
      name: item.name,
      description: (item.notes || '').replace(/<a[^>]*>.*?<\/a>/gm, ''),
      artists: item.artists?.length
        ? item.artists
        : [{ id: item.artistId, name: item.artist }],
      image: this.getCoverArtUrl(item.coverArt || item.id),
      year: item.year || 0,
      favourite: !!item.starred,
      genres: item.genres || (item.genre ? [{ name: item.genre }] : []),
      tracks: (item.song || []).map((s: any) => this.normalizeTrack(s)),
      releaseType: item.releaseTypes?.[0] || 'ALBUM'
    }
  }

  private normalizeArtist(item: any): Artist {
    return {
      id: item.id,
      name: item.name,
      description: (item.biography || '').replace(/<a[^>]*>.*?<\/a>/gm, ''),
      genres: item.genres || [],
      albumCount: item.albumCount || 0,
      trackCount: 0,
      favourite: !!item.starred,
      image: item.artistImageUrl || (item.coverArt ? this.getCoverArtUrl(item.coverArt) : undefined),
      albums: (item.album || []).map((a: any) => this.normalizeAlbum(a))
    }
  }

  async getGenres(): Promise<Genre[]> {
    const res = await this.subsonicFetch('getGenres')
    return (res.genres?.genre || []).map((item: any) => ({
      id: item.value,
      name: item.value,
      albumCount: item.albumCount ?? 0,
      trackCount: item.songCount ?? 0
    }))
  }

  async getAlbums(type: string, size = 20, offset = 0): Promise<Album[]> {
    const res = await this.subsonicFetch('getAlbumList2', { type, size, offset })
    return (res.albumList2?.album || []).map((a: any) => this.normalizeAlbum(a))
  }

  async getAlbumDetails(id: string): Promise<Album> {
    const [album, info] = await Promise.all([
      this.subsonicFetch('getAlbum', { id }),
      this.subsonicFetch('getAlbumInfo2', { id })
    ])
    return this.normalizeAlbum({ ...album.album, ...info.albumInfo })
  }

  async getArtists(): Promise<Artist[]> {
    const res = await this.subsonicFetch('getArtists')
    return (res.artists?.index || [])
      .flatMap((index: any) => index.artist)
      .map((a: any) => this.normalizeArtist(a))
  }

  async getArtistDetails(id: string): Promise<Artist> {
    const [artist, info] = await Promise.all([
      this.subsonicFetch('getArtist', { id }),
      this.subsonicFetch('getArtistInfo2', { id })
    ])
    return this.normalizeArtist({ ...info.artistInfo2, ...artist.artist })
  }

  async getAlbumsByGenre(genre: string, size = 20, offset = 0): Promise<Album[]> {
    const res = await this.subsonicFetch('getAlbumList2', { type: 'byGenre', genre, size, offset })
    return (res.albumList2?.album || []).map((a: any) => this.normalizeAlbum(a))
  }

  async getRandomTracks(params: { size?: number; genre?: string } = {}): Promise<Track[]> {
    const res = await this.subsonicFetch('getRandomSongs', { size: params.size || 100, genre: params.genre })
    return (res.randomSongs?.song || []).map((s: any) => this.normalizeTrack(s))
  }

  async getFavourites(): Promise<{ albums: Album[]; artists: Artist[]; tracks: Track[] }> {
    const res = await this.subsonicFetch('getStarred2')
    return {
      albums: (res.starred2?.album || []).map((a: any) => this.normalizeAlbum(a)),
      artists: (res.starred2?.artist || []).map((a: any) => this.normalizeArtist(a)),
      tracks: (res.starred2?.song || []).map((s: any) => this.normalizeTrack(s))
    }
  }

  async search(query: string): Promise<SearchResult> {
    const res = await this.subsonicFetch('search3', {
      query,
      albumCount: 20,
      artistCount: 20,
      songCount: 20
    })
    return {
      albums: (res.searchResult3?.album || []).map((a: any) => this.normalizeAlbum(a)),
      artists: (res.searchResult3?.artist || []).map((a: any) => this.normalizeArtist(a)),
      tracks: (res.searchResult3?.song || []).map((s: any) => this.normalizeTrack(s))
    }
  }

  async getPlaylists(): Promise<Playlist[]> {
    const res = await this.subsonicFetch('getPlaylists')
    return (res.playlists?.playlist || []).map((p: any) => ({
      id: p.id,
      name: p.name || '(Unnamed)',
      comment: p.comment || '',
      trackCount: p.songCount,
      duration: p.duration,
      image: p.songCount > 0 ? this.getCoverArtUrl(p.coverArt || p.id) : undefined
    }))
  }

  async getPlaylist(id: string): Promise<Playlist> {
    const res = await this.subsonicFetch('getPlaylist', { id })
    const p = res.playlist
    return {
      id: p.id,
      name: p.name || '(Unnamed)',
      comment: p.comment || '',
      trackCount: p.songCount,
      duration: p.duration,
      image: p.songCount > 0 ? this.getCoverArtUrl(p.coverArt || p.id) : undefined,
      tracks: (p.entry || []).map((s: any) => this.normalizeTrack(s))
    }
  }

  async scrobble(id: string): Promise<void> {
    await this.subsonicFetch('scrobble', { id, submission: true })
  }

  async getPlayQueue(): Promise<PlayQueue> {
    const res = await this.subsonicFetch('getPlayQueue')
    const tracks = (res.playQueue?.entry || []).map((s: any) => this.normalizeTrack(s))
    const currentId = res.playQueue?.current?.toString()
    const index = tracks.findIndex((t: Track) => t.id === currentId)
    return {
      tracks,
      currentTrack: index >= 0 ? index : 0,
      currentTrackPosition: (res.playQueue?.position || 0) / 1000
    }
  }

  async savePlayQueue(tracks: Track[], currentTrack: Track | null, currentTime: number): Promise<void> {
    await this.subsonicFetch('savePlayQueue', {
      id: tracks.map(t => t.id),
      current: currentTrack?.id,
      position: Math.round(currentTime * 1000)
    })
  }

  async addFavourite(id: string, type: 'track' | 'album' | 'artist'): Promise<void> {
    const params: Record<string, string> = {}
    if (type === 'track') params.id = id
    if (type === 'album') params.albumId = id
    if (type === 'artist') params.artistId = id
    await this.subsonicFetch('star', params)
  }

  async removeFavourite(id: string, type: 'track' | 'album' | 'artist'): Promise<void> {
    const params: Record<string, string> = {}
    if (type === 'track') params.id = id
    if (type === 'album') params.albumId = id
    if (type === 'artist') params.artistId = id
    await this.subsonicFetch('unstar', params)
  }
}

export const api = new ILeAPI()
