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
const resultsLabel = computed(() => (nameFilter.value.trim() ? 'Search results' : 'High value signals'));
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

    <section class="search-panel" aria-label="Card search controls">
      <div class="panel-label">Market scanner</div>
      <label class="search-field">
        <div class="search-control">
          <input v-model="nameFilter" type="search" placeholder="Search by card name..." />
          <button v-if="nameFilter" type="button" @click="clearSearch">⬡</button>
        </div>
      </label>
    </section>

    <section class="results-panel" aria-live="polite">
      <div class="screen-header">
        <span>{{ resultsLabel }}</span>
        <span>{{ visibleCards.length.toString().padStart(2, '0') }} targets</span>
      </div>

      <p v-if="isLoading" class="muted screen-message">Loading cards...</p>
      <p v-else-if="errorMessage" class="error screen-message">{{ errorMessage }}</p>
      <p v-else-if="cards.length === 0" class="muted screen-message">No cards currently have listings.</p>

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
  </section>
</template>

<style scoped>
.card-list-page {
  display: grid;
  gap: 12px;
  margin: 0 auto;
  max-width: 1120px;
}

.list-header h1,
.list-header p {
  margin: 0;
}

.list-header h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
  letter-spacing: -0.04em;
  line-height: 1;
}

.search-panel,
.results-panel {
  position: relative;
  border: 1px solid rgba(125, 211, 252, 0.28);
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.86) inset,
    0 18px 80px rgba(0, 0, 0, 0.26),
    0 0 42px rgba(14, 165, 233, 0.08);
  clip-path: polygon(0 16px, 16px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%);
}

.search-panel::before,
.results-panel::before,
.results-panel::after {
  content: '';
  position: absolute;
  pointer-events: none;
}

.search-panel::before,
.results-panel::before {
  inset: 0;
  background:
    linear-gradient(rgba(125, 211, 252, 0.04) 50%, transparent 50%) 0 0 / 100% 6px,
    linear-gradient(90deg, rgba(125, 211, 252, 0.08), transparent 18%, transparent 82%, rgba(251, 191, 36, 0.08));
  mix-blend-mode: screen;
  opacity: 0.42;
}

.search-panel::after,
.results-panel::after {
  border-bottom: 2px solid rgba(251, 191, 36, 0.74);
  border-left: 2px solid rgba(251, 191, 36, 0.74);
  bottom: 10px;
  content: '';
  height: 18px;
  left: 10px;
  position: absolute;
  width: 18px;
}

.search-panel {
  background:
    radial-gradient(circle at 8% 0, rgba(14, 165, 233, 0.2), transparent 34%),
    linear-gradient(135deg, rgba(8, 13, 26, 0.96), rgba(15, 23, 42, 0.82));
  display: grid;
  gap: 12px;
  padding: 18px clamp(16px, 3vw, 26px) 20px;
}

.panel-label,
.screen-header {
  color: #fbbf24;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.panel-label::before {
  content: '//// ';
  color: #38bdf8;
}

.search-field {
  display: grid;
  gap: 8px;
}

.search-field span {
  color: #bae6fd;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.search-control {
  align-items: center;
  background:
    linear-gradient(90deg, rgba(2, 6, 23, 0.92), rgba(8, 47, 73, 0.4)),
    rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(125, 211, 252, 0.32);
  border-radius: 0;
  box-shadow: 0 0 20px rgba(14, 165, 233, 0.08) inset;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
  display: flex;
}

.search-control:focus-within {
  border-color: #fbbf24;
  box-shadow:
    0 0 20px rgba(251, 191, 36, 0.11),
    0 0 24px rgba(14, 165, 233, 0.14) inset;
}

.search-field input {
  background: transparent;
  border: 0;
  color: #f5f7fb;
  flex: 1;
  font: inherit;
  font-weight: 700;
  padding: 13px 15px;
  min-width: 0;
}

.search-field input:focus {
  outline: none;
}

.search-control button {
  background: rgba(251, 191, 36, 0.13);
  border: 1px solid rgba(251, 191, 36, 0.34);
  border-radius: 0;
  color: #fde68a;
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 800;
  margin-right: 6px;
  padding: 7px 10px;
}

.search-control button:hover {
  background: rgba(251, 191, 36, 0.22);
}

.results-panel {
  background:
    radial-gradient(circle at 50% -10%, rgba(59, 130, 246, 0.16), transparent 34%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.78));
  display: grid;
  gap: 18px;
  padding: clamp(16px, 2.6vw, 28px);
}

.screen-header {
  align-items: center;
  border-bottom: 1px solid rgba(125, 211, 252, 0.2);
  display: flex;
  justify-content: space-between;
  padding-bottom: 12px;
}

.screen-header span:last-child {
  color: #7dd3fc;
}

.screen-message {
  margin: 0;
}

.card-grid {
  display: grid;
  gap: clamp(14px, 1.8vw, 20px);
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

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

.card-image-frame {
  align-items: center;
  aspect-ratio: 5 / 7;
  background:
    radial-gradient(circle at 50% 20%, rgba(148, 163, 184, 0.18), transparent 52%),
    rgba(2, 6, 23, 0.72);
  border: 1px solid rgba(125, 211, 252, 0.12);
  border-radius: 0;
  box-shadow: 0 0 30px rgba(15, 23, 42, 0.7) inset;
  clip-path: polygon(0 8px, 8px 0, 100% 0, 100% 100%, 0 100%);
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
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.card-tile strong {
  color: #fbbf24;
  font-size: 0.96rem;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

@media (max-width: 520px) {
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
