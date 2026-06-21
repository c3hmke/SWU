export type WorkerEnv = {
  DB: D1Database;
  READ_RATE_LIMITER: RateLimit;
  IMAGE_RATE_LIMITER: RateLimit;
  SYNC_API_TOKEN: string;
};
