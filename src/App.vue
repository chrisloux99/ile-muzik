<template>
  <div class="app" :class="{ 'app--sidebar-open': sidebarOpen && isLoggedIn }">
    <VortexBackground />
    <Sidebar v-if="isLoggedIn" />
    <main class="main smooth-scroll" :class="{ 'main--with-player': isLoggedIn }">
      <RouterView v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
    <PlayerBar v-if="isLoggedIn" />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import VortexBackground from '@/components/VortexBackground.vue'
import Sidebar from '@/components/Sidebar.vue'
import PlayerBar from '@/components/PlayerBar.vue'

const { isLoggedIn, sidebarOpen } = storeToRefs(useAppStore())
</script>

<style lang="scss">
@import '@/assets/main.scss';

.app {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.main {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-left: 260px;
  transition: padding-left 0.3s ease;

  &--with-player {
    padding-bottom: 90px;
  }

  @media (max-width: 768px) {
    padding-left: 0;
  }
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
