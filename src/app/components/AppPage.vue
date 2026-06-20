<script setup lang="ts">
withDefaults(defineProps<{
  size?: 'narrow' | 'wide';
}>(), {
  size: 'wide'
});
</script>

<template>
  <section class="app-page" :class="`size-${size}`">
    <slot />
  </section>
</template>

<style scoped>
.app-page {
  display: grid;
  gap: 12px;
  margin: 0 auto;
}

.size-wide {
  max-width: 1120px;
}

.size-narrow {
  max-width: 1040px;
}
</style>
