export type WorkerEnv = {
  DB: D1Database;
  SELLER_SYNC_QUEUE: Queue<SellerSyncQueueMessage>;
  READ_RATE_LIMITER: RateLimit;
  IMAGE_RATE_LIMITER: RateLimit;
  CONTACT_RATE_LIMITER: RateLimit;
  SYNC_API_TOKEN: string;
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  CONTACT_EMAIL_FROM: string;
  CONTACT_EMAIL_TO: string;
  SITE_BASE_URL?: string;
};

export type SellerSyncQueueMessage = {
  sellerSlug: string;
};
