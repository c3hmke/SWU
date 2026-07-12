<script setup lang="ts">
import CardImageFrame from './CardImageFrame.vue';
import { formatPrice } from '../shared/formatters';

defineProps<{
  to: string;
  name: string;
  imageUrl: string | null;
  thumbnailImageUrl?: string | null;
  priceNzd: number | null;
}>();
</script>

<template>
  <RouterLink :to="to" class="card-tile" :class="{ unavailable: priceNzd === null }">
    <CardImageFrame :image-url="thumbnailImageUrl ?? imageUrl" :alt="name" />
    <span class="card-name">{{ name }}</span>
    <strong>{{ priceNzd === null ? 'no listings found' : formatPrice(priceNzd) }}</strong>
  </RouterLink>
</template>

<style scoped>
.card-tile {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.88)),
    rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(125, 211, 252, 0.18);
  border-radius: 0;
  box-shadow:
    0 18px 60px rgba(0, 0, 0, 0.22),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  clip-path: polygon(0 10px, 10px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%);
  display: grid;
  gap: 10px;
  padding: 10px;
  text-decoration: none;
  transition:
    border-color 160ms ease,
    transform 160ms ease,
    background 160ms ease;
}

.card-tile:hover {
  background:
    linear-gradient(180deg, rgba(8, 47, 73, 0.56), rgba(2, 6, 23, 0.9)),
    rgba(15, 23, 42, 0.86);
  border-color: rgba(251, 191, 36, 0.46);
  box-shadow:
    0 22px 70px rgba(0, 0, 0, 0.28),
    0 0 28px rgba(14, 165, 233, 0.12);
  transform: translateY(-2px);
}

.card-tile.unavailable {
  background:
    linear-gradient(180deg, rgba(51, 65, 85, 0.42), rgba(15, 23, 42, 0.82)),
    rgba(15, 23, 42, 0.66);
  border-color: rgba(148, 163, 184, 0.18);
  filter: grayscale(0.78);
  opacity: 0.66;
}

.card-tile.unavailable:hover {
  border-color: rgba(148, 163, 184, 0.42);
  filter: grayscale(0.55);
  opacity: 0.78;
}

.card-name {
  font-size: 0.94rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  line-height: 1.2;
}

strong {
  color: #fbbf24;
  font-size: 0.96rem;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.unavailable strong {
  color: #cbd5e1;
  font-size: 0.78rem;
  text-transform: uppercase;
}
</style>
