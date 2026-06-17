<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { CardListItemDto } from '../../../shared/contracts/cards';
import { listCards } from './useCardList';

const route = useRoute();
const router = useRouter();
const cards = ref<CardListItemDto[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const nameFilter = ref(typeof route.query.name === 'string' ? route.query.name : '');
const visibleCards = computed(() => (nameFilter.value.trim() ? cards.value : cards.value.slice(0, 12)));
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
      <h1>Search Singles</h1>
      <p class="muted">Available cards sorted by their highest current minimum price.</p>
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

    <div v-else class="card-grid">
      <RouterLink v-for="card in visibleCards" :key="card.id" :to="`/cards/${card.id}`" class="card-tile">
        <div class="card-image-frame">
          <img v-if="card.imageUrl" :src="card.imageUrl" :alt="card.name" loading="lazy" />
          <span v-else class="card-image-placeholder">No image</span>
        </div>

        <span class="card-name">{{ card.name }}</span>
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
  max-width: 1120px;
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

.card-grid {
  display: grid;
  gap: clamp(14px, 2vw, 22px);
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.card-tile {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.18);
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
  background: rgba(15, 23, 42, 0.86);
  border-color: rgba(147, 197, 253, 0.42);
  transform: translateY(-2px);
}

.card-image-frame {
  align-items: center;
  aspect-ratio: 5 / 7;
  background:
    radial-gradient(circle at 50% 20%, rgba(148, 163, 184, 0.18), transparent 52%),
    rgba(2, 6, 23, 0.72);
  border-radius: 12px;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

.card-image-frame img {
  height: 100%;
  object-fit: contain;
  width: 100%;
}

.card-image-placeholder {
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
}

.card-name {
  font-size: 0.94rem;
  font-weight: 800;
  line-height: 1.2;
}

.card-tile strong {
  color: #93c5fd;
  font-size: 0.96rem;
  white-space: nowrap;
}

@media (max-width: 520px) {
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
