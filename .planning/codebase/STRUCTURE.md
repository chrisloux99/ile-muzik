# Codebase Structure

**Analysis Date:** 2026-06-04

## Directory Layout

```
ILEMUZIQ/
├── .planning/              # GSD planning documents (generated)
│   └── codebase/           # Codebase analysis docs
├── public/                 # Static assets served as-is
│   └── favicon.svg         # App favicon
├── src/                    # Application source code
│   ├── api/                # Subsonic API client layer
│   │   ├── client.ts       # SubsonicAPI class (414 lines)
│   │   └── types.ts        # TypeScript interfaces (73 lines)
│   ├── assets/             # Global styles
│   │   └── main.scss       # Global SCSS with CSS variables (109 lines)
│   ├── audio/              # Audio engine layer
│   │   └── engine.ts       # AudioController class (366 lines)
│   ├── components/         # Reusable Vue components
│   │   ├── Logo3D.vue      # 3D animated logo (114 lines)
│   │   ├── PlayerBar.vue   # Fixed bottom player bar (432 lines)
│   │   └── Sidebar.vue     # Navigation sidebar (307 lines)
│   ├── router/             # Vue Router configuration
│   │   └── index.ts        # Route definitions + auth guard (52 lines)
│   ├── stores/             # Pinia state stores
│   │   ├── app.ts          # App-level state (47 lines)
│   │   └── player.ts       # Player/queue state (306 lines)
│   ├── views/              # Page-level components (routes)
│   │   ├── Home.vue        # Discover/home page (498 lines)
│   │   ├── Library.vue     # Albums & artists browser (414 lines)
│   │   ├── Login.vue       # Login page (518 lines)
│   │   ├── Queue.vue       # Play queue view (325 lines)
│   │   └── Search.vue      # Search page (574 lines)
│   ├── App.vue             # Root component (97 lines)
│   ├── env.d.ts            # Vite/Vue type declarations (7 lines)
│   └── main.ts             # Application entry point (16 lines)
├── index.html              # HTML entry point (16 lines)
├── package.json            # Dependencies and scripts (28 lines)
├── tsconfig.json           # TypeScript config for app (24 lines)
├── tsconfig.node.json      # TypeScript config for Vite (10 lines)
├── vite.config.ts          # Vite build config (19 lines)
└── README.md               # Project documentation (171 lines)
```

## Directory Purposes

**`src/api/`:**
- Purpose: All communication with the Subsonic music server
- Contains: API client class, TypeScript type definitions
- Key files: `client.ts` (SubsonicAPI singleton with auth, fetching, normalization), `types.ts` (Track, Album, Artist, Genre, Playlist, SearchResult, PlayQueue interfaces)

**`src/audio/`:**
- Purpose: Audio playback engine using Web Audio API
- Contains: AudioController class with ReplayGain, gapless playback, retry logic
- Key files: `engine.ts` (AudioPipeline creation, fade in/out, pre-buffering)

**`src/components/`:**
- Purpose: Reusable UI components used across multiple views
- Contains: Layout components (Sidebar, PlayerBar) and display components (Logo3D)
- Key files: `PlayerBar.vue` (playback controls, progress, volume), `Sidebar.vue` (navigation, logout), `Logo3D.vue` (animated branding)

**`src/router/`:**
- Purpose: Client-side routing configuration
- Contains: Route definitions, auth navigation guard
- Key files: `index.ts` (5 routes: /login, /, /library, /search, /queue)

**`src/stores/`:**
- Purpose: Centralized reactive state management with Pinia
- Contains: Application state store and player/queue state store
- Key files: `app.ts` (auth, loading, error, sidebar), `player.ts` (queue, playback, volume, shuffle, repeat, ReplayGain, scrobbling, MediaSession)

**`src/views/`:**
- Purpose: Page-level components mapped to routes
- Contains: Full pages with their own data loading, templates, and scoped styles
- Key files: Each view is self-contained with `<script setup>`, `<template>`, and `<style lang="scss" scoped>`

**`src/assets/`:**
- Purpose: Global styles and static assets processed by Vite
- Contains: `main.scss` with CSS variables, reset styles, scrollbar customization, animation keyframes, Zambian pattern mixin

**`public/`:**
- Purpose: Static files served directly without processing
- Contains: `favicon.svg`
- Note: Files here are copied to `dist/` as-is during build

## Key File Locations

**Entry Points:**
- `index.html`: HTML shell, loads Google Fonts, mounts Vue app at `#app`
- `src/main.ts`: Vue app creation, Pinia + Router installation, Bootstrap CSS/JS import

**Configuration:**
- `package.json`: Dependencies, build scripts
- `vite.config.ts`: Vue plugin, `@` alias, SCSS options
- `tsconfig.json`: TypeScript strict mode, path aliases, include patterns
- `tsconfig.node.json`: Separate config for Vite config file itself

**Core Logic:**
- `src/api/client.ts`: All Subsonic API methods (login, fetch albums/artists/tracks, search, scrobble, queue sync)
- `src/audio/engine.ts`: Audio playback pipeline (Web Audio graph, ReplayGain, fade, retry)
- `src/stores/player.ts`: Queue management, playback orchestration, audio callback wiring, queue persistence

**Styling:**
- `src/assets/main.scss`: Global CSS variables, resets, scrollbar, selection, focus, pattern mixin, animations
- `src/App.vue` `<style>`: App layout, global keyframes (mistFlow, drumPulse, waterfallShimmer, logoFloat, logoGlow)
- Each `.vue` file: Scoped SCSS for component-specific styles

## Naming Conventions

**Files:**
- Vue components: PascalCase (`PlayerBar.vue`, `Logo3D.vue`, `Sidebar.vue`)
- TypeScript files: camelCase (`client.ts`, `engine.ts`, `types.ts`)
- SCSS files: camelCase (`main.scss`)
- Config files: lowercase with dots (`vite.config.ts`, `tsconfig.json`)

**Directories:**
- Lowercase, singular nouns (`api/`, `audio/`, `router/`, `stores/`, `views/`, `components/`, `assets/`)

**Code:**
- Vue stores: camelCase with `use` prefix (`useAppStore`, `usePlayerStore`)
- Classes: PascalCase (`SubsonicAPI`, `AudioController`)
- Interfaces: PascalCase (`Track`, `Album`, `Artist`, `Genre`, `Playlist`)
- Enums: PascalCase (`ReplayGainMode`)
- Functions/methods: camelCase (`playNow`, `shuffleNow`, `loadTrack`, `normalizeTrack`)
- Reactive refs: camelCase (`isLoggedIn`, `sidebarOpen`, `queueIndex`, `isPlaying`)
- CSS variables: kebab-case with namespace prefix (`--zambia-green`, `--bg-dark`, `--text-primary`)
- CSS classes: kebab-case (`player-bar`, `album-card`, `track-info`, `queue-item`)

## Where to Add New Code

**New View/Page:**
- Create: `src/views/{PageName}.vue`
- Register: Add route in `src/router/index.ts` with lazy import: `component: () => import('@/views/{PageName}.vue')`
- Add nav item: Update `navItems` array in `src/components/Sidebar.vue` (line 10-15)

**New Component:**
- Create: `src/components/{ComponentName}.vue`
- Use `<script setup lang="ts">`, `<template>`, `<style lang="scss" scoped>`
- Import in views or other components as needed

**New API Method:**
- Add method to `SubsonicAPI` class in `src/api/client.ts`
- Use `this.fetch(endpoint, params)` for Subsonic REST calls
- Add return type interface to `src/api/types.ts` if needed
- Normalize raw API response using private `normalize*` methods

**New State Property:**
- App-level state: Add to `src/stores/app.ts` (use `ref()` for reactive state)
- Player-level state: Add to `src/stores/player.ts`
- If persisted: Add `localStorage.setItem()` in setter, `localStorage.getItem()` in initializer

**New Audio Feature:**
- Modify `AudioController` in `src/audio/engine.ts`
- Add new `AudioNode` to the pipeline in `createPipeline()` if needed
- Wire callbacks in `src/stores/player.ts` where `audio.on*` handlers are set (lines 244-285)

**Utilities/Helpers:**
- Currently no dedicated utils directory
- Add shared helpers as new files in `src/` (e.g., `src/utils/format.ts`)
- Or inline in the relevant module (e.g., `shuffle()` is defined locally in `src/stores/player.ts` lines 10-17)

## Special Directories

**`.planning/`:**
- Purpose: GSD planning and codebase analysis documents
- Generated: Yes (by GSD tools)
- Committed: Should be committed for team reference

**`public/`:**
- Purpose: Static assets served without Vite processing
- Generated: No (manually maintained)
- Committed: Yes

**`node_modules/` (not present):**
- Purpose: Installed npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (should be gitignored)

**`dist/` (not present):**
- Purpose: Production build output
- Generated: Yes (by `npm run build`)
- Committed: No (should be gitignored)

---

*Structure analysis: 2026-06-04*
