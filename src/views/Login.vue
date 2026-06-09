<template>
  <div class="auth">
    <div class="auth__glow auth__glow--1"></div>
    <div class="auth__glow auth__glow--2"></div>

    <div class="auth__wrapper">
      <div class="auth__brand">
        <div class="auth__logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" stroke="url(#grad)" stroke-width="2.5" opacity="0.8"/>
            <circle cx="24" cy="24" r="14" stroke="url(#grad)" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.4"/>
            <circle cx="24" cy="24" r="6" fill="url(#grad)"/>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="48" y2="48">
                <stop stop-color="#7850ff"/>
                <stop offset="1" stop-color="#00e5ff"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="auth__title">
          <span class="gradient-text">iLe</span>-Play
        </h1>
      </div>

      <div class="auth__card">
        <div class="auth__tabs">
          <button
            class="auth__tab"
            :class="{ 'auth__tab--active': mode === 'login' }"
            @click="mode = 'login'"
          >
            Sign In
          </button>
          <button
            class="auth__tab"
            :class="{ 'auth__tab--active': mode === 'register' }"
            @click="mode = 'register'"
          >
            Sign Up
          </button>
        </div>

        <form class="auth__form" @submit.prevent="handleSubmit" novalidate>
          <div v-if="mode === 'register'" class="auth__field">
            <label class="auth__label">Name</label>
            <input
              v-model="displayName"
              type="text"
              placeholder="Your name"
              class="auth__input"
              :disabled="loading"
              autocomplete="name"
            />
          </div>

          <div class="auth__field">
            <label class="auth__label">Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              class="auth__input"
              :disabled="loading"
              autocomplete="email"
            />
          </div>

          <div class="auth__field">
            <label class="auth__label">Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="Min. 6 characters"
              class="auth__input"
              :disabled="loading"
              autocomplete="current-password"
            />
          </div>

          <p v-if="error" class="auth__error">{{ error }}</p>

          <button type="submit" class="auth__submit" :disabled="loading">
            <span v-if="loading" class="auth__spinner"></span>
            <span v-else>{{ mode === 'login' ? 'Sign In' : 'Create Account' }}</span>
          </button>
        </form>

        <p class="auth__footer">
          {{ mode === 'login' ? "Don't have an account?" : 'Already have an account?' }}
          <button class="auth__link" @click="mode = mode === 'login' ? 'register' : 'login'">
            {{ mode === 'login' ? 'Sign Up' : 'Sign In' }}
          </button>
        </p>
      </div>

      <div class="auth__features">
        <span class="auth__feature">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Blockchain secured
        </span>
        <span class="auth__feature">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          Instant streaming
        </span>
        <span class="auth__feature">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Micropayments
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const displayName = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''

  if (!email.value.trim()) {
    error.value = 'Email is required'
    return
  }
  if (!password.value) {
    error.value = 'Password is required'
    return
  }
  if (mode.value === 'register' && !displayName.value.trim()) {
    error.value = 'Name is required'
    return
  }
  if (mode.value === 'register' && password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  loading.value = true

  try {
    if (mode.value === 'login') {
      await appStore.login(email.value.trim(), password.value)
    } else {
      await appStore.register(email.value.trim(), password.value, displayName.value.trim())
    }
    router.push('/')
  } catch (e: any) {
    error.value = e.message || 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.auth {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  padding: 20px;
  overflow: hidden;

  &__glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;

    &--1 {
      width: 500px;
      height: 500px;
      top: -200px;
      right: -100px;
      background: rgba(120, 80, 255, 0.08);
    }

    &--2 {
      width: 400px;
      height: 400px;
      bottom: -150px;
      left: -100px;
      background: rgba(0, 229, 255, 0.06);
    }
  }

  &__wrapper {
    width: 100%;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    gap: 32px;
    animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &__brand {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  &__logo {
    animation: breathe 3s ease-in-out infinite;
  }

  &__title {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  &__card {
    background: rgba(20, 20, 46, 0.6);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    padding: 28px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 20px;
      right: 20px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(120, 80, 255, 0.3), transparent);
    }
  }

  &__tabs {
    display: flex;
    gap: 4px;
    padding: 4px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    margin-bottom: 24px;
  }

  &__tab {
    flex: 1;
    padding: 10px;
    background: transparent;
    border: none;
    border-radius: 10px;
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &--active {
      background: rgba(120, 80, 255, 0.15);
      color: var(--violet-bright);
    }

    &:hover:not(&--active) {
      color: var(--text-secondary);
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__label {
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--text-secondary);
    letter-spacing: 0.03em;
  }

  &__input {
    width: 100%;
    padding: 12px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: var(--text-primary);
    font-size: 0.9rem;
    font-family: inherit;
    outline: none;
    transition: all 0.2s ease;

    &::placeholder {
      color: var(--text-muted);
    }

    &:focus {
      border-color: rgba(120, 80, 255, 0.4);
      background: rgba(255, 255, 255, 0.06);
      box-shadow: 0 0 0 3px rgba(120, 80, 255, 0.08);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__error {
    font-size: 0.82rem;
    color: var(--magenta);
    text-align: center;
    padding: 10px;
    background: rgba(255, 64, 129, 0.08);
    border-radius: 10px;
    animation: fadeIn 0.2s ease;
  }

  &__submit {
    width: 100%;
    padding: 13px;
    background: linear-gradient(135deg, var(--violet), var(--violet-dim));
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 0.95rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(120, 80, 255, 0.3);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  &__footer {
    text-align: center;
    font-size: 0.82rem;
    color: var(--text-muted);
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  &__link {
    background: none;
    border: none;
    color: var(--violet-bright);
    font-size: 0.82rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    padding: 0;
    margin-left: 4px;

    &:hover {
      color: var(--cyan);
    }
  }

  &__features {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  &__feature {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    color: var(--text-muted);
    letter-spacing: 0.02em;

    svg {
      color: var(--violet-bright);
      opacity: 0.6;
    }
  }
}
</style>
