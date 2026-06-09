// In production, set VITE_API_URL to your deployed backend URL
// e.g. https://ile-play-api.onrender.com/api
// In local dev, the Vite proxy handles /api -> localhost:3001
const API_BASE = import.meta.env.VITE_API_URL || '/api'
const NAVIDROME_URL = import.meta.env.VITE_NAVIDROME_URL || 'http://localhost:4533'
const NAVIDROME_USER = import.meta.env.VITE_NAVIDROME_USER || 'ilemusiq'
const NAVIDROME_PASS = import.meta.env.VITE_NAVIDROME_PASS || 'iledecoin'

export function getApiBase(): string {
  return API_BASE
}

export function getNavidromeUrl(): string {
  return NAVIDROME_URL
}

export function getNavidromeUser(): string {
  return NAVIDROME_USER
}

export function getNavidromePass(): string {
  return NAVIDROME_PASS
}
