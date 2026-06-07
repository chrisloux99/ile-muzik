<template>
  <div class="login">
    <div class="login__instruments">
      <svg class="login__kalimba" viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="40" cy="90" rx="30" ry="25" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.15"/>
        <ellipse cx="40" cy="90" rx="22" ry="18" fill="none" stroke="currentColor" stroke-width="1" opacity="0.1"/>
        <rect x="35" y="10" width="2" height="70" rx="1" fill="currentColor" opacity="0.12"/>
        <rect x="30" y="18" width="2" height="62" rx="1" fill="currentColor" opacity="0.1"/>
        <rect x="40" y="14" width="2" height="66" rx="1" fill="currentColor" opacity="0.12"/>
        <rect x="25" y="24" width="2" height="56" rx="1" fill="currentColor" opacity="0.08"/>
        <rect x="45" y="20" width="2" height="60" rx="1" fill="currentColor" opacity="0.1"/>
        <rect x="20" y="30" width="2" height="50" rx="1" fill="currentColor" opacity="0.06"/>
        <rect x="50" y="26" width="2" height="54" rx="1" fill="currentColor" opacity="0.08"/>
      </svg>
      <svg class="login__ngoma" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="30" cy="20" rx="24" ry="10" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.15"/>
        <path d="M6 20 v50" stroke="currentColor" stroke-width="1.5" opacity="0.12"/>
        <path d="M54 20 v50" stroke="currentColor" stroke-width="1.5" opacity="0.12"/>
        <ellipse cx="30" cy="70" rx="24" ry="10" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.12"/>
        <path d="M8 30 l44 0" stroke="currentColor" stroke-width="1" opacity="0.08" stroke-dasharray="4 4"/>
        <path d="M6 45 l48 0" stroke="currentColor" stroke-width="1" opacity="0.08" stroke-dasharray="4 4"/>
        <path d="M8 60 l44 0" stroke="currentColor" stroke-width="1" opacity="0.08" stroke-dasharray="4 4"/>
      </svg>
    </div>

    <div class="login__card" :class="{ 'login__card--shake': hasError }">
      <Logo3D size="lg" />
      <p class="login__tagline">Zambia's Finest Music Experience</p>
      <div class="login__pattern"></div>

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

      <div class="login__instruments-row">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2 C12 2 8 8 8 12 C8 14.2 9.8 16 12 16 C14.2 16 16 14.2 16 12 C16 8 12 2 12 2Z"/>
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.2">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.2">
          <path d="M12 3v18"/>
          <path d="M8 7l4-4 4 4"/>
          <ellipse cx="12" cy="14" rx="6" ry="4"/>
        </svg>
      </div>
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

  &__instruments {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  &__kalimba {
    position: absolute;
    width: 120px;
    height: 180px;
    top: 10%;
    left: 8%;
    color: var(--zambia-green);
    animation: floatInstrument 6s ease-in-out infinite;
  }

  &__ngoma {
    position: absolute;
    width: 90px;
    height: 120px;
    bottom: 12%;
    right: 8%;
    color: var(--zambia-orange);
    animation: floatInstrument 7s ease-in-out infinite 1s;
  }

  &__card {
    width: 100%;
    max-width: 420px;
    background: rgba(17,17,17,0.95);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 48px 36px;
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
    margin: 20px 0 24px;
    letter-spacing: 0.05em;
  }

  &__pattern {
    height: 3px;
    margin: 0 0 28px;
    background: repeating-linear-gradient(
      90deg,
      var(--zambia-green) 0px,
      var(--zambia-green) 8px,
      var(--zambia-orange) 8px,
      var(--zambia-orange) 16px,
      var(--zambia-red) 16px,
      var(--zambia-red) 24px,
      transparent 24px,
      transparent 32px
    );
    border-radius: 2px;
    opacity: 0.6;
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

  &__instruments-row {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--border);

    svg {
      width: 24px;
      height: 24px;
    }
  }
}

@keyframes floatInstrument {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(2deg); }
}

@keyframes shakeCard {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
</style>
