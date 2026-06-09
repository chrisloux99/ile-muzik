<template>
  <aside class="sidebar" :class="{ 'sidebar--open': sidebarOpen }">
    <div class="sidebar__overlay" @click="toggleSidebar"></div>
    <div class="sidebar__panel">
      <div class="sidebar__header">
        <Logo3D size="md" />
      </div>

      <nav class="sidebar__nav">
        <div class="sidebar__nav-group">
          <router-link
            v-for="item in mainNavItems"
            :key="item.to"
            :to="item.to"
            class="sidebar__link"
            :class="{ 'sidebar__link--active': route.path === item.to }"
            @click="closeMobile"
          >
            <div class="sidebar__icon" v-html="item.icon"></div>
            <span>{{ item.label }}</span>
          </router-link>
        </div>
        <div class="sidebar__divider"></div>
        <div class="sidebar__nav-group">
          <router-link
            v-for="item in accountNavItems"
            :key="item.to"
            :to="item.to"
            class="sidebar__link"
            :class="{ 'sidebar__link--active': route.path === item.to }"
            @click="closeMobile"
          >
            <div class="sidebar__icon" v-html="item.icon"></div>
            <span>{{ item.label }}</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar__footer">
        <button class="sidebar__logout" @click="handleLogout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </aside>

  <button class="sidebar__hamburger" @click="toggleSidebar" v-if="!sidebarOpen">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import Logo3D from './Logo3D.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { sidebarOpen } = storeToRefs(appStore)
const { toggleSidebar } = appStore

const mainNavItems = [
  {
    to: '/',
    label: 'Home',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
  },
  {
    to: '/library',
    label: 'Library',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
  },
  {
    to: '/search',
    label: 'Search',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
  },
  {
    to: '/queue',
    label: 'Queue',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
  }
]

const accountNavItems = [
  {
    to: '/wallet',
    label: 'Wallet',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>'
  },
  {
    to: '/subscriptions',
    label: 'Plans',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>'
  }
]

function closeMobile() {
  if (window.innerWidth <= 768) toggleSidebar()
}

async function handleLogout() {
  appStore.logout()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.sidebar {
  &__hamburger {
    display: none;
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 200;
    background: rgba(17,17,17,0.9);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--text-primary);
    width: 44px;
    height: 44px;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    @media (max-width: 768px) {
      display: flex;
    }
  }

  &__overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 98;

    @media (max-width: 768px) {
      .sidebar--open & { display: block; }
    }
  }

  &__panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 260px;
    height: 100vh;
    background: rgba(10,10,10,0.98);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    z-index: 99;
    transition: transform 0.3s ease;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
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
      opacity: 0.5;
    }

    @media (max-width: 768px) {
      transform: translateX(-100%);
      .sidebar--open & { transform: translateX(0); }
    }
  }

  &__header {
    padding: 28px 24px 20px;
    border-bottom: 1px solid var(--border);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 24px;
      right: 24px;
      height: 2px;
      background: linear-gradient(90deg, var(--zambia-green), var(--zambia-orange), var(--zambia-red));
      opacity: 0.4;
      border-radius: 1px;
    }
  }

  &__nav {
    flex: 1;
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
  }

  &__nav-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__divider {
    height: 1px;
    background: var(--border);
    margin: 8px 16px;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      color: var(--text-primary);
      background: rgba(255,255,255,0.04);
    }

    &--active {
      color: var(--zambia-green-light);
      background: rgba(25,138,0,0.1);

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 8px;
        bottom: 8px;
        width: 3px;
        background: var(--zambia-green);
        border-radius: 0 3px 3px 0;
      }
    }

    @media (max-width: 768px) {
      padding: 14px 20px;
      font-size: 1rem;
    }
  }

  &__icon {
    display: flex;
    align-items: center;
    opacity: 0.8;
  }

  &__footer {
    padding: 16px;
    border-top: 1px solid var(--border);
  }

  &__logout {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 16px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      color: var(--zambia-red);
      border-color: rgba(222,32,16,0.3);
      background: rgba(222,32,16,0.05);
    }
  }
}
</style>
