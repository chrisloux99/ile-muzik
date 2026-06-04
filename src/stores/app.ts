import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api/client'

export const useAppStore = defineStore('app', () => {
  const isLoggedIn = ref(api.isAuthenticated())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const sidebarOpen = ref(false)

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      await api.login(email, password)
      isLoggedIn.value = true
    } catch (err: any) {
      error.value = err.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  function logout() {
    api.logout()
    isLoggedIn.value = false
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

  return {
    isLoggedIn, loading, error, sidebarOpen,
    login, logout, setLoading, setError, toggleSidebar
  }
})
