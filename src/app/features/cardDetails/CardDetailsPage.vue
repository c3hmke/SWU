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
        <img v-if="card.imageUrl" :src="card.imageUrl" :alt="card.name" />
        <div v-else class="image-placeholder">No image</div>
      </div>

      <div class="card-summary">
        <p class="eyebrow">{{ card.setName || card.setCode }} {{ formatCollectorNumber(card.collectorNumber) }}</p>
        <h1>{{ card.name }}</h1>
        <p class="muted">{{ card.id }}</p>
      </div>
    </section>

    <CardListingTable :listings="card.listings" />
  </article>
</template>

<style scoped>
.card-page {
  display: grid;
  gap: 28px;
  margin: 0 auto;
  max-width: 1120px;
}

.hero-card {
  align-items: stretch;
  display: grid;
  gap: 28px;
  grid-template-columns: minmax(220px, 320px) 1fr;
}

.image-frame,
.card-summary {
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
}

.image-frame {
  display: grid;
  min-height: 420px;
  overflow: hidden;
  place-items: center;
}

.image-frame img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.image-placeholder {
  color: #94a3b8;
}

.card-summary {
  padding: clamp(24px, 5vw, 44px);
}

.eyebrow {
  color: #93c5fd;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0 0 12px;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(2rem, 5vw, 4.5rem);
  line-height: 0.95;
  margin: 0 0 18px;
}

@media (max-width: 800px) {
  .hero-card {
    grid-template-columns: 1fr;
  }

  .image-frame {
    max-width: 340px;
  }
}
</style>
