# External Integrations

**Analysis Date:** 2026-06-04

## APIs & External Services

**Subsonic API (Primary Integration):**
- Protocol: Subsonic REST API v1.16.1
- Client implementation: `src/api/client.ts` (class `SubsonicAPI`, 414 lines)
- Base URL: User-configured server URL stored in `localStorage` as `server`
- Request format: All requests use query string parameters with `f=json` for JSON responses
- Client identifier: `iLeMuziQ` (set in `src/api/client.ts` line 123)
- Response parsing: All responses wrapped in `subsonic-response` envelope (`src/api/client.ts` lines 149-156)

**Authentication (Subsonic):**
- Token auth: Salt + MD5(password + salt) preferred method (`src/api/client.ts` lines 159-180)
- Plain password fallback: Used if token auth fails (`src/api/client.ts` lines 182-198)
- Session persistence: `server`, `username`, `salt`, `hash`, `password` stored in `localStorage` (`src/api/client.ts` lines 200-206)
- Auth check: `isAuthenticated()` returns `!!server && !!username` (`src/api/client.ts` line 214)

**Subsonic API Endpoints Used:**

| Endpoint | Method | Purpose | File/Line |
|----------|--------|---------|-----------|
| `ping` | GET | Login/auth verification | `src/api/client.ts` lines 166, 183 |
| `getGenres` | GET | Fetch all genres | `src/api/client.ts` line 277 |
| `getAlbumList2` | GET | Album lists by type (recent, newest, etc.) | `src/api/client.ts` lines 287, 315 |
| `getAlbum` | GET | Album details with tracks | `src/api/client.ts` line 293 |
| `getAlbumInfo2` | GET | Album metadata (description, etc.) | `src/api/client.ts` line 294 |
| `getArtists` | GET | All artists indexed | `src/api/client.ts` line 300 |
| `getArtist` | GET | Artist details with albums | `src/api/client.ts` line 308 |
| `getArtistInfo2` | GET | Artist biography | `src/api/client.ts` line 309 |
| `getRandomSongs` | GET | Random tracks for discovery | `src/api/client.ts` line 320 |
| `getStarred2` | GET | Favourited items | `src/api/client.ts` line 325 |
| `search3` | GET | Search across artists/albums/tracks | `src/api/client.ts` line 334 |
| `getPlaylists` | GET | All playlists | `src/api/client.ts` line 348 |
| `getPlaylist` | GET | Single playlist with tracks | `src/api/client.ts` line 360 |
| `stream` | GET | Audio stream (with `maxBitRate` and `format=opus`) | `src/api/client.ts` line 220 |
| `getCoverArt` | GET | Album/artist artwork (300px) | `src/api/client.ts` line 224 |
| `scrobble` | GET | Submit play count (after 50% played) | `src/api/client.ts` line 374 |
| `getPlayQueue` | GET | Restore saved play queue | `src/api/client.ts` line 378 |
| `savePlayQueue` | GET | Persist current queue state | `src/api/client.ts` line 389 |
| `star` | GET | Add to favourites | `src/api/client.ts` line 402 |
| `unstar` | GET | Remove from favourites | `src/api/client.ts` line 410 |

**Audio Streaming:**
- Stream URL format: `{server}/rest/stream?id={id}&maxBitRate={bitRate}&format=opus` (`src/api/client.ts` line 220)
- Default bitrate: 128 kbps (from `localStorage.getItem('streamQuality')`, line 219)
- Format: Opus codec requested via `format=opus` parameter
- CORS required: `crossOrigin = 'anonymous'` set on audio elements (`src/audio/engine.ts` line 117)

## Browser APIs

**Web Audio API:**
- Implementation: `src/audio/engine.ts` (class `AudioController`, 366 lines)
- `AudioContext` created lazily (`src/audio/engine.ts` lines 96-101)
- Audio pipeline: `MediaElementSource` -> `GainNode` (volume) -> `GainNode` (ReplayGain) -> `GainNode` (fade) -> `DynamicsCompressorNode` (normalizer) -> `destination` (`src/audio/engine.ts` lines 43-48)
- ReplayGain modes: None, Track, Album (`src/audio/engine.ts` lines 3-8)
- ReplayGain calculation: `10^((gain + preAmp) / 20)` clamped by `1/peak`, preAmp=6dB (`src/audio/engine.ts` lines 349-365)
- Fade in/out: `linearRampToValueAtTime` on fade gain node, default 0.3s (`src/audio/engine.ts` lines 65, 331-347)
- Normalizer: `DynamicsCompressorNode` with threshold=-3, knee=3, ratio=2 when ReplayGain active (`src/audio/engine.ts` lines 136-141)

**HTML5 Media API:**
- `HTMLAudioElement` used as source for Web Audio pipeline (`src/audio/engine.ts` lines 18, 28-29)
- Events wired: `onplay`, `onpause`, `ontimeupdate`, `onended`, `onerror`, `onstalled`, `onplaying` (`src/audio/engine.ts` lines 259-284)
- `loadedmetadata` event for duration detection (`src/audio/engine.ts` lines 286-291)

**MediaSession API:**
- Implementation: `src/stores/player.ts` lines 97-113
- Sets `MediaMetadata` with title, artist, album, and artwork (multiple sizes: 96x96, 256x256, 512x512)
- Used for OS-level media controls (lock screen, notification area)

**localStorage:**
- Auth persistence: `server`, `username`, `salt`, `hash`, `password` (`src/api/client.ts` lines 126-130, 200-206)
- Player state: `player.volume`, `player.repeat`, `player.shuffle`, `player.replayGainMode` (`src/stores/player.ts` lines 25-28)
- Stream quality: `streamQuality` (`src/api/client.ts` line 219)
- Queue persistence: `api.savePlayQueue()` called every 10 seconds while playing (`src/stores/player.ts` lines 288-292)

## Data Storage

**Client-Side Storage:**
- `localStorage` - All persistent state (auth, player prefs, stream quality)
- No IndexedDB, no sessionStorage
- No server-side database

**Remote Storage:**
- All music data lives on the user's Subsonic-compatible server
- Queue state synced to server via `savePlayQueue`/`getPlayQueue` endpoints

## Error Handling & Retry

**Audio Retry Strategy (`src/audio/engine.ts` lines 174-200):**
- Max retries: 4
- Delays: 2s, 4s, 8s, 16s (exponential backoff)
- Stalled detection: 5 second timeout on `onstalled` event (`src/audio/engine.ts` lines 272-279)
- Buffer check before retry: If buffered > currentTime + 1s, plays from buffer instead of retrying (`src/audio/engine.ts` lines 248-257)
- Pre-buffering: Next track starts loading after 15s or 50% of duration (`src/audio/engine.ts` lines 306-310)

**API Error Handling:**
- HTTP errors: Throws on non-OK response (`src/api/client.ts` line 147)
- Subsonic errors: Checks `status !== 'ok'` in response envelope (`src/api/client.ts` lines 152-154)
- Scrobble failures silently caught (`src/stores/player.ts` line 268)
- Queue save failures silently caught (`src/stores/player.ts` line 290)

## External Resources

**Google Fonts:**
- Loaded via `<link>` in `index.html` lines 8-10
- Fonts: `Playfair Display` (400, 700, 900), `Inter` (300, 400, 500, 600)
- Also loaded via `@import url()` in `src/App.vue` line 21 (duplicate)

## Compatible Servers

The Subsonic API client works with any server implementing the Subsonic REST API v1.16.1:
- Navidrome (recommended, see `README.md` lines 29-83)
- Airsonic / Airsonic-Advanced
- Subsonic (original)
- Gonic
- Ampache (with Subsonic API plugin)

---

*Integration audit: 2026-06-04*
