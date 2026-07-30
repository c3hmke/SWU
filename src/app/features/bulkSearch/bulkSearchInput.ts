import type { BulkCardSearchRequestCardDto } from '../../../shared/contracts/cards';

export const bulkSearchInputStorageKey = 'bulk-search-input';

export function readBulkSearchInput(): string {
  return sessionStorage.getItem(bulkSearchInputStorageKey) ?? '';
}

export function writeBulkSearchInput(value: string): void {
  if (value) {
    sessionStorage.setItem(bulkSearchInputStorageKey, value);
  } else {
    sessionStorage.removeItem(bulkSearchInputStorageKey);
  }
}

export function parseBulkSearchInput(value: string): BulkCardSearchRequestCardDto[] {
  const cards = new Map<string, BulkCardSearchRequestCardDto>();

  for (const line of value.split(/\r?\n|;/)) {
    const item = parseCardListLine(line);
    if (!item) continue;

    const key = normalizeCardName(item.name);
    const existing = cards.get(key);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cards.set(key, item);
    }
  }

  return [...cards.values()];
}

export function getBulkSearchQuantities(value: string): Map<string, number> {
  return new Map(parseBulkSearchInput(value).map(card => [normalizeCardName(card.name), card.quantity]));
}

export function adjustBulkSearchCardQuantity(value: string, name: string, delta: number): string {
  const cards = parseBulkSearchInput(value);
  const normalizedName = normalizeCardName(name);
  const existing = cards.find(card => normalizeCardName(card.name) === normalizedName);

  if (existing) {
    existing.quantity = Math.max(0, existing.quantity + delta);
  } else if (delta > 0) {
    cards.push({ name, quantity: delta });
  }

  return cards
    .filter(card => card.quantity > 0)
    .map(card => `${card.quantity}x ${card.name}`)
    .join('\n');
}

export function normalizeCardName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').replace(/\s*\|\s*/g, ' - ').toLowerCase();
}

function parseCardListLine(line: string): BulkCardSearchRequestCardDto | null {
  const cleanLine = line
    .replace(/^\s*(?:[-*]|\d+[.)])\s*/, '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*/g, ' - ');

  if (!cleanLine) {
    return null;
  }

  const trailingQuantityMatch = cleanLine.match(/^(.+\S)\s+x(\d+)$/i);
  if (trailingQuantityMatch) {
    const quantity = parseQuantityToken(`x${trailingQuantityMatch[2]}`);
    if (quantity) {
      return { name: trailingQuantityMatch[1], quantity };
    }
  }

  const firstSpaceIndex = cleanLine.indexOf(' ');
  if (firstSpaceIndex === -1) {
    return { name: cleanLine, quantity: 1 };
  }

  const maybeQuantity = cleanLine.slice(0, firstSpaceIndex);
  const quantity = parseQuantityToken(maybeQuantity);

  if (!quantity) {
    return { name: cleanLine, quantity: 1 };
  }

  const name = cleanLine.slice(firstSpaceIndex + 1).trim();
  return name ? { name, quantity } : null;
}

function parseQuantityToken(token: string): number | null {
  const match = token.match(/^(?:x(\d+)|(\d+)x?)$/i);
  if (!match) return null;

  const quantity = Number.parseInt(match[1] ?? match[2], 10);
  return quantity > 0 ? quantity : null;
}
