<template>
  <button class="btn-ghost" :class="{ 'btn-ghost--sm': size === 'sm' }">
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md'
}>()
</script>

<style scoped lang="scss">
.btn-ghost {
  padding: 8px 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-smooth);

  &:hover {
    color: var(--text-primary);
    border-color: rgba(120, 80, 255, 0.3);
    background: rgba(120, 80, 255, 0.08);
  }

  &--sm {
    padding: 5px 12px;
    font-size: 0.75rem;
  }
}
</style>
