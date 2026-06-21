<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  sourceName: string;
  sellerName: string | null;
  sellerLocation: string | null;
  sellerRating: number | null;
  isStore: boolean | null;
  allowPickups: boolean | null;
}>();

const detailText = computed(() => {
  const parts: string[] = [];

  if (props.isStore) {
    parts.push('Store');
  } else if (props.isStore === false) {
    parts.push('Marketplace seller');
  }

  if (props.sellerRating !== null) {
    parts.push(`${props.sellerRating.toFixed(1)} rating`);
  }

  if (props.sellerLocation) {
    parts.push(props.sellerLocation);
  }

  if (props.allowPickups) {
    parts.push('pickup available');
  }

  return parts.join(' / ');
});
</script>

<template>
  <span v-if="sellerName" class="marketplace-meta">
    <span>{{ sellerName }} via {{ sourceName }}</span>
    <small v-if="detailText">{{ detailText }}</small>
  </span>
</template>

<style scoped>
.marketplace-meta {
  color: #93c5fd;
  display: grid;
  font-size: 0.72rem;
  font-weight: 900;
  gap: 2px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.marketplace-meta small {
  color: #94a3b8;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}
</style>
