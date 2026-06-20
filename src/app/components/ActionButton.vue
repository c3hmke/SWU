<script setup lang="ts">
withDefaults(defineProps<{
  href?: string | null;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'unavailable';
}>(), {
  href: null,
  disabled: false,
  variant: 'primary'
});
</script>

<template>
  <a v-if="href && !disabled" class="action-button" :class="`variant-${variant}`" :href="href" target="_blank" rel="noreferrer">
    <slot />
  </a>
  <button v-else class="action-button" :class="`variant-${disabled ? 'unavailable' : variant}`" :disabled="disabled" type="button">
    <slot />
  </button>
</template>

<style scoped>
.action-button {
  border-radius: 0;
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  padding: 10px 14px;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
}

.variant-primary {
  background: rgba(251, 191, 36, 0.16);
  border: 1px solid rgba(251, 191, 36, 0.48);
  color: #fde68a;
}

.variant-primary:hover {
  background: rgba(251, 191, 36, 0.22);
  border-color: rgba(251, 191, 36, 0.64);
}

.variant-secondary {
  background: rgba(14, 165, 233, 0.1);
  border: 1px solid rgba(125, 211, 252, 0.3);
  color: #bae6fd;
}

.variant-unavailable {
  background: rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: #94a3b8;
  cursor: not-allowed;
}

.action-button:disabled {
  cursor: wait;
  opacity: 0.64;
}
</style>
