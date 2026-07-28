<script setup lang="ts">
import { onMounted, ref } from 'vue';

const shopifyNoticeStorageKey = 'shopify-quantity-notice-v2-dismissed';
const showShopifyNotice = ref(false);

onMounted(() => {
  showShopifyNotice.value = localStorage.getItem(shopifyNoticeStorageKey) !== 'true';
});

function dismissShopifyNotice() {
  showShopifyNotice.value = false;
  localStorage.setItem(shopifyNoticeStorageKey, 'true');
}
</script>

<template>
  <div class="app-shell" spellcheck="false">
    <header class="site-header">
      <RouterLink to="/cards" class="brand" aria-label="Star Wars: Unlimited Singles NZ">
        <span class="brand-primary">Star Wars: Unlimited</span>
        <span class="brand-secondary">Singles NZ</span>
      </RouterLink>
      <nav class="site-nav" aria-label="Primary navigation">
        <RouterLink to="/cards">Cards</RouterLink>
        <RouterLink to="/bulk-search">Bulk lookup</RouterLink>
        <RouterLink to="/contact">Contact</RouterLink>
      </nav>
    </header>

    <aside class="sponsor-rail" aria-label="Sponsor message">
      <RouterLink class="sponsor-card" to="/contact">
        <span class="sponsor-controls" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
        <span class="sponsor-screen">
          <span class="sponsor-eyebrow">Sponsor</span>
          <span class="sponsor-title">Support SWU Singles NZ</span>
          <span class="sponsor-copy">This quiet spot helps cover hosting and data costs.</span>
          <span class="sponsor-action">Interested?</span>
        </span>
      </RouterLink>
      <a
        class="coffee-link"
        href="https://buymeacoffee.com/c3hmke"
        target="_blank"
        rel="noopener noreferrer"
      >
        Buy me a coffee?
      </a>
    </aside>

    <main>
      <aside v-if="showShopifyNotice" class="site-notice" role="status">
        <div>
          <strong>Shopify stock quantity notice</strong>
          <p>
            Due to recent Shopify changes, card quantities from Shopify stores may not be tracked accurately.
            We’re working on a solution.
          </p>
        </div>
        <button type="button" aria-label="Dismiss Shopify stock quantity notice" @click="dismissShopifyNotice">
          &times;
        </button>
      </aside>
      <RouterView />
    </main>
  </div>
</template>
