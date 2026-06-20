<script setup lang="ts">
withDefaults(defineProps<{
  to?: string;
  variant?: 'default' | 'warning';
}>(), {
  to: undefined,
  variant: 'default'
});
</script>

<template>
  <RouterLink v-if="to" class="name-chip" :class="`variant-${variant}`" :to="to">
    <slot />
  </RouterLink>
  <span v-else class="name-chip" :class="`variant-${variant}`">
    <slot />
  </span>
</template>

<style scoped>
.name-chip {
  background:
    linear-gradient(90deg, rgba(2, 6, 23, 0.92), rgba(8, 47, 73, 0.4)),
    rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(125, 211, 252, 0.24);
  color: #bae6fd;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 7px 9px;
  text-decoration: none;
}

.variant-warning {
  border-color: rgba(251, 191, 36, 0.26);
  color: #fde68a;
}
</style>
