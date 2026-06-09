<template>
  <div class="ile-app" :class="{ 'ile-app--nav-open': navOpen && isLoggedIn }">
    <CosmosBackground />
    <OrbNav v-if="isLoggedIn" />
    <main class="ile-main" :class="{ 'ile-main--with-player': isLoggedIn }">
      <RouterView v-slot="{ Component }">
        <transition name="morph" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
    <PlayerBar v-if="isLoggedIn" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { usePlayerStore } from '@/stores/player'
import CosmosBackground from '@/components/CosmosBackground.vue'
import OrbNav from '@/components/OrbNav.vue'
import PlayerBar from '@/components/PlayerBar.vue'

const { isLoggedIn, navOpen } = storeToRefs(useAppStore())
const player = usePlayerStore()

onMounted(() => {
  if (isLoggedIn.value) {
    player.restoreQueue()
  }
})
</script>

<style lang="scss">
@import '@/assets/main.scss';

.ile-app {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.ile-main {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &--with-player {
    padding-bottom: 100px;
  }
}

.morph-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.morph-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.morph-enter-from {
  opacity: 0;
  transform: scale(0.96) translateY(12px);
  filter: blur(4px);
}
.morph-leave-to {
  opacity: 0;
  transform: scale(1.02) translateY(-8px);
  filter: blur(2px);
}
</style>
