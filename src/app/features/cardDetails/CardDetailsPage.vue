<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { CardDetailsDto } from '../../../shared/contracts/cards';
import AppPage from '../../components/AppPage.vue';
import CardImageFrame from '../../components/CardImageFrame.vue';
import ConsolePanel from '../../components/ConsolePanel.vue';
import { applyPageMetadata } from '../../metadata';
import CardListingTable from './CardListingTable.vue';
import { getCardDetails } from './useCardDetails';

const props = defineProps<{
  cardId: string;
}>();

const route = useRoute();
const router = useRouter();
const card = ref<CardDetailsDto | null>(null);
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const titleEl = ref<HTMLElement | null>(null);

const cardNameParts = computed(() => splitCardName(card.value?.name ?? ''));

const formatSetPosition = (card: CardDetailsDto) =>
  `${card.setName || card.setCode} ${card.collectorNumber}/${card.totalCards ?? '?'}`;

async function loadCard() {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    card.value = await getCardDetails(props.cardId);
    replaceCardPathWithCanonicalSlug(card.value);
    applyCardMetadata(card.value);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load card details';
  } finally {
    isLoading.value = false;
    await nextTick();
    fitCardTitle();
  }
}

function applyCardMetadata(card: CardDetailsDto) {
  const setLabel = card.setName || card.setCode;
  const lowestPrice = card.listings.length
    ? Math.min(...card.listings.map(listing => listing.priceNzd))
    : null;

  applyPageMetadata({
    title: `${card.name} | SWU Singles NZ`,
    description: lowestPrice === null
      ? `View ${card.name} from ${setLabel} in the SWU Singles NZ card database.`
      : `Compare current NZ listings for ${card.name} from ${setLabel}. Lowest listed price: ${formatPrice(lowestPrice)}.`,
    canonicalPath: `/cards/${card.slug}`,
    imageUrl: card.imageUrl,
    type: 'product'
  });
}

function replaceCardPathWithCanonicalSlug(card: CardDetailsDto) {
  if (route.name !== 'card-details' || props.cardId === card.slug) {
    return;
  }

  void router.replace({
    name: 'card-details',
    params: { id: card.slug },
    query: route.query,
    hash: route.hash
  });
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD'
  }).format(value);
}

function splitCardName(name: string): { title: string; subtitle: string | null } {
  const separator = ' - ';
  const separatorIndex = name.indexOf(separator);

  if (separatorIndex === -1) {
    return { title: name, subtitle: null };
  }

  return {
    title: name.slice(0, separatorIndex),
    subtitle: name.slice(separatorIndex + separator.length)
  };
}

function fitCardTitle() {
  window.requestAnimationFrame(() => {
    const element = titleEl.value;
    if (!element) return;

    let size = 2;
    const minimumSize = 1.12;
    element.style.fontSize = `${size}rem`;

    while (element.scrollWidth > element.clientWidth && size > minimumSize) {
      size -= 0.05;
      element.style.fontSize = `${size}rem`;
    }
  });
}

onMounted(() => {
  void loadCard();
  window.addEventListener('resize', fitCardTitle);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', fitCardTitle);
});

watch(() => props.cardId, loadCard);
</script>

<template>
  <p v-if="isLoading" class="muted">Loading card details...</p>
  <p v-else-if="errorMessage" class="error">{{ errorMessage }}</p>

  <AppPage v-else-if="card" size="narrow">
    <ConsolePanel variant="hero">
      <CardImageFrame class="hero-image" :image-url="card.imageUrl" :alt="card.name" variant="hero" />

      <div class="card-summary">
        <div class="summary-readout">
          <span class="card-id">::: Databank {{ card.id }} ::: </span>
          <span class="eyebrow">{{ formatSetPosition(card) }}</span>
        </div>
        <div class="card-name-block">
          <h1 ref="titleEl" class="card-title">{{ cardNameParts.title }}</h1>
          <div class="title-separator" :class="{ 'has-subtitle': cardNameParts.subtitle }" aria-hidden="true"></div>
          <p v-if="cardNameParts.subtitle" class="card-subtitle">{{ cardNameParts.subtitle }}</p>
        </div>
      </div>
    </ConsolePanel>

    <CardListingTable :listings="card.listings" />
  </AppPage>
</template>

<style scoped>
.card-summary {
  position: relative;
  z-index: 1;
  align-self: start;
  min-height: 220px;
  padding: clamp(12px, 2vw, 18px) clamp(8px, 2vw, 18px);
}

.summary-readout {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-id {
  color: #fbbf24;
  flex: 1 1 auto;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  min-width: 0;
  text-transform: uppercase;
}

.eyebrow {
  color: #7dd3fc;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-align: right;
  text-shadow: 0 0 18px rgba(14, 165, 233, 0.34);
  text-transform: uppercase;
  white-space: nowrap;
}

.eyebrow::before {
  content: '[';
  color: rgba(125, 211, 252, 0.62);
  margin-right: 6px;
}

.eyebrow::after {
  content: ']';
  color: rgba(125, 211, 252, 0.62);
  margin-left: 6px;
}

.card-name-block {
  display: grid;
  justify-items: center;
  margin: clamp(18px, 4vw, 16px) auto 0;
  max-width: 100%;
  text-align: center;
}

.card-title {
  color: #f8fafc;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: -0.045em;
  line-height: 1;
  margin: 0;
  max-width: 100%;
  overflow: visible;
  text-align: center;
  text-shadow:
    0 0 22px rgba(125, 211, 252, 0.18),
    0 12px 34px rgba(0, 0, 0, 0.34);
  white-space: nowrap;
}

.title-separator {
  align-items: center;
  display: grid;
  grid-template-columns: 1fr 22px 1fr;
  gap: 12px;
  margin: 8px 0 4px;
  width: min(360px, 86%);
}

.title-separator::before,
.title-separator::after {
  content: '';
  height: 1px;
}

.title-separator::before {
  background: linear-gradient(90deg, transparent, rgba(125, 211, 252, 0.34), rgba(248, 250, 252, 0.74));
  box-shadow: 0 0 14px rgba(14, 165, 233, 0.16);
  grid-column: 1;
}

.title-separator::after {
  background: linear-gradient(90deg, rgba(248, 250, 252, 0.74), rgba(125, 211, 252, 0.34), transparent);
  box-shadow: 0 0 14px rgba(14, 165, 233, 0.16);
  grid-column: 3;
}

.title-separator.has-subtitle {
  background: linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.86), transparent) center / 22px 2px no-repeat;
}

.card-subtitle {
  color: #cbd5e1;
  font-size: clamp(0.92rem, 1.6vw, 1rem);
  font-weight: 800;
  letter-spacing: 0.14em;
  line-height: 1.25;
  margin: 0;
  text-shadow: 0 0 16px rgba(14, 165, 233, 0.18);
  text-transform: uppercase;
}

@media (max-width: 800px) {
  .hero-image {
    max-width: 410px;
    width: 100%;
  }

  .summary-readout {
    align-items: start;
    display: grid;
  }

  .eyebrow {
    text-align: left;
  }
}
</style>
