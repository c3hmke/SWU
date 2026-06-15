import type { Seller } from '../domain/Seller';
import type { SellerRepository } from '../domain/SellerRepository';

type SellerRow = {
  id: string;
  name: string;
  slug: string;
  adapter_key: string;
  enabled: number;
};

export class D1SellerRepository implements SellerRepository {
  constructor(private readonly db: D1Database) {}

  async getBySlug(slug: string): Promise<Seller | null> {
    const row = await this.db
      .prepare('select id, name, slug, adapter_key, enabled from sellers where slug = ?1')
      .bind(slug)
      .first<SellerRow>();

    return row
      ? {
          id: row.id,
          name: row.name,
          slug: row.slug,
          adapterKey: row.adapter_key,
          enabled: row.enabled === 1
        }
      : null;
  }
}
