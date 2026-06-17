<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { CardDetailsDto } from '../../../shared/contracts/cards';
import CardListingTable from './CardListingTable.vue';
import { getCardDetails } from './useCardDetails';

const props = defineProps<{
  cardId: string;
}>();

const card = ref<CardDetailsDto | null>(null);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

const formatCollectorNumber = (collectorNumber: number) => collectorNumber.toString().padStart(3, '0');

async function loadCard() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    card.value = await getCardDetails(props.cardId);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load card details';
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadCard);
watch(() => props.cardId, loadCard);
</script>

<template>
  <p v-if="isLoading" class="muted">Loading card details...</p>
  <p v-else-if="errorMessage" class="error">{{ errorMessage }}</p>

  <article v-else-if="card" class="card-page">
    <section class="hero-card">
      <div class="image-frame">
        <span class="image-label">Visual record</span>
        <img v-if="card.imageUrl" :src="card.imageUrl" :alt="card.name" />
        <div v-else class="image-placeholder">No image</div>
      </div>

      <div class="card-summary">
        <p class="card-id">Databank {{ card.id }}</p>
        <p class="eyebrow">{{ card.setName || card.setCode }} {{ formatCollectorNumber(card.collectorNumber) }}</p>
        <h1>{{ card.name }}</h1>
      </div>
    </section>

    <CardListingTable :listings="card.listings" />
  </article>
</template>

<style scoped>
.card-page {
  display: grid;
  gap: 22px;
  margin: 0 auto;
  max-width: 1040px;
}

.hero-card {
  align-items: start;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(280px, 420px) 1fr;
}

.image-frame,
.card-summary {
  position: relative;
  background:
    radial-gradient(circle at 20% 0, rgba(14, 165, 233, 0.2), transparent 34%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.82));
  border: 1px solid rgba(125, 211, 252, 0.24);
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.86) inset,
    0 18px 80px rgba(0, 0, 0, 0.26),
    0 0 42px rgba(14, 165, 233, 0.08);
  clip-path: polygon(0 18px, 18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
  overflow: hidden;
}

.image-frame::before,
.card-summary::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(125, 211, 252, 0.04) 50%, transparent 50%) 0 0 / 100% 6px,
    linear-gradient(90deg, rgba(125, 211, 252, 0.08), transparent 24%, transparent 80%, rgba(251, 191, 36, 0.08));
  mix-blend-mode: screen;
  opacity: 0.36;
  pointer-events: none;
}

.image-frame::after,
.card-summary::after {
  border-bottom: 2px solid rgba(251, 191, 36, 0.74);
  border-left: 2px solid rgba(251, 191, 36, 0.74);
  bottom: 10px;
  content: '';
  height: 18px;
  left: 10px;
  position: absolute;
  width: 18px;
}

.image-frame {
  aspect-ratio: 1;
  box-sizing: border-box;
  padding: 32px 14px 14px;
  display: grid;
  place-items: center;
}

.image-label {
  color: #fbbf24;
  font-size: 0.68rem;
  font-weight: 900;
  left: 18px;
  letter-spacing: 0.18em;
  position: absolute;
  text-transform: uppercase;
  top: 14px;
}

.image-frame img {
  display: block;
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
}

.image-placeholder {
  color: #94a3b8;
}

.card-summary {
  align-self: start;
  min-height: 220px;
  padding: clamp(22px, 4vw, 36px);
}

.card-id {
  color: #fbbf24;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  margin: 0 0 8px;
  text-transform: uppercase;
}

.eyebrow {
  color: #7dd3fc;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0 0 16px;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(1.8rem, 4vw, 3.4rem);
  letter-spacing: -0.04em;
  line-height: 1.12;
  margin: 0 0 10px;
}

@media (max-width: 800px) {
  .hero-card {
    grid-template-columns: 1fr;
  }

  .image-frame {
    max-width: 410px;
    width: 100%;
  }
}
</style>
