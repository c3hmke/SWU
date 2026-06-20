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
const visibleCards = computed(() => (nameFilter.value.trim() ? cards.value : cards.value.slice(0, 12)));
const resultsLabel = computed(() => (nameFilter.value.trim() ? 'Search results' : 'High value signals'));
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

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
  <AppPage>
    <ConsolePanel variant="control" aria-label="Card search controls">
      <ConsoleLabel>Market scanner</ConsoleLabel>
      <label class="search-field">
        <div class="search-control">
          <input v-model="nameFilter" type="search" placeholder="Search by card name..." />
          <button v-if="nameFilter" type="button" @click="clearSearch">⬡</button>
        </div>
      </label>
    </ConsolePanel>

    <ConsolePanel aria-live="polite">
      <ConsoleHeader :label="resultsLabel" :meta="`${visibleCards.length.toString().padStart(2, '0')} targets`" />

      <p v-if="isLoading" class="muted screen-message">Loading cards...</p>
      <p v-else-if="errorMessage" class="error screen-message">{{ errorMessage }}</p>
      <p v-else-if="cards.length === 0" class="muted screen-message">No cards currently have listings.</p>

      <div v-else class="card-grid">
        <CardTile
          v-for="card in visibleCards"
          :key="card.id"
          :to="`/cards/${card.id}`"
          :name="card.name"
          :image-url="card.imageUrl"
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

.card-grid {
  display: grid;
  gap: clamp(14px, 1.8vw, 20px);
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

@media (max-width: 520px) {
  .card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
