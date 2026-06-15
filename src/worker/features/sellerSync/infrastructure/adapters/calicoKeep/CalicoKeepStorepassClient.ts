import type { StorepassListResponse } from './calicoKeepTypes';

const STOREPASS_STORE_ID = 'MInamaYs3W';
const PRODUCT_LINE = 'Star Wars Unlimited';

export class CalicoKeepStorepassClient {
  async searchCards(cards: { name: string }[]): Promise<StorepassListResponse> {
    const response = await fetch(
      `https://store.storepass.co/saas/list?product_line=${encodeURIComponent(PRODUCT_LINE)}&store_id=${STOREPASS_STORE_ID}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(cards.map(card => ({ name: card.name, quantity: 1 })))
      }
    );

    if (!response.ok) {
      throw new Error(`Calico Keep Storepass request failed with status ${response.status}`);
    }

    return response.json();
  }
}
