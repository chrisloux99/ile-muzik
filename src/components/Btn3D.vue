<template>
  <button
    class="btn3d"
    :class="[`btn3d--${variant}`, `btn3d--${size}`, { 'btn3d--block': block, 'btn3d--loading': loading }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="btn3d__spinner"></span>
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'green' | 'orange' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  loading?: boolean
  disabled?: boolean
}>(), {
  variant: 'green',
  size: 'md',
  block: false,
  loading: false,
  disabled: false
})

defineEmits(['click'])
</script>

<style scoped lang="scss">
.btn3d {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  border: none;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
  transform-style: preserve-3d;
  perspective: 600px;
  letter-spacing: 0.02em;
  border-radius: 12px;
  outline: none;

  &--sm { padding: 8px 16px; font-size: 0.8rem; border-radius: 8px; }
  &--md { padding: 12px 28px; font-size: 0.95rem; }
  &--lg { padding: 16px 40px; font-size: 1.1rem; border-radius: 14px; }

  &--block { width: 100%; }

  &--green {
    background: linear-gradient(145deg, #22a800, #198A00);
    color: #fff;
    box-shadow:
      0 4px 0 #0d5c00,
      0 6px 12px rgba(0,0,0,0.4),
      inset 0 1px 0 rgba(255,255,255,0.15);

    &:hover:not(:disabled) {
      transform: translateY(-2px) rotateX(3deg);
      box-shadow:
        0 6px 0 #0d5c00,
        0 10px 20px rgba(0,0,0,0.5),
        inset 0 1px 0 rgba(255,255,255,0.2),
        0 0 20px rgba(25,138,0,0.3);
    }

    &:active:not(:disabled) {
      transform: translateY(2px);
      box-shadow:
        0 1px 0 #0d5c00,
        0 2px 4px rgba(0,0,0,0.4),
        inset 0 1px 0 rgba(255,255,255,0.1);
    }
  }

  &--orange {
    background: linear-gradient(145deg, #ff9500, #EF7D00);
    color: #fff;
    box-shadow:
      0 4px 0 #b35e00,
      0 6px 12px rgba(0,0,0,0.4),
      inset 0 1px 0 rgba(255,255,255,0.15);

    &:hover:not(:disabled) {
      transform: translateY(-2px) rotateX(3deg);
      box-shadow:
        0 6px 0 #b35e00,
        0 10px 20px rgba(0,0,0,0.5),
        inset 0 1px 0 rgba(255,255,255,0.2),
        0 0 20px rgba(239,125,0,0.3);
    }

    &:active:not(:disabled) {
      transform: translateY(2px);
      box-shadow:
        0 1px 0 #b35e00,
        0 2px 4px rgba(0,0,0,0.4),
        inset 0 1px 0 rgba(255,255,255,0.1);
    }
  }

  &--ghost {
    background: rgba(255,255,255,0.05);
    color: var(--text-secondary);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 2px 0 rgba(0,0,0,0.2);

    &:hover:not(:disabled) {
      background: rgba(255,255,255,0.1);
      color: #fff;
      transform: translateY(-1px);
      border-color: rgba(25,138,0,0.3);
      box-shadow: 0 4px 0 rgba(0,0,0,0.2), 0 0 12px rgba(25,138,0,0.1);
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
      box-shadow: 0 1px 0 rgba(0,0,0,0.2);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--loading {
    pointer-events: none;
  }

  &__spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
