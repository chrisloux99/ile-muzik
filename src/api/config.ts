// In production, set VITE_API_URL to your deployed backend URL
// e.g. https://ile-play-api.onrender.com/api
// In local dev, the Vite proxy handles /api -> localhost:3001
const API_BASE = import.meta.env.VITE_API_URL || '/api'
const NAVIDROME_URL = import.meta.env.VITE_NAVIDROME_URL || 'http://localhost:4533'

export function getApiBase(): string {
  return API_BASE
}

export function getNavidromeUrl(): string {
  return NAVIDROME_URL
}

// In production, Navidrome credentials are handled server-side via the proxy.
// These are only used for direct client-side access in development.
export function getNavidromeUser(): string {
  return import.meta.env.VITE_NAVIDROME_USER || 'ilemusiq'
}

export function getNavidromePass(): string {
  return import.meta.env.VITE_NAVIDROME_PASS || 'iledecoin'
}
