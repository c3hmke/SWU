<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { CardListItemDto } from '../../../shared/contracts/cards';
import { listCards } from './useCardList';

const route = useRoute();
const router = useRouter();
const cards = ref<CardListItemDto[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const nameFilter = ref(typeof route.query.name === 'string' ? route.query.name : '');
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

  searchTimeout = setTimeout(() => {
    const trimmedName = nameFilter.value.trim();
    void router.replace({
      query: {
        ...route.query,
        name: trimmedName || undefined
      }
    });

    void loadCards();
  }, 200);
});

function clearSearch() {
  nameFilter.value = '';
}
</script>

<template>
  <section class="card-list-page">
    <header class="list-header">
      <h1>Available Singles</h1>
      <p class="muted">Current lowest listed price from synced sellers.</p>
    </header>

    <label class="search-field">
      <span>Card name</span>
      <div class="search-control">
        <input v-model="nameFilter" type="search" placeholder="Search by name, e.g. Luke" />
        <button v-if="nameFilter" type="button" @click="clearSearch">Clear</button>
      </div>
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

.search-control {
  align-items: center;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  display: flex;
}

.search-control:focus-within {
  border-color: #93c5fd;
}

.search-field input {
  background: transparent;
  border: 0;
  color: #f5f7fb;
  flex: 1;
  font: inherit;
  padding: 12px 14px;
  min-width: 0;
}

.search-field input:focus {
  outline: none;
}

.search-control button {
  background: rgba(147, 197, 253, 0.12);
  border: 0;
  border-radius: 6px;
  color: #93c5fd;
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 800;
  margin-right: 6px;
  padding: 7px 10px;
}

.search-control button:hover {
  background: rgba(147, 197, 253, 0.2);
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
