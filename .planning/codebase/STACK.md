# Technology Stack

**Analysis Date:** 2026-06-04

## Languages

**Primary:**
- TypeScript 5.4+ - All source code (`src/`)
- SCSS (Sass) 1.71+ - All component and global styles

**Secondary:**
- HTML - Entry point `index.html` and `<template>` blocks in `.vue` SFC files
- CSS (custom properties) - Theme variables defined in `:root` across files

## Runtime

**Environment:**
- Browser (ES2020 target) - Configured in `tsconfig.json` line 4: `"target": "ES2020"`
- DOM and DOM.Iterable libs included (`tsconfig.json` line 6)

**Package Manager:**
- npm (standard, no lockfile detected in repo root)
- `package.json` specifies `"type": "module"` (ESM)

## Frameworks

**Core:**
- Vue 3.4+ (`vue: ^3.4.21`) - Reactive UI framework, Composition API with `<script setup>`
- Vue Router 4.3+ (`vue-router: ^4.3.0`) - Client-side routing with `createWebHistory`
- Pinia 2.1+ (`pinia: ^2.1.7`) - State management, Composition API style stores

**UI:**
- Bootstrap 5.3+ (`bootstrap: ^5.3.3`) - CSS framework, imported globally in `src/main.ts` lines 6-7
- Bootstrap Vue Next 0.16+ (`bootstrap-vue-next: ^0.16.0`) - Vue 3 Bootstrap component library (dependency present but no direct imports found in source)

**Build/Dev:**
- Vite 5.2+ (`vite: ^5.2.0`) - Build tool and dev server
- `@vitejs/plugin-vue` 5.0+ - Vue SFC compilation plugin
- `vue-tsc` 2.0+ - Vue TypeScript type checking for production builds
- Sass 1.71+ (`sass: ^1.71.0`) - SCSS preprocessing

## Key Dependencies

**Runtime:**
- `lodash-es` 4.17+ - Utility library (imported via `@types/lodash-es` dev dep; no direct imports found in source files)
- `md5-es` 1.8+ - MD5 hashing (dependency present but the codebase implements its own MD5 in `src/api/client.ts` lines 11-106)

**Dev:**
- `@types/lodash-es` 4.17+ - TypeScript definitions for lodash-es

## Configuration

**Vite (`vite.config.ts`):**
- Vue plugin enabled
- `@` path alias maps to `./src` directory
- SCSS preprocessor configured with `silenceDeprecations` for `color-functions`, `global-builtin`, `import`

**TypeScript (`tsconfig.json`):**
- Target: ES2020, Module: ESNext, ModuleResolution: bundler
- Strict mode enabled
- `@/*` path alias maps to `./src/*`
- Includes: `src/**/*.ts`, `src/**/*.d.ts`, `src/**/*.tsx`, `src/**/*.vue`
- `noUnusedLocals` and `noUnusedParameters` both set to `false`

**TypeScript Node (`tsconfig.node.json`):**
- Composite project for Vite config only
- Includes only `vite.config.ts`

**Environment Variables:**
- `.env` files: Not detected
- No `import.meta.env` usage found in source
- All configuration (server URL, credentials) stored in `localStorage`

## Build Scripts

```json
"dev": "vite"           // Start dev server (default port 5173)
"build": "vue-tsc && vite build"  // Type-check then build for production
"preview": "vite preview"         // Preview production build locally
```

## Platform Requirements

**Development:**
- Node.js (version not pinned, no `.nvmrc` or `.node-version`)
- A Subsonic-compatible music server (Navidrome recommended) accessible via network
- Modern browser with Web Audio API and MediaSession API support

**Production:**
- Static file hosting (SPA) - Vite builds to `dist/` directory
- All API calls are client-side to a user-configured Subsonic server
- No server-side component required for the app itself

## Design System

**Fonts (loaded via Google Fonts):**
- `Playfair Display` (400, 700, 900) - Headings, logo
- `Inter` (300, 400, 500, 600) - Body text

**Color Palette (CSS custom properties in `src/App.vue` lines 23-38 and `src/assets/main.scss` lines 4-19):**
- `--zambia-green: #198A00` - Primary accent
- `--zambia-red: #DE2010` - Error/favourite highlight
- `--zambia-orange: #EF7D00` - Secondary accent
- `--vic-falls-blue: #1a6b8a` - Decorative
- `--bg-dark: #0a0a0a` - Main background
- `--bg-card: #141414` - Card backgrounds
- `--bg-surface: #1a1a1a` - Surface backgrounds
- `--text-primary: #f0f0f0` - Main text
- `--text-secondary: #a0a0a0` - Muted text

---

*Stack analysis: 2026-06-04*
