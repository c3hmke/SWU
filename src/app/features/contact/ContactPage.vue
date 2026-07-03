<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import ActionButton from '../../components/ActionButton.vue';
import AppPage from '../../components/AppPage.vue';
import ConsoleHeader from '../../components/ConsoleHeader.vue';
import ConsoleLabel from '../../components/ConsoleLabel.vue';
import ConsolePanel from '../../components/ConsolePanel.vue';
import { sendContact } from './useContact';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

type TurnstileRenderOptions = {
  sitekey: string;
  theme: 'dark' | 'light' | 'auto';
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
};

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const name = ref('');
const email = ref('');
const organisation = ref('');
const message = ref('');
const turnstileToken = ref('');
const isSending = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const turnstileElement = ref<HTMLElement | null>(null);
let widgetId: string | null = null;

const canSubmit = computed(() =>
  Boolean(
    name.value.trim() &&
    email.value.trim() &&
    message.value.trim() &&
    turnstileToken.value &&
    !isSending.value
  )
);

onMounted(async () => {
  if (!turnstileSiteKey) {
    errorMessage.value = 'Contact enquiries are not configured yet.';
    return;
  }

  await loadTurnstileScript();
  await nextTick();

  if (turnstileElement.value && window.turnstile) {
    widgetId = window.turnstile.render(turnstileElement.value, {
      sitekey: turnstileSiteKey,
      theme: 'dark',
      callback: token => {
        turnstileToken.value = token;
      },
      'expired-callback': () => {
        turnstileToken.value = '';
      },
      'error-callback': () => {
        turnstileToken.value = '';
        errorMessage.value = 'Verification failed. Please try again.';
      }
    });
  }
});

onBeforeUnmount(() => {
  if (widgetId && window.turnstile) {
    window.turnstile.remove(widgetId);
  }
});

async function handleSubmit() {
  if (!canSubmit.value) return;

  isSending.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    await sendContact({
      name: name.value.trim(),
      email: email.value.trim(),
      organisation: organisation.value.trim(),
      message: message.value.trim(),
      turnstileToken: turnstileToken.value
    });

    name.value = '';
    email.value = '';
    organisation.value = '';
    message.value = '';
    turnstileToken.value = '';
    successMessage.value = 'Thanks, your enquiry has been sent.';

    if (widgetId && window.turnstile) {
      window.turnstile.reset(widgetId);
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to send enquiry';

    if (widgetId && window.turnstile) {
      turnstileToken.value = '';
      window.turnstile.reset(widgetId);
    }
  } finally {
    isSending.value = false;
  }
}

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector<HTMLScriptElement>('script[data-turnstile-script]');
  if (existingScript) {
    return new Promise(resolve => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = 'true';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Unable to load verification')), { once: true });
    document.head.append(script);
  });
}
</script>

<template>
  <AppPage size="narrow">
    <ConsolePanel variant="control" aria-label="Contact enquiry">
      <ConsoleLabel>Enquiry Form</ConsoleLabel>
    </ConsolePanel>

    <ConsolePanel aria-live="polite">
      <form class="contact-form" @submit.prevent="handleSubmit">
        <div class="form-row two-column">
          <label>
            <span>Name *</span>
            <input v-model="name" type="text" autocomplete="name" maxlength="120" required />
          </label>

          <label>
            <span>Organisation</span>
            <input v-model="organisation" type="text" autocomplete="organization" maxlength="160" />
          </label>
        </div>

        <label>
          <span>Email *</span>
          <input v-model="email" type="email" autocomplete="email" maxlength="160" required />
        </label>

        <label>
          <span>Message *</span>
          <textarea v-model="message" rows="7" maxlength="2000" required></textarea>
        </label>

        <div class="form-row verification-row">
          <div ref="turnstileElement" class="turnstile-slot"></div>

          <div class="contact-form-actions">
            <ActionButton :disabled="!canSubmit" @click="handleSubmit">
              {{ isSending ? 'Sending...' : 'Send enquiry' }}
            </ActionButton>
          </div>
        </div>

        <p v-if="errorMessage" class="error screen-message">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success screen-message">{{ successMessage }}</p>
      </form>
    </ConsolePanel>
  </AppPage>
</template>

<style scoped>
.contact-form {
  display: grid;
  gap: 14px;
}

.form-row {
  display: grid;
  gap: 14px;
}

.two-column,
.verification-row {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.contact-form label {
  display: grid;
  gap: 7px;
}

.contact-form span {
  color: #bae6fd;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.contact-form input,
.contact-form textarea {
  background:
    linear-gradient(90deg, rgba(2, 6, 23, 0.92), rgba(8, 47, 73, 0.32)),
    rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(125, 211, 252, 0.32);
  border-radius: 0;
  box-sizing: border-box;
  color: #f8fafc;
  font: inherit;
  padding: 12px;
  width: 100%;
}

.contact-form textarea {
  resize: vertical;
}

.contact-form input:focus,
.contact-form textarea:focus {
  border-color: #fbbf24;
  outline: none;
}

.turnstile-slot {
  min-height: 65px;
}

.contact-form-actions {
  align-items: start;
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.success {
  color: #bbf7d0;
}

@media (max-width: 720px) {
  .two-column,
  .verification-row {
    grid-template-columns: 1fr;
  }

  .contact-form-actions {
    justify-content: flex-start;
  }
}
</style>
