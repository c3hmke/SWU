export type WorkerEnv = {
  DB: D1Database;
  SELLER_SYNC_QUEUE: Queue<SellerSyncQueueMessage>;
  READ_RATE_LIMITER: RateLimit;
  IMAGE_RATE_LIMITER: RateLimit;
  SYNC_API_TOKEN: string;
};

export type SellerSyncQueueMessage = {
  sellerSlug: string;
};
