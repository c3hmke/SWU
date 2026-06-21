import type { ExternalListing, Seller, SellerAdapter, SyncCard } from '../model';

const BASE_URL = 'https://rogueops.nz';
const MAX_PAGES = 50;

const setNamesByCode: Record<string, string> = {
  JTL: 'Jump to Lightspeed',
  LAW: 'A Lawless Time',
  LOF: 'Legends of the Force',
  SEC: 'Secrets of Power',
  SOR: 'Spark of Rebellion',
  SHD: 'Shadows of the Galaxy',
  TWI: 'Twilight of the Republic'
};

type RogueOpsTile = {
  cardId: string;
  cardName: string;
  setCode: string;
  setName: string;
  collectorNumber: number;
  rarity: string | null;
  variant: string | null;
  priceNzd: number;
  quantity: number;
};

export class RogueOpsAdapter implements SellerAdapter {
  readonly key = 'rogueops-custom';

  async fetchListings(_seller: Seller, _cards: SyncCard[]): Promise<ExternalListing[]> {
    const listings: ExternalListing[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const html = await fetchCatalogPage(page);
      const tiles = parseCatalogTiles(html);

      if (tiles.length === 0) {
        break;
      }

      listings.push(...tiles.map(mapTileToListing));

      if (!hasNextPage(html)) {
        break;
      }
    }

    return listings;
  }
}

async function fetchCatalogPage(page: number): Promise<string> {
  const url = new URL('/cards', BASE_URL);
  url.searchParams.set('instock', '1');

  if (page > 1) {
    url.searchParams.set('page', String(page));
  }

  const response = await fetch(url.toString(), {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-NZ,en;q=0.9',
      'user-agent': 'SWU Singles NZ inventory sync (+https://swu-singles-nz.pages.dev)'
    }
  });

  if (!response.ok) {
    throw new Error(`Rogue Ops catalog request failed with status ${response.status}`);
  }

  return response.text();
}

function parseCatalogTiles(html: string): RogueOpsTile[] {
  const tiles: RogueOpsTile[] = [];
  const tilePattern = /<div class="card-tile"([\s\S]*?)(?=<div class="card-tile"|<\/div>\s*<\/div>\s*<\/section>|<div class="pagination-bar"|<\/section>\s*<!-- Image enlarge modal -->)/g;
  let match: RegExpExecArray | null;

  while ((match = tilePattern.exec(html))) {
    const tile = parseCatalogTile(match[0], match[1]);

    if (tile) {
      tiles.push(tile);
    }
  }

  return tiles;
}

function parseCatalogTile(tileHtml: string, attributes: string): RogueOpsTile | null {
  const setCode = getAttribute(attributes, 'data-set-code');
  const cardId = getInputValue(tileHtml, 'card_id');
  const name = getText(tileHtml, 'card-tile-name');
  const meta = getText(tileHtml, 'card-tile-meta');
  const price = parsePrice(getText(tileHtml, 'card-tile-price'));
  const quantity = parseQuantity(tileHtml);
  const collectorNumber = parseCollectorNumber(meta);

  if (!setCode || !cardId || !name || !collectorNumber || price === null || quantity <= 0) {
    return null;
  }

  return {
    cardId,
    cardName: name,
    setCode,
    setName: parseSetName(meta, setCode),
    collectorNumber,
    rarity: getText(tileHtml, 'rarity-pill') || null,
    variant: getAttribute(attributes, 'data-variant'),
    priceNzd: price,
    quantity
  };
}

function mapTileToListing(tile: RogueOpsTile): ExternalListing {
  return {
    externalId: tile.cardId,
    productName: `${tile.cardName} (${tile.collectorNumber}) [${tile.setName}]`,
    condition: formatVariant(tile.variant),
    priceNzd: tile.priceNzd,
    quantity: tile.quantity,
    productUrl: `${BASE_URL}/cards?q=${encodeURIComponent(tile.cardName)}&instock=1`,
    raw: tile
  };
}

function hasNextPage(html: string): boolean {
  return /class="page-nav-btn"[^>]*>Next/.test(html) || /class="page-nav-btn"[^>]*>Next\s*&rarr;/.test(html);
}

function getAttribute(attributes: string, name: string): string | null {
  const match = attributes.match(new RegExp(`${name}="([^"]*)"`));
  return match ? decodeHtml(match[1]).trim() : null;
}

function getInputValue(html: string, name: string): string | null {
  const match = html.match(new RegExp(`<input[^>]+name="${name}"[^>]+value="([^"]+)"`, 'i'));
  return match ? decodeHtml(match[1]).trim() : null;
}

function getText(html: string, className: string): string {
  const match = html.match(new RegExp(`<[^>]+class="[^"]*${className}[^"]*"[^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i'));
  return match ? decodeHtml(stripTags(match[1])).trim() : '';
}

function parsePrice(value: string): number | null {
  const match = value.match(/\$([\d.]+)/);
  return match ? Number.parseFloat(match[1]) : null;
}

function parseQuantity(html: string): number {
  const max = html.match(/<input[^>]+name="qty"[^>]+max="(\d+)"/i);

  if (max) {
    return Number.parseInt(max[1], 10);
  }

  const stock = getText(html, 'stock-badge');
  const lowStock = stock.match(/Only\s+(\d+)\s+left/i);

  if (lowStock) {
    return Number.parseInt(lowStock[1], 10);
  }

  return /in stock/i.test(stock) ? 6 : 0;
}

function parseCollectorNumber(meta: string): number | null {
  const match = meta.match(/#(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseSetName(meta: string, setCode: string): string {
  const match = meta.match(/^(.*?)\s+#\d+/);
  return match?.[1]?.trim() || setNamesByCode[setCode] || setCode;
}

function formatVariant(variant: string | null): string | null {
  if (!variant || variant === 'normal') {
    return null;
  }

  return variant
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&rarr;/g, '->')
    .replace(/&larr;/g, '<-')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number.parseInt(code, 10)));
}
