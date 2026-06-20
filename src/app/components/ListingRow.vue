<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'details' | 'bulk';
}>(), {
  variant: 'details'
});
</script>

<template>
  <article class="listing-row" :class="`variant-${variant}`">
    <slot />
  </article>
</template>

<style scoped>
.listing-row {
  align-items: center;
  background:
    linear-gradient(90deg, rgba(8, 47, 73, 0.32), rgba(2, 6, 23, 0.56)),
    rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(125, 211, 252, 0.18);
  clip-path: polygon(0 10px, 10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
  display: grid;
  gap: 12px;
  padding: 6px;
}

.variant-details {
  grid-template-columns: minmax(180px, 1fr) auto auto;
}

.variant-bulk {
  grid-template-columns: minmax(220px, 1fr) auto auto;
}

@media (max-width: 860px) {
  .variant-bulk {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .variant-details {
    grid-template-columns: 1fr;
  }
}
</style>
