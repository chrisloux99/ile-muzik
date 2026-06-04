# Architecture

**Analysis Date:** 2026-06-04

## Pattern Overview

**Overall:** Single-Page Application (SPA) with layered architecture

**Key Characteristics:**
- Vue 3 Composition API with `<script setup>` syntax throughout
- Pinia stores as the single source of truth for application and player state
- Singleton API client (`src/api/client.ts` line 414: `export const api = new SubsonicAPI()`)
- Singleton AudioController instantiated in player store (`src/stores/player.ts` line 8: `const audio = new AudioController()`)
- All external communication is client-to-server (no backend for the app itself)
- Web Audio API pipeline for audio processing, separate from UI rendering

## Layers

**View Layer:**
- Purpose: Page-level components rendered by the router
- Location: `src/views/`
- Contains: `Home.vue`, `Library.vue`, `Search.vue`, `Queue.vue`, `Login.vue`
- Depends on: Pinia stores (`useAppStore`, `usePlayerStore`), API client (`api`)
- Used by: Vue Router (`src/router/index.ts`)

**Component Layer:**
- Purpose: Reusable UI components shared across views
- Location: `src/components/`
- Contains: `PlayerBar.vue`, `Sidebar.vue`, `Logo3D.vue`
- Depends on: Pinia stores, Vue Router
- Used by: Views and `App.vue`

**Store Layer:**
- Purpose: Centralized reactive state management
- Location: `src/stores/`
- Contains: `app.ts` (auth/UI state), `player.ts` (playback/queue state)
- Depends on: API client, AudioController
- Used by: Views and components via `useAppStore()` / `usePlayerStore()`

**API Layer:**
- Purpose: Subsonic API communication and data normalization
- Location: `src/api/`
- Contains: `client.ts` (SubsonicAPI class), `types.ts` (TypeScript interfaces)
- Depends on: Browser `fetch` API, `localStorage`
- Used by: Stores and views (direct API calls in some views)

**Audio Layer:**
- Purpose: Audio playback engine with Web Audio API processing
- Location: `src/audio/engine.ts`
- Contains: `AudioController` class, `AudioPipeline` type, `ReplayGainMode` enum
- Depends on: Web Audio API (`AudioContext`, `GainNode`, `DynamicsCompressorNode`), `HTMLAudioElement`
- Used by: Player store only (`src/stores/player.ts`)

## Data Flow

**Playback Flow:**

1. User clicks play on a track/album in a View (`Home.vue`, `Library.vue`, `Search.vue`)
2. View calls `player.playNow(tracks)` or `player.shuffleNow(tracks)` on the player store
3. Player store sets queue, updates queue index, calls `audio.loadTrack()` with stream URL
4. `AudioController.loadTrack()` creates a new `AudioPipeline` (Web Audio graph), connects nodes
5. `HTMLAudioElement.src` set to Subsonic stream URL (`/rest/stream?id=...`)
6. Audio plays through the Web Audio pipeline: source -> volume -> ReplayGain -> fade -> normalizer -> destination
7. `ontimeupdate` callback fires, updating `currentTime` in the store
8. Vue reactivity updates `PlayerBar.vue` progress display
9. After 50% playback, `api.scrobble()` is called (`src/stores/player.ts` lines 266-269)
10. On track end, `next()` advances queue or `processQueueEnd()` fetches random tracks for radio mode

**Queue Persistence Flow:**

1. Every 10 seconds while playing, `api.savePlayQueue()` is called (`src/stores/player.ts` lines 288-292)
2. Sends current queue track IDs, current track ID, and position in milliseconds
3. On next login, `api.getPlayQueue()` can restore the queue (endpoint exists but not wired to auto-restore)

**State Management:**

- `useAppStore` (`src/stores/app.ts`): Authentication state, loading/error flags, sidebar toggle
- `usePlayerStore` (`src/stores/player.ts`): Queue, playback state, volume, shuffle/repeat, ReplayGain mode
- Player preferences persisted to `localStorage` on change (volume, repeat, shuffle, ReplayGain mode)
- Auth state persisted to `localStorage` via `SubsonicAPI.saveSession()`

## Key Abstractions

**SubsonicAPI (`src/api/client.ts`):**
- Purpose: Single point of contact for all Subsonic server communication
- Pattern: Singleton instance exported as `api` (line 414)
- Responsibilities: Authentication, data fetching, data normalization (raw API responses -> typed interfaces), URL generation for streams and artwork
- Normalizers: `normalizeTrack()` (line 227), `normalizeAlbum()` (line 245), `normalizeArtist()` (line 262)

**AudioController (`src/audio/engine.ts`):**
- Purpose: Manages audio playback with Web Audio API processing
- Pattern: Single instance created in player store (line 8 of `src/stores/player.ts`)
- Responsibilities: Track loading, play/pause/seek, volume control, ReplayGain processing, gapless transitions (fade in/out), retry on error, pre-buffering next track
- Callbacks: `onplay`, `onpause`, `ontimeupdate`, `ondurationchange`, `onended`, `onerror`, `onretrying`, `onfailed`

**AudioPipeline (`src/audio/engine.ts` lines 17-24):**
- Purpose: Encapsulates one audio source with its Web Audio node chain
- Pattern: Created per track load, disposed on replacement
- Chain: `HTMLAudioElement` -> `GainNode` (volume) -> `GainNode` (ReplayGain) -> `GainNode` (fade) -> `DynamicsCompressorNode` (normalizer) -> `AudioContext.destination`

## Entry Points

**Application Entry:**
- Location: `src/main.ts`
- Triggers: Browser loads `index.html` which includes `<script type="module" src="/src/main.ts">`
- Responsibilities: Creates Vue app, installs Pinia and Router, mounts to `#app`

**Router Entry:**
- Location: `src/router/index.ts`
- Triggers: URL changes, `router.push()` calls
- Responsibilities: Route matching, lazy-loading views, auth guard (`beforeEach` at line 40)

**Route Guard:**
- Location: `src/router/index.ts` lines 40-50
- Logic: If route requires auth and user not authenticated -> redirect to `/login`. If user is authenticated and visits `/login` -> redirect to `/`.

## Component Hierarchy

```
App.vue (root)
├── Sidebar.vue (if logged in)
│   └── Logo3D.vue
├── <RouterView> (dynamic)
│   ├── Login.vue
│   │   └── Logo3D.vue
│   ├── Home.vue
│   │   └── Logo3D.vue
│   ├── Library.vue
│   ├── Search.vue
│   └── Queue.vue
└── PlayerBar.vue (if logged in, fixed bottom)
```

## Error Handling

**Strategy:** Try/catch at API call sites, silent catch for non-critical operations

**Patterns:**
- API calls in views: try/catch with `console.error` and user-facing loading states (`src/views/Home.vue` lines 29-32)
- Scrobble: Silent catch (`src/stores/player.ts` line 268: `.catch(() => {})`)
- Queue save: Silent catch (`src/stores/player.ts` line 290: `.catch(() => {})`)
- Audio errors: Retry with exponential backoff, then skip to next/previous track (`src/audio/engine.ts` lines 259-262, `src/stores/player.ts` lines 281-285)
- Login errors: Displayed to user in Login.vue (`src/views/Login.vue` lines 26-28)

## Cross-Cutting Concerns

**Logging:** `console.error` for API failures, `console.warn` for audio errors. No structured logging framework.

**Validation:** Input validation limited to login form (required fields check in `src/views/Login.vue` lines 17-19). No schema validation on API responses.

**Authentication:** Token-based (Subsonic salt+hash) with plain password fallback. All credentials stored in `localStorage`. No token refresh mechanism - credentials are long-lived.

**Responsive Design:** Mobile breakpoint at 768px. Sidebar collapses to overlay on mobile (`src/components/Sidebar.vue` lines 162-164, 200-206). PlayerBar hides time display and volume on mobile (`src/components/PlayerBar.vue` lines 415-431).

---

*Architecture analysis: 2026-06-04*
