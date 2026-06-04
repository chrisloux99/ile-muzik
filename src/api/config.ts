const DEFAULT_SERVER = 'http://localhost:4533'
const ADMIN_USER = 'ilemusiq'
const ADMIN_PASS = 'iledecoin'

export function getServerUrl(): string {
  return DEFAULT_SERVER
}

export function getAdminUser(): string {
  return ADMIN_USER
}

export function getAdminPass(): string {
  return ADMIN_PASS
}

export function isServerConfigured(): boolean {
  return true
}
