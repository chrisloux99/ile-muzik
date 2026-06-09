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

      <ui5-card class="login__card">
        <ui5-tabcontainer @tab-select="handleTabSelect" :selected-tab="mode === 'login' ? 0 : 1">
          <ui5-tab text="Sign In" :selected="mode === 'login'"></ui5-tab>
          <ui5-tab text="Create Account" :selected="mode === 'register'"></ui5-tab>
        </ui5-tabcontainer>

        <form class="login__form" @submit.prevent="handleSubmit">
          <ui5-input
            v-if="mode === 'register'"
            v-model="displayName"
            placeholder="Your display name"
            :disabled="loading"
            class="login__input"
            required
          >
            <ui5-label slot="label">Display Name</ui5-label>
          </ui5-input>

          <ui5-input
            v-model="email"
            type="Email"
            placeholder="you@example.com"
            :disabled="loading"
            required
            class="login__input"
          >
            <ui5-label slot="label">Email</ui5-label>
          </ui5-input>

          <ui5-input
            v-model="password"
            type="Password"
            placeholder="Your password"
            :disabled="loading"
            required
            class="login__input"
          >
            <ui5-label slot="label">Password</ui5-label>
          </ui5-input>

          <ui5-message-strip
            v-if="error"
            design="Negative"
            class="login__error"
            @close="error = ''"
          >
            {{ error }}
          </ui5-message-strip>

          <ui5-button
            type="Submit"
            design="Emphasized"
            :disabled="loading"
            class="login__submit"
          >
            <ui5-busy-indicator v-if="loading" active size="Small"></ui5-busy-indicator>
            <span v-else>{{ mode === 'login' ? 'Sign In' : 'Create Account' }}</span>
          </ui5-button>
        </form>

        <div class="login__features">
          <div class="login__feature">
            <ui5-icon name="history" class="login__feature-icon"></ui5-icon>
            <span>Stream music with iLe tokens</span>
          </div>
          <div class="login__feature">
            <ui5-icon name="chain-link" class="login__feature-icon"></ui5-icon>
            <span>Powered by Stellar blockchain</span>
          </div>
          <div class="login__feature">
            <ui5-icon name="money-bills" class="login__feature-icon"></ui5-icon>
            <span>Micropayments per stream</span>
          </div>
        </div>
      </ui5-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

import '@ui5/webcomponents/dist/Input.js'
import '@ui5/webcomponents/dist/Button.js'
import '@ui5/webcomponents/dist/Card.js'
import '@ui5/webcomponents/dist/Tab.js'
import '@ui5/webcomponents/dist/TabContainer.js'
import '@ui5/webcomponents/dist/Label.js'
import '@ui5/webcomponents/dist/MessageStrip.js'
import '@ui5/webcomponents/dist/BusyIndicator.js'
import '@ui5/webcomponents/dist/Icon.js'
import '@ui5/webcomponents-icons/dist/history.js'
import '@ui5/webcomponents-icons/dist/chain-link.js'
import '@ui5/webcomponents-icons/dist/money-bills.js'

const router = useRouter()
const appStore = useAppStore()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const displayName = ref('')
const loading = ref(false)
const error = ref('')

function handleTabSelect(e: CustomEvent) {
  const index = e.detail?.index ?? (e.target as any)?.selectedIndex ?? 0
  mode.value = index === 0 ? 'login' : 'register'
}

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
    background: var(--glass);
    border: 1px solid var(--glass-border);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-top: 20px;
  }

  &__input {
    width: 100%;
  }

  &__error {
    margin-top: 4px;
  }

  &__submit {
    width: 100%;
    margin-top: 4px;
    height: 48px;
    font-size: 1rem;
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
      color: var(--violet-bright);
      font-size: 1.2rem;
    }
  }
}
</style>
