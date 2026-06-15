import type { CardSetImport } from '../../domain/CardSetImport';

export function validateCardSetImport(value: unknown): CardSetImport {
  if (!isRecord(value)) {
    throw new Error('Card set import must be an object.');
  }

  const code = readRequiredString(value, 'code').toUpperCase();
  const swuId = readRequiredInteger(value, 'swuId');
  const name = readRequiredString(value, 'name');
  const totalCards = readRequiredInteger(value, 'totalCards');
  const cardsValue = value.cards;

  if (!/^[A-Z0-9]{2,5}$/.test(code)) {
    throw new Error('Set code must be 2-5 uppercase letters/numbers, e.g. SOR or LAWP.');
  }

  if (!Array.isArray(cardsValue) || cardsValue.length === 0) {
    throw new Error('cards must be a non-empty array.');
  }

  const seenCollectorNumbers = new Set<number>();
  const cards = cardsValue.map((cardValue, index) => {
    if (!isRecord(cardValue)) {
      throw new Error(`cards[${index}] must be an object.`);
    }

    const collectorNumber = readRequiredInteger(cardValue, 'collectorNumber');

    if (collectorNumber < 1) {
      throw new Error(`cards[${index}].collectorNumber must be greater than 0.`);
    }

    if (seenCollectorNumbers.has(collectorNumber)) {
      throw new Error(`Duplicate collector number ${collectorNumber}.`);
    }

    seenCollectorNumbers.add(collectorNumber);

    return {
      collectorNumber,
      name: readRequiredString(cardValue, 'name'),
      imageUrl: readOptionalString(cardValue, 'imageUrl')
    };
  });

  return { code, swuId, name, totalCards, cards };
}

function readRequiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${key} must be a non-empty string.`);
  }

  return value.trim();
}

function readOptionalString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string when provided.`);
  }

  return value.trim() || null;
}

function readRequiredInteger(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (!Number.isInteger(value)) {
    throw new Error(`${key} must be an integer.`);
  }

  return value as number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
