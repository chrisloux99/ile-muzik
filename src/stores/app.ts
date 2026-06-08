import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api/client'
import type { User } from '@/api/types'

export const useAppStore = defineStore('app', () => {
  const isLoggedIn = ref(api.isAuthenticated())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const sidebarOpen = ref(false)
  const navOpen = ref(false)
  const user = ref<User | null>(null)
  const tokenBalance = ref(0)

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const result = await api.login(email, password)
      user.value = result.user
      tokenBalance.value = parseFloat(result.user.tokenBalance || '0')
      isLoggedIn.value = true
    } catch (err: any) {
      error.value = err.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, displayName: string) {
    loading.value = true
    error.value = null
    try {
      const result = await api.register(email, password, displayName)
      user.value = result.user
      tokenBalance.value = parseFloat(result.user.tokenBalance || '0')
      isLoggedIn.value = true
    } catch (err: any) {
      error.value = err.message || 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function refreshProfile() {
    try {
      const profile = await api.getProfile()
      user.value = profile
      tokenBalance.value = parseFloat(profile.tokenBalance || '0')
    } catch {}
  }

  function logout() {
    api.logout()
    isLoggedIn.value = false
    user.value = null
    tokenBalance.value = 0
  }

  function setLoading(v: boolean) {
    loading.value = v
  }

  function setError(msg: string | null) {
    error.value = msg
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function getDisplayName() {
    return user.value?.displayName || localStorage.getItem('ile_displayName') || ''
  }

  return {
    isLoggedIn, loading, error, sidebarOpen, navOpen, user, tokenBalance,
    login, register, logout, setLoading, setError, toggleSidebar, refreshProfile,
    getDisplayName
  }
})
