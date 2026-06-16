<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { CardListItemDto } from '../../../shared/contracts/cards';
import { listCards } from './useCardList';

const cards = ref<CardListItemDto[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const nameFilter = ref('');
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(price);

async function loadCards() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    cards.value = await listCards({ name: nameFilter.value });
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load cards';
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadCards);

watch(nameFilter, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(loadCards, 200);
});
</script>

<template>
  <section class="card-list-page">
    <header class="list-header">
      <h1>Available Singles</h1>
      <p class="muted">Current lowest listed price from synced sellers.</p>
    </header>

    <label class="search-field">
      <span>Card name</span>
      <input v-model="nameFilter" type="search" placeholder="Search by name, e.g. Luke" />
    </label>

    <p v-if="isLoading" class="muted">Loading cards...</p>
    <p v-else-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-else-if="cards.length === 0" class="muted">No cards currently have listings.</p>

    <div v-else class="card-list">
      <RouterLink v-for="card in cards" :key="card.id" :to="`/cards/${card.id}`" class="card-row">
        <span>{{ card.name }}</span>
        <strong>{{ formatPrice(card.lowestPriceNzd) }}</strong>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.card-list-page {
  display: grid;
  gap: 18px;
  margin: 0 auto;
  max-width: 760px;
}

.list-header h1,
.list-header p {
  margin: 0;
}

.list-header h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1;
}

.search-field {
  display: grid;
  gap: 6px;
}

.search-field span {
  color: #aab4c4;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.search-field input {
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #f5f7fb;
  font: inherit;
  padding: 12px 14px;
}

.search-field input:focus {
  border-color: #93c5fd;
  outline: none;
}

.card-list {
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.card-row {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 12px 14px;
  text-decoration: none;
}

.card-row + .card-row {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.card-row:hover {
  background: rgba(255, 255, 255, 0.06);
}

.card-row strong {
  color: #93c5fd;
  white-space: nowrap;
}
</style>
