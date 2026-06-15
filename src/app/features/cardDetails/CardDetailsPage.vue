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
        <p class="card-id">{{ card.id }}</p>
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
  gap: 8px;
  margin: 0 auto;
  max-width: 1040px;
}

.hero-card {
  display: flex;
  flex-flow: row;
  align-items: start;
  gap: 8px;
}

.image-frame,
.card-summary {
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.image-frame {
  aspect-ratio: 1;
  box-sizing: border-box;
  padding: 10px;
  display: grid;
  flex: 0 0 420px;
  overflow: hidden;
  place-items: center;
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
  border-radius: 8px;
  flex: 1 1 0;
  padding: 18px 20px;
}

.card-id {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  margin: 0 0 0px;
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
  font-size: clamp(1.35rem, 2vw, 1.8rem);
  line-height: 1.12;
  margin: 0 0 10px;
}

@media (max-width: 800px) {
  .hero-card {
    flex-direction: column;
  }

  .image-frame {
    flex-basis: auto;
    max-width: 410px;
    width: 100%;
  }

  .card-summary {
    width: 100%;
  }
}
</style>
