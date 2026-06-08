<template>
  <nav class="orb-nav" :class="{ 'orb-nav--expanded': expanded }">
    <button class="orb-nav__trigger" @click="toggle" :class="{ 'orb-nav__trigger--active': expanded }">
      <div class="orb-nav__core">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
          <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.5"/>
        </svg>
      </div>
      <span class="orb-nav__balance" v-if="tokenBalance !== null">
        <span class="orb-nav__token-icon">i</span>
        {{ formatBalance(tokenBalance) }}
      </span>
    </button>

    <transition name="orb-expand">
      <div v-if="expanded" class="orb-nav__panel glass">
        <div class="orb-nav__ring">
          <button
            v-for="(item, i) in navItems"
            :key="item.to"
            class="orb-nav__item"
            :class="{ 'orb-nav__item--active': route.path === item.to }"
            :style="{ '--i': i, '--total': navItems.length }"
            @click="navigate(item.to)"
          >
            <div class="orb-nav__item-icon" v-html="item.icon"></div>
            <span class="orb-nav__item-label">{{ item.label }}</span>
          </button>
        </div>

        <div class="orb-nav__footer">
          <button class="orb-nav__action" @click="navigate('/wallet')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/>
            </svg>
            Wallet
          </button>
          <button class="orb-nav__action orb-nav__action--logout" @click="handleLogout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Exit
          </button>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="expanded" class="orb-nav__backdrop" @click="toggle"></div>
    </transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { navOpen } = storeToRefs(appStore)

const expanded = ref(false)
const tokenBalance = ref<number | null>(null)

const navItems = [
  {
    to: '/',
    label: 'Discover',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
  },
  {
    to: '/library',
    label: 'Library',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
  },
  {
    to: '/search',
    label: 'Search',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
  },
  {
    to: '/queue',
    label: 'Queue',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
  },
  {
    to: '/subscriptions',
    label: 'Plans',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>'
  },
]

function toggle() {
  expanded.value = !expanded.value
  navOpen.value = expanded.value
}

function navigate(to: string) {
  router.push(to)
  expanded.value = false
  navOpen.value = false
}

function formatBalance(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toFixed(2)
}

async function handleLogout() {
  appStore.logout()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.orb-nav {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 100;

  &__trigger {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px 8px 8px;
    background: rgba(20, 20, 46, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(120, 80, 255, 0.15);
    border-radius: 100px;
    color: var(--text-primary);
    cursor: pointer;
    transition: all var(--transition-smooth);
    position: relative;
    z-index: 102;

    &:hover {
      border-color: rgba(120, 80, 255, 0.35);
      box-shadow: 0 0 30px rgba(120, 80, 255, 0.15);
    }

    &--active {
      border-color: rgba(0, 229, 255, 0.4);
      box-shadow: 0 0 30px rgba(0, 229, 255, 0.15);
    }
  }

  &__core {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(120, 80, 255, 0.2), rgba(0, 229, 255, 0.1));
    animation: breathe 3s ease-in-out infinite;
  }

  &__balance {
    font-size: 0.82rem;
    font-weight: 600;
    font-family: var(--font-mono);
    color: var(--gold);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__token-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), var(--amber));
    color: var(--void);
    font-size: 0.65rem;
    font-weight: 800;
    font-family: var(--font-display);
  }

  &__panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    border-radius: 0;
    border-left: none;
    border-top: none;
    border-bottom: none;
    padding: 90px 20px 20px;
    display: flex;
    flex-direction: column;
    z-index: 101;
  }

  &__ring {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius);
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-smooth);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(120, 80, 255, 0.08), rgba(0, 229, 255, 0.04));
      opacity: 0;
      transition: opacity var(--transition-smooth);
    }

    &:hover {
      color: var(--text-primary);
      border-color: rgba(120, 80, 255, 0.15);
      &::before { opacity: 1; }
    }

    &--active {
      color: var(--violet-bright);
      border-color: rgba(120, 80, 255, 0.25);
      background: rgba(120, 80, 255, 0.08);

      &::after {
        content: '';
        position: absolute;
        left: 0;
        top: 12px;
        bottom: 12px;
        width: 3px;
        background: linear-gradient(180deg, var(--violet), var(--cyan));
        border-radius: 0 4px 4px 0;
      }
    }
  }

  &__item-icon {
    display: flex;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  &__item-label {
    position: relative;
    z-index: 1;
  }

  &__footer {
    padding-top: 16px;
    border-top: 1px solid var(--glass-border);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__action {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: transparent;
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: 0.82rem;
    cursor: pointer;
    transition: all var(--transition-smooth);

    &:hover {
      color: var(--text-primary);
      border-color: rgba(120, 80, 255, 0.2);
      background: rgba(120, 80, 255, 0.05);
    }

    &--logout:hover {
      color: var(--magenta);
      border-color: rgba(255, 64, 129, 0.3);
      background: rgba(255, 64, 129, 0.05);
    }
  }

  &__backdrop {
    position: fixed;
    inset: 0;
    background: rgba(5, 5, 16, 0.6);
    z-index: 100;
  }
}

.orb-expand-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.orb-expand-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.orb-expand-enter-from {
  opacity: 0;
  transform: translateX(-30px) scale(0.95);
}
.orb-expand-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
