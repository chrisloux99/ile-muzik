<template>
  <div class="logo3d" :class="[`logo3d--${size}`]">
    <div class="logo3d__scene">
      <div class="logo3d__text">
        <span class="logo3d__letter logo3d__letter--i">i</span>
        <span class="logo3d__letter logo3d__letter--L">L</span>
        <span class="logo3d__letter logo3d__letter--3">3</span>
        <span class="logo3d__space">&nbsp;</span>
        <span class="logo3d__letter logo3d__letter--M">M</span>
        <span class="logo3d__letter logo3d__letter--u">u</span>
        <span class="logo3d__letter logo3d__letter--z">z</span>
        <span class="logo3d__letter logo3d__letter--i2">i</span>
        <span class="logo3d__letter logo3d__letter--Q">Q</span>
      </div>
      <div class="logo3d__fire"></div>
      <div class="logo3d__shadow"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ size?: 'sm' | 'md' | 'lg' | 'xl' }>()
</script>

<style scoped lang="scss">
.logo3d {
  perspective: 600px;
  display: inline-block;

  &--sm .logo3d__text { font-size: 1.6rem; }
  &--md .logo3d__text { font-size: 2.6rem; }
  &--lg .logo3d__text { font-size: 4rem; }
  &--xl .logo3d__text { font-size: 5.5rem; }

  &__scene {
    position: relative;
    transform-style: preserve-3d;
    animation: logoFloat 3s ease-in-out infinite;
  }

  &__text {
    font-family: 'Playfair Display', serif;
    font-weight: 900;
    display: flex;
    letter-spacing: -0.03em;
    transform-style: preserve-3d;
    position: relative;
    z-index: 2;
  }

  &__letter {
    display: inline-block;
    transform-style: preserve-3d;
    animation: letterSlam 0.5s cubic-bezier(0.17, 0.67, 0.24, 1.2) both;
    position: relative;

    &::after {
      content: attr(data-char);
      position: absolute;
      inset: 0;
      transform: translateZ(-4px);
      filter: blur(0);
    }

    text-shadow:
      0 1px 0 rgba(0,0,0,0.8),
      0 2px 0 rgba(0,0,0,0.6),
      0 3px 0 rgba(0,0,0,0.4),
      0 4px 0 rgba(0,0,0,0.2),
      0 5px 15px rgba(0,0,0,0.6),
      0 0 40px var(--glow);

    &--i  { animation-delay: 0s;    color: #1aff00; --glow: rgba(26,255,0,0.4); }
    &--L  { animation-delay: 0.04s; color: #00ff6e; --glow: rgba(0,255,110,0.4); }
    &--3  {
      animation-delay: 0.08s;
      background: linear-gradient(180deg, #ff8800, #ff4400);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 0 20px rgba(255,136,0,0.6)) drop-shadow(0 4px 0 rgba(0,0,0,0.5));
    }
    &--M  { animation-delay: 0.15s; color: #1aff00; --glow: rgba(26,255,0,0.4); }
    &--u  { animation-delay: 0.19s; color: #ff6600; --glow: rgba(255,102,0,0.4); }
    &--z  { animation-delay: 0.23s; color: #00ff6e; --glow: rgba(0,255,110,0.4); }
    &--i2 { animation-delay: 0.27s; color: #ff6600; --glow: rgba(255,102,0,0.4); }
    &--Q  {
      animation-delay: 0.31s;
      background: linear-gradient(180deg, #ff2200, #cc0000);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      filter: drop-shadow(0 0 20px rgba(255,34,0,0.6)) drop-shadow(0 4px 0 rgba(0,0,0,0.5));
    }

    &:hover {
      animation: letterSmash 0.3s ease;
      transform: translateZ(30px) scale(1.2) rotateY(15deg);
    }
  }

  &__space {
    width: 0.25em;
  }

  &__fire {
    position: absolute;
    bottom: -4px;
    left: 5%;
    right: 5%;
    height: 8px;
    background: linear-gradient(90deg, transparent, rgba(255,102,0,0.4), rgba(255,34,0,0.3), rgba(26,255,0,0.2), transparent);
    filter: blur(6px);
    animation: fireFlicker 0.8s ease-in-out infinite alternate;
    z-index: 1;
  }

  &__shadow {
    position: absolute;
    bottom: -14px;
    left: 10%;
    right: 10%;
    height: 24px;
    background: radial-gradient(ellipse, rgba(255,68,0,0.2) 0%, transparent 70%);
    filter: blur(8px);
    animation: shadowPulse 3s ease-in-out infinite;
    z-index: 0;
  }
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0) rotateX(8deg); }
  50% { transform: translateY(-6px) rotateX(-4deg); }
}

@keyframes letterSlam {
  0% { transform: translateZ(-60px) rotateX(90deg); opacity: 0; }
  60% { transform: translateZ(8px) rotateX(-5deg); opacity: 1; }
  100% { transform: translateZ(0) rotateX(0); opacity: 1; }
}

@keyframes letterSmash {
  0% { transform: translateZ(0) scale(1); }
  40% { transform: translateZ(35px) scale(1.25) rotateY(20deg); }
  100% { transform: translateZ(0) scale(1); }
}

@keyframes fireFlicker {
  0% { opacity: 0.5; transform: scaleX(0.95); }
  100% { opacity: 1; transform: scaleX(1.05); }
}

@keyframes shadowPulse {
  0%, 100% { transform: scaleX(1); opacity: 0.5; }
  50% { transform: scaleX(0.8); opacity: 0.25; }
}
</style>
