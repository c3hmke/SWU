export type ExternalListing = {
  externalId: string;
  productName: string;
  condition: string | null;
  priceNzd: number;
  quantity: number;
  productUrl: string;
  raw: unknown;
};
