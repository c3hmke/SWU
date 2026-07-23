import type { ExternalListing, Seller, SellerAdapter, SyncCard } from '../model';

const BASE_URL = 'https://rogueops.nz';
const MAX_PAGES = 50;

type SetNamesByCode = Map<string, string>;

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

  async fetchListings(_seller: Seller, cards: SyncCard[]): Promise<ExternalListing[]> {
    const listings: ExternalListing[] = [];
    const setNamesByCode = createSetNamesByCode(cards);

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const html = await fetchCatalogPage(page);
      const tiles = parseCatalogTiles(html, setNamesByCode);

      if (tiles.length === 0) {
        if (page === 1 && isUnexpectedEmptyCatalogPage(html)) {
          throw new Error('Rogue Ops catalog parser found no listings on a non-empty catalog page');
        }

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

function createSetNamesByCode(cards: SyncCard[]): SetNamesByCode {
  return new Map(cards.map(card => [card.setCode, card.setName]));
}

function parseCatalogTiles(html: string, setNamesByCode: SetNamesByCode): RogueOpsTile[] {
  const tiles: RogueOpsTile[] = [];
  const tilePattern = /<div class="card-tile"([\s\S]*?)(?=<div class="card-tile"|<\/div>\s*<\/div>\s*<\/section>|<div class="pagination-bar"|<\/section>\s*<!-- Image enlarge modal -->)/g;
  let match: RegExpExecArray | null;

  while ((match = tilePattern.exec(html))) {
    const tile = parseCatalogTile(match[0], match[1], setNamesByCode);

    if (tile) {
      tiles.push(tile);
    }
  }

  return tiles.length > 0 ? tiles : parseCurrentCatalogTiles(html, setNamesByCode);
}

function parseCatalogTile(tileHtml: string, attributes: string, setNamesByCode: SetNamesByCode): RogueOpsTile | null {
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
    setName: parseSetName(meta, setCode, setNamesByCode),
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
    condition: 'NM',
    priceNzd: tile.priceNzd,
    quantity: tile.quantity,
    productUrl: `${BASE_URL}/cards?q=${encodeURIComponent(tile.cardName)}&instock=1`,
    raw: tile
  };
}

function hasNextPage(html: string): boolean {
  return /class="page-nav-btn"[^>]*>Next/.test(html)
    || /class="page-nav-btn"[^>]*>Next\s*(?:&rarr;|→)/.test(html)
    || /<a\b[^>]*[?&]page=\d+[^>]*>\s*Next\s*(?:&rarr;|→)?/i.test(html);
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

function parseCurrentCatalogTiles(html: string, setNamesByCode: SetNamesByCode): RogueOpsTile[] {
  const tiles: RogueOpsTile[] = [];
  const imagePattern = /<img\b[^>]*\balt=(["'])([^"']*(?:—|&mdash;)[^"']*)\1[^>]*>/gi;
  const matches = [...html.matchAll(imagePattern)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const altText = decodeHtml(match[2]).trim();
    const alt = parseImageAlt(altText);

    if (!alt) {
      continue;
    }

    const segmentStart = match.index ?? 0;
    const segmentEnd = matches[index + 1]?.index ?? html.length;
    const segment = html.slice(segmentStart, segmentEnd);
    const text = htmlToText(segment);
    const meta = parseCurrentMeta(text, alt.cardName, alt.setCode, setNamesByCode);
    const price = parsePrice(text);
    const quantity = parseCurrentQuantity(text) || parseQuantity(segment);

    if (!meta || price === null || quantity <= 0) {
      continue;
    }

    tiles.push({
      cardId: getCurrentCardId(segment, alt.cardName, alt.setCode, meta.collectorNumber, alt.variant),
      cardName: alt.cardName,
      setCode: alt.setCode,
      setName: meta.setName,
      collectorNumber: meta.collectorNumber,
      rarity: parseCurrentRarity(text, meta.setName, meta.collectorNumber) || null,
      variant: alt.variant,
      priceNzd: price,
      quantity
    });
  }

  return tiles;
}

function parseImageAlt(value: string): { cardName: string; setCode: string; variant: string | null } | null {
  const match = value.match(/^(?:Image:\s*)?(.*?)\s+(?:—|&mdash;)\s+([A-Z0-9]+)\s+(.+)$/);

  if (!match) {
    return null;
  }

  return {
    cardName: match[1].trim(),
    setCode: match[2].trim(),
    variant: match[3].trim() || null
  };
}

function parseCurrentMeta(
  text: string,
  cardName: string,
  setCode: string,
  setNamesByCode: SetNamesByCode
): { setName: string; collectorNumber: number } | null {
  const afterName = text.slice(Math.max(0, text.indexOf(cardName) + cardName.length));
  const knownSetName = setNamesByCode.get(setCode);
  const match = knownSetName
    ? afterName.match(new RegExp(`\\b(${escapeRegExp(knownSetName)})\\s+#(\\d+)\\b`))
    : afterName.match(/\b([^#$]+?)\s+#(\d+)\b/);

  if (!match) {
    return null;
  }

  return {
    setName: knownSetName ?? match[1].trim(),
    collectorNumber: Number.parseInt(match[2], 10)
  };
}

function parseCurrentRarity(text: string, setName: string, collectorNumber: number): string {
  const match = text.match(new RegExp(`${escapeRegExp(setName)}\\s+#${collectorNumber}\\s+([^$]+?)\\s+\\$`));
  return match?.[1]?.trim() ?? '';
}

function parseCurrentQuantity(text: string): number {
  const lowStock = text.match(/Only\s+(\d+)\s+left/i);

  if (lowStock) {
    return Number.parseInt(lowStock[1], 10);
  }

  return /(?:\b|✓\s*)6\+\s+in stock/i.test(text) ? 6 : 0;
}

function getCurrentCardId(segment: string, cardName: string, setCode: string, collectorNumber: number, variant: string | null): string {
  return getInputValue(segment, 'card_id')
    || getAttribute(segment, 'data-card-id')
    || `${setCode}-${collectorNumber}-${variant || 'Normal'}-${cardName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isUnexpectedEmptyCatalogPage(html: string): boolean {
  const text = htmlToText(html);

  return /Just a moment/i.test(text)
    || /Rogue Ops Singles/i.test(text) && /\b\d+\s+cards?\s+\(filtered\)/i.test(text);
}

function parseCollectorNumber(meta: string): number | null {
  const match = meta.match(/#(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseSetName(meta: string, setCode: string, setNamesByCode: SetNamesByCode): string {
  const match = meta.match(/^(.*?)\s+#\d+/);
  return match?.[1]?.trim() || setNamesByCode.get(setCode) || setCode;
}



function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

function htmlToText(value: string): string {
  return decodeHtml(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
