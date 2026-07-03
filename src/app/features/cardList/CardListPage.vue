<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { CardListItemDto } from '../../../shared/contracts/cards';
import AppPage from '../../components/AppPage.vue';
import CardTile from '../../components/CardTile.vue';
import ConsoleHeader from '../../components/ConsoleHeader.vue';
import ConsoleLabel from '../../components/ConsoleLabel.vue';
import ConsolePanel from '../../components/ConsolePanel.vue';
import { listCards } from './useCardList';

const route = useRoute();
const router = useRouter();
const cards = ref<CardListItemDto[]>([]);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const nameFilter = ref(typeof route.query.name === 'string' ? route.query.name : '');
const minSearchCharacters = 2;
const highValuePageCount = 12;
const highValuePageSize = 12;
const searchPageSize = 50;
const highValuePage = ref(Math.max(1, Math.min(highValuePageCount, Number(route.query.page) || 1)));
const hasNameFilter = computed(() => Boolean(nameFilter.value.trim()));
const needsMoreSearchInput = computed(() => {
  const trimmedName = nameFilter.value.trim();
  return Boolean(trimmedName) && trimmedName.length < minSearchCharacters;
});
const visibleCards = computed(() => {
  return cards.value;
});
const resultsLabel = computed(() => (nameFilter.value.trim() ? 'Search results' : 'High value signals'));
const highValuePages = computed(() => Array.from({ length: highValuePageCount }, (_, index) => index + 1));
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
let cardListAbortController: AbortController | null = null;

async function loadCards() {
  const trimmedName = nameFilter.value.trim();

  if (trimmedName && trimmedName.length < minSearchCharacters) {
    cardListAbortController?.abort();
    cards.value = [];
    isLoading.value = false;
    errorMessage.value = null;
    return;
  }

  cardListAbortController?.abort();
  const abortController = new AbortController();
  cardListAbortController = abortController;
  isLoading.value = true;
  errorMessage.value = null;

  try {
    cards.value = await listCards({
      name: trimmedName,
      page: trimmedName ? 1 : highValuePage.value,
      pageSize: trimmedName ? searchPageSize : highValuePageSize,
      signal: abortController.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }

    errorMessage.value = error instanceof Error ? error.message : 'Unable to load cards';
  } finally {
    if (!abortController.signal.aborted) {
      isLoading.value = false;
    }
  }
}

onMounted(loadCards);

watch(() => route.query.page, (page) => {
  highValuePage.value = Math.max(1, Math.min(highValuePageCount, Number(page) || 1));

  if (!hasNameFilter.value) {
    void loadCards();
  }
});

watch(nameFilter, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  highValuePage.value = 1;

  searchTimeout = setTimeout(() => {
    const trimmedName = nameFilter.value.trim();
    void router.replace({
      query: {
        ...route.query,
        name: trimmedName || undefined,
        page: undefined
      }
    });

    void loadCards();
  }, 350);
});

function clearSearch() {
  nameFilter.value = '';
}

function selectHighValuePage(page: number) {
  void router.replace({
    query: {
      ...route.query,
      page: page > 1 ? String(page) : undefined
    }
  });
}

function adjustHighValuePage(delta: number) {
  const newPage = Math.min(highValuePageCount, Math.max(1, highValuePage.value + delta));
  void router.replace({
    query: {
      ...route.query,
      page: newPage > 1 ? String(newPage) : undefined
    }
  });
}
</script>

<template>
  <AppPage>
    <ConsolePanel variant="control" aria-label="Card search controls">
      <ConsoleLabel>Market scanner</ConsoleLabel>
      <div class="search-field">
        <div class="search-control">
          <input v-model="nameFilter" type="search" placeholder="Search by card name..." aria-label="Search by card name" />
          <button v-if="nameFilter" type="button" @click="clearSearch">⬡</button>
        </div>
      </div>
    </ConsolePanel>

    <ConsolePanel aria-live="polite">
      <ConsoleHeader :label="resultsLabel" :meta="hasNameFilter ? `${visibleCards.length.toString().padStart(2, '0')} targets` : undefined">
        <div class="page-controls" aria-label="High value signal pages">
          <button
            type="button"
            class="page-arrow"
            :disabled="highValuePage === 1"
            aria-label="Show previous high value page"
            @click="adjustHighValuePage(-1)"
          >‹</button>
          <button
            v-for="page in highValuePages"
            :key="page"
            type="button"
            class="page-dot"
            :class="{ active: page === highValuePage }"
            :aria-label="`Show high value page ${page}`"
            :aria-current="page === highValuePage ? 'page' : undefined"
            @click="selectHighValuePage(page)"
          ></button>
          <button
            type="button"
            class="page-arrow"
            :disabled="highValuePage === highValuePageCount"
            aria-label="Show next high value page"
            @click="adjustHighValuePage(1)"
          >›</button>
        </div>
      </ConsoleHeader>

      <p v-if="isLoading" class="muted screen-message">Loading cards...</p>
      <p v-else-if="errorMessage" class="error screen-message">{{ errorMessage }}</p>
      <p v-else-if="needsMoreSearchInput" class="muted screen-message">Enter at least {{ minSearchCharacters }} characters.</p>
      <p v-else-if="cards.length === 0" class="muted screen-message">No cards currently have listings.</p>

      <div v-else class="card-grid">
        <CardTile
          v-for="card in visibleCards"
          :key="card.id"
          :to="`/cards/${card.id}`"
          :name="card.name"
          :image-url="card.proxiedImageUrl ?? card.imageUrl"
          :thumbnail-image-url="card.thumbnailImageUrl"
          :price-nzd="card.lowestPriceNzd"
        />
      </div>
    </ConsolePanel>
  </AppPage>
</template>

<style scoped>
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

.screen-message {
  margin: 0;
}

.page-controls {
  align-items: center;
  display: flex;
  gap: 0;
}

.page-dot {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 0;
  cursor: pointer;
  display: inline-flex;
  height: 24px;
  justify-content: center;
  padding: 0;
  position: relative;
  width: 24px;
}

.page-dot::before {
  border: 1px solid rgba(125, 211, 252, 0.46);
  content: '';
  display: block;
  height: 12px;
  transition:
    background 140ms ease,
    border-color 140ms ease,
    filter 140ms ease,
    box-shadow 140ms ease;
  width: 12px;
}

.page-arrow {
  align-items: center;
  background: transparent;
  border: 0;
  color: #bae6fd;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 12px;
  font-weight: 900;
  height: 24px;
  justify-content: center;
  line-height: 12px;
  padding: 0;
  transition:
    border-color 140ms ease,
    color 140ms ease,
    opacity 140ms ease;
  width: 24px;
}

.page-dot:not(.active):hover::before,
.page-dot:not(.active):focus-visible::before {
  border-color: #fbbf24;
  box-shadow:
    0 0 10px rgba(251, 191, 36, 0.72),
    0 0 20px rgba(251, 191, 36, 0.28);
  filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.82));
}

.page-dot:focus-visible {
  outline: none;
}

.page-arrow:hover:not(:disabled),
.page-arrow:focus-visible {
  color: #fbbf24;
  filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.82));
  outline: none;
}

.page-arrow:disabled {
  opacity: 0.32;
}

.page-dot.active::before {
  background: transparent;
  border-color: #fbbf24;
  box-shadow:
    0 0 10px rgba(251, 191, 36, 0.72),
    0 0 20px rgba(251, 191, 36, 0.28);
  filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.82));
}

.card-grid {
  display: grid;
  gap: clamp(14px, 1.8vw, 20px);
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

@media (max-width: 520px) {
  .page-controls {
    flex-wrap: wrap;
  }

  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
