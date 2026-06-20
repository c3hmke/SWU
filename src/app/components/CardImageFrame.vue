<script setup lang="ts">
withDefaults(defineProps<{
  imageUrl: string | null;
  alt: string;
  variant?: 'tile' | 'hero' | 'mini';
}>(), {
  variant: 'tile'
});
</script>

<template>
  <span class="card-image-frame" :class="`variant-${variant}`">
    <img v-if="imageUrl" :src="imageUrl" :alt="alt" loading="lazy" />
    <span v-else class="placeholder">No image</span>
  </span>
</template>

<style scoped>
.card-image-frame {
  align-items: center;
  background:
    radial-gradient(circle at 50% 20%, rgba(148, 163, 184, 0.18), transparent 52%),
    rgba(2, 6, 23, 0.72);
  border: 1px solid rgba(125, 211, 252, 0.14);
  box-shadow: 0 0 30px rgba(15, 23, 42, 0.7) inset;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.variant-tile {
  aspect-ratio: 5 / 7;
  clip-path: polygon(0 8px, 8px 0, 100% 0, 100% 100%, 0 100%);
}

.variant-hero {
  aspect-ratio: 1;
  border-color: rgba(125, 211, 252, 0.16);
  box-sizing: border-box;
  box-shadow: 0 0 34px rgba(15, 23, 42, 0.76) inset;
  clip-path: polygon(0 14px, 14px 0, 100% 0, 100% 100%, 0 100%);
  padding: 8px;
  place-items: center;
}

.variant-mini {
  border-color: rgba(125, 211, 252, 0.16);
  height: 48px;
  width: 36px;
}

img {
  display: block;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  width: 100%;
}

.variant-hero img {
  height: auto;
  width: auto;
}

.placeholder {
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 800;
  text-align: center;
  text-transform: uppercase;
}

.variant-hero .placeholder {
  color: #94a3b8;
}

.variant-mini .placeholder {
  font-size: 0.52rem;
  font-weight: 900;
}
</style>
