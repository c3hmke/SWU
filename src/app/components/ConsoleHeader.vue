<script setup lang="ts">
withDefaults(defineProps<{
  label: string;
  meta?: string;
}>(), {
  meta: undefined
});
</script>

<template>
  <header class="console-header">
    <span>{{ label }}</span>
    <span v-if="meta">{{ meta }}</span>
    <slot v-else />
  </header>
</template>

<style scoped>
.console-header {
  align-items: center;
  border-bottom: 1px solid rgba(125, 211, 252, 0.2);
  color: #fbbf24;
  display: flex;
  font-size: 0.72rem;
  font-weight: 900;
  justify-content: space-between;
  letter-spacing: 0.18em;
  padding-bottom: 12px;
  text-transform: uppercase;
}

.console-header span:last-child {
  color: #7dd3fc;
}

@media (max-width: 520px) {
  .console-header {
    align-items: start;
    display: grid;
    gap: 6px;
  }
}
</style>
