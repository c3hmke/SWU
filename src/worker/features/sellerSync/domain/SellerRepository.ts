import type { Seller } from './Seller';

export interface SellerRepository {
  getBySlug(slug: string): Promise<Seller | null>;
}
