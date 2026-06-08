<template>
  <div class="login">
    <div class="login__orb-bg">
      <div class="login__orb login__orb--1"></div>
      <div class="login__orb login__orb--2"></div>
      <div class="login__orb login__orb--3"></div>
    </div>

    <div class="login__container">
      <div class="login__brand">
        <div class="login__logo">
          <div class="login__logo-ring"></div>
          <div class="login__logo-core">
            <span class="login__logo-letter">i</span>
          </div>
        </div>
        <h1 class="login__title">
          <span class="gradient-text">iLe</span><span class="login__dash">-</span><span>Play</span>
        </h1>
        <p class="login__tagline">Music meets blockchain</p>
      </div>

      <div class="login__card glass">
        <div class="login__tabs">
          <button
            class="login__tab"
            :class="{ 'login__tab--active': mode === 'login' }"
            @click="mode = 'login'"
          >Sign In</button>
          <button
            class="login__tab"
            :class="{ 'login__tab--active': mode === 'register' }"
            @click="mode = 'register'"
          >Create Account</button>
        </div>

        <form class="login__form" @submit.prevent="handleSubmit">
          <div v-if="mode === 'register'" class="login__field">
            <label class="login__label">Display Name</label>
            <input
              v-model="displayName"
              type="text"
              placeholder="Your display name"
              :disabled="loading"
              class="login__input"
            />
          </div>

          <div class="login__field">
            <label class="login__label">Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              :disabled="loading"
              autocomplete="email"
              class="login__input"
            />
          </div>

          <div class="login__field">
            <label class="login__label">Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="Your password"
              :disabled="loading"
              autocomplete="current-password"
              class="login__input"
            />
          </div>

          <p v-if="error" class="login__error">{{ error }}</p>

          <button type="submit" class="login__submit" :disabled="loading">
            <span v-if="loading" class="login__spinner"></span>
            <span v-else>{{ mode === 'login' ? 'Sign In' : 'Create Account' }}</span>
          </button>
        </form>

        <div class="login__features">
          <div class="login__feature">
            <div class="login__feature-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <span>Stream music with iLe tokens</span>
          </div>
          <div class="login__feature">
            <div class="login__feature-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
            </div>
            <span>Powered by Stellar blockchain</span>
          </div>
          <div class="login__feature">
            <div class="login__feature-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <span>Micropayments per stream</span>
          </div>
        </div>
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
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    return
  }
  if (mode.value === 'register' && !displayName.value) {
    error.value = 'Please enter a display name'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (mode.value === 'login') {
      await appStore.login(email.value, password.value)
    } else {
      await appStore.register(email.value, password.value, displayName.value)
    }
    router.push('/')
  } catch (e: any) {
    error.value = e.message || 'Connection failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  padding: 20px;
  overflow: hidden;

  &__orb-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);

    &--1 {
      width: 400px;
      height: 400px;
      top: -100px;
      left: -100px;
      background: rgba(120, 80, 255, 0.12);
      animation: float 8s ease-in-out infinite;
    }
    &--2 {
      width: 300px;
      height: 300px;
      bottom: -50px;
      right: -50px;
      background: rgba(0, 229, 255, 0.08);
      animation: float 10s ease-in-out infinite 2s;
    }
    &--3 {
      width: 200px;
      height: 200px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 171, 0, 0.06);
      animation: float 12s ease-in-out infinite 4s;
    }
  }

  &__container {
    width: 100%;
    max-width: 440px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &__brand {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  &__logo {
    position: relative;
    width: 72px;
    height: 72px;

    &-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid rgba(120, 80, 255, 0.3);
      animation: spin 12s linear infinite;
      border-top-color: rgba(0, 229, 255, 0.6);
    }

    &-core {
      position: absolute;
      inset: 8px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--violet), var(--cyan));
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 30px rgba(120, 80, 255, 0.3);
    }

    &-letter {
      font-family: var(--font-display);
      font-size: 1.8rem;
      font-weight: 900;
      color: white;
    }
  }

  &__title {
    font-family: var(--font-display);
    font-size: 2.4rem;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  &__dash {
    color: var(--text-muted);
    font-weight: 300;
  }

  &__tagline {
    font-size: 0.9rem;
    color: var(--text-secondary);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 300;
  }

  &__card {
    width: 100%;
    border-radius: var(--radius-lg);
    padding: 32px;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--violet), var(--cyan), var(--amber));
    }
  }

  &__tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 28px;
    padding: 4px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: var(--radius);
  }

  &__tab {
    flex: 1;
    padding: 10px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-smooth);

    &--active {
      background: rgba(120, 80, 255, 0.15);
      color: var(--violet-bright);
    }

    &:hover:not(&--active) {
      color: var(--text-primary);
    }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 18px;
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
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__input {
    width: 100%;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius);
    color: var(--text-primary);
    font-size: 0.9rem;
    outline: none;
    transition: all var(--transition-smooth);

    &::placeholder { color: var(--text-muted); }

    &:focus {
      border-color: rgba(120, 80, 255, 0.4);
      background: rgba(255, 255, 255, 0.06);
      box-shadow: 0 0 0 3px rgba(120, 80, 255, 0.1);
    }

    &:disabled { opacity: 0.5; }
  }

  &__error {
    font-size: 0.82rem;
    color: var(--magenta);
    text-align: center;
    padding: 8px;
    background: rgba(255, 64, 129, 0.08);
    border-radius: var(--radius-sm);
    animation: fadeIn 0.2s ease;
  }

  &__submit {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, var(--violet), var(--violet-dim));
    border: none;
    border-radius: var(--radius);
    color: white;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-smooth);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 4px;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--violet-bright), var(--violet));
      box-shadow: 0 0 30px rgba(120, 80, 255, 0.3);
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  &__features {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--glass-border);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__feature {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.8rem;
    color: var(--text-secondary);

    &-icon {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(120, 80, 255, 0.1);
      color: var(--violet-bright);
    }
  }
}
</style>
