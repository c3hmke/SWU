type SluggableCard = {
  id: string;
  name: string;
};

const cardIdPattern = /^[A-Z0-9]{2,5}\d{3,}$/;
const slugCardIdPattern = /(?:^|-)([A-Z0-9]{2,5}\d{3,})$/i;

export function createCardSlug(card: SluggableCard): string {
  const nameSlug = slugify(card.name);
  const cardId = card.id.toLowerCase();

  return nameSlug ? `${nameSlug}-${cardId}` : cardId;
}

export function resolveCardIdFromSlug(slugOrId: string): string {
  const normalized = slugOrId.trim();
  const slugMatch = normalized.match(slugCardIdPattern);

  if (slugMatch) {
    return slugMatch[1].toUpperCase();
  }

  return normalized.toUpperCase();
}

export function isLegacyCardId(slugOrId: string): boolean {
  return cardIdPattern.test(slugOrId.trim().toUpperCase());
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
