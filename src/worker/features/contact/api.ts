import type { ContactRequestDto, ContactResponseDto } from '../../../shared/contracts/contact';
import type { WorkerEnv } from '../../env';
import { createJsonResponse } from '../../shared/http/createJsonResponse';

const maxNameLength = 120;
const maxEmailLength = 160;
const maxOrganisationLength = 160;
const maxMessageLength = 2000;

type TurnstileSiteVerifyResponse = {
  success: boolean;
  'error-codes'?: string[];
};

type ResendResponse = {
  id?: string;
  message?: string;
};

export async function contactRoutes(request: Request, env: WorkerEnv): Promise<Response> {
  if (request.method !== 'POST') {
    return createJsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  if (!hasContactConfig(env)) {
    return createJsonResponse({ error: 'Contact enquiries are not configured yet' }, 503, request);
  }

  let body: ContactRequestDto;

  try {
    body = await request.json();
  } catch {
    return createJsonResponse({ error: 'Invalid JSON body' }, 400, request);
  }

  const validatedBody = validateContactRequest(body);
  if (!validatedBody.valid) {
    return createJsonResponse({ error: validatedBody.error }, 400, request);
  }

  const turnstileResult = await verifyTurnstileToken(body.turnstileToken, request, env);
  if (!turnstileResult.success) {
    return createJsonResponse({ error: 'Verification failed. Please try again.' }, 400, request);
  }

  const emailResult = await sendContactEmail(validatedBody.value, env);
  if (!emailResult.success) {
    console.error('Contact enquiry email failed', emailResult.error);
    return createJsonResponse({ error: 'Unable to send contact enquiry right now' }, 502, request);
  }

  return createJsonResponse({ status: 'sent' } satisfies ContactResponseDto, 200, request);
}

function validateContactRequest(value: unknown):
  | { valid: true; value: Omit<ContactRequestDto, 'turnstileToken'> }
  | { valid: false; error: string } {
  if (!isRecord(value)) {
    return { valid: false, error: 'Invalid contact enquiry' };
  }

  const name = normalizeText(value.name);
  const email = normalizeText(value.email).toLowerCase();
  const organisation = normalizeText(value.organisation);
  const message = normalizeMessage(value.message);
  const turnstileToken = normalizeText(value.turnstileToken);

  if (!name || !email || !message || !turnstileToken) {
    return { valid: false, error: 'Name, email, message, and verification are required' };
  }

  if (name.length > maxNameLength || email.length > maxEmailLength || organisation.length > maxOrganisationLength) {
    return { valid: false, error: 'Contact enquiry details are too long' };
  }

  if (message.length > maxMessageLength) {
    return { valid: false, error: 'Contact enquiry message is too long' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: 'Enter a valid email address' };
  }

  return {
    valid: true,
    value: {
      name,
      email,
      organisation,
      message
    }
  };
}

async function verifyTurnstileToken(token: string, request: Request, env: WorkerEnv): Promise<{ success: boolean }> {
  const formData = new FormData();
  formData.append('secret', env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);

  const remoteIp = request.headers.get('cf-connecting-ip');
  if (remoteIp) {
    formData.append('remoteip', remoteIp);
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    return { success: false };
  }

  const result = await response.json() as TurnstileSiteVerifyResponse;
  return { success: result.success };
}

async function sendContactEmail(
  enquiry: Omit<ContactRequestDto, 'turnstileToken'>,
  env: WorkerEnv
): Promise<{ success: true } | { success: false; error: string }> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from: env.CONTACT_EMAIL_FROM,
      to: [env.CONTACT_EMAIL_TO],
      reply_to: enquiry.email,
      subject: `Contact enquiry from ${enquiry.name}`,
      text: createContactEmailText(enquiry)
    })
  });

  if (response.ok) {
    return { success: true };
  }

  const result = await response.json().catch(() => null) as ResendResponse | null;
  return { success: false, error: result?.message ?? `Resend returned ${response.status}` };
}

function createContactEmailText(enquiry: Omit<ContactRequestDto, 'turnstileToken'>): string {
  return [
    'New contact enquiry',
    '',
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Organisation: ${enquiry.organisation || 'Not supplied'}`,
    '',
    enquiry.message
  ].join('\n');
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function normalizeMessage(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\r\n/g, '\n').replace(/\n{4,}/g, '\n\n\n') : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasContactConfig(env: WorkerEnv): boolean {
  return Boolean(
    env.TURNSTILE_SECRET_KEY &&
    env.RESEND_API_KEY &&
    env.CONTACT_EMAIL_FROM &&
    env.CONTACT_EMAIL_TO
  );
}
