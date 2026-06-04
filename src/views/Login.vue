<template>
  <div class="login">
    <div class="login__card" :class="{ 'login__card--shake': hasError }">
      <Logo3D size="xl" />
      <p class="login__tagline">Zambia's Finest Music Experience</p>

      <form class="login__form" @submit.prevent="handleLogin">
        <div class="login__field">
          <div class="login__input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <input
            v-model="email"
            type="text"
            placeholder="Email or username"
            :disabled="loading"
            autocomplete="username"
          />
        </div>

        <div class="login__field">
          <div class="login__input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            :disabled="loading"
            autocomplete="current-password"
          />
        </div>

        <p v-if="error" class="login__error">{{ error }}</p>

        <Btn3D variant="green" size="lg" block :loading="loading" @click="handleLogin">
          Sign In
        </Btn3D>
      </form>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import Logo3D from '@/components/Logo3D.vue'
import Btn3D from '@/components/Btn3D.vue'

const router = useRouter()
const appStore = useAppStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const hasError = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    shake()
    return
  }

  loading.value = true
  error.value = ''

  try {
    await appStore.login(email.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || 'Connection failed'
    shake()
  } finally {
    loading.value = false
  }
}

function shake() {
  hasError.value = true
  setTimeout(() => { hasError.value = false }, 500)
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

  &__card {
    width: 100%;
    max-width: 420px;
    background: rgba(17,17,17,0.85);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 48px 36px;
    backdrop-filter: blur(30px);
    text-align: center;
    animation: scaleIn 0.4s ease;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: 20px;
      padding: 1px;
      background: linear-gradient(135deg, rgba(25,138,0,0.3), rgba(239,125,0,0.2), rgba(222,32,16,0.15));
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      -webkit-mask-composite: xor;
      pointer-events: none;
    }

    &--shake {
      animation: shakeCard 0.4s ease;
    }
  }

  &__tagline {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin: 20px 0 32px;
    letter-spacing: 0.05em;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__field {
    position: relative;

    input {
      width: 100%;
      padding: 14px 16px 14px 48px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: var(--radius);
      color: var(--text-primary);
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s ease;

      &::placeholder { color: var(--text-muted); }

      &:focus {
        border-color: rgba(25,138,0,0.4);
        background: rgba(255,255,255,0.06);
        box-shadow: 0 0 0 3px rgba(25,138,0,0.1);
      }

      &:disabled { opacity: 0.5; }
    }
  }

  &__input-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    display: flex;
    pointer-events: none;
  }

  &__error {
    font-size: 0.82rem;
    color: var(--zambia-red);
    text-align: left;
    padding: 0 4px;
    animation: fadeIn 0.2s ease;
  }
}

@keyframes shakeCard {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
</style>
