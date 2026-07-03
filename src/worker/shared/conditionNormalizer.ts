/**
 * Canonical condition codes:
 * NM = Near Mint
 * LP = Light Play
 * MP = Moderate Play
 * HP = Heavy Play
 * D = Damaged
 */

type CanonicalCondition = 'NM' | 'LP' | 'MP' | 'HP' | 'D';

const CONDITION_ALIASES: Record<string, CanonicalCondition> = {
  // Near Mint variants
  'near mint': 'NM',
  'nm': 'NM',
  'mint/near mint': 'NM',
  'mint - near mint': 'NM',
  'm/nm': 'NM',
  'raw-nm': 'NM',
  'raw-m': 'NM',

  // Light Play variants
  'light play': 'LP',
  'lightly played': 'LP',
  'lp': 'LP',
  'raw-lp': 'LP',

  // Moderate Play variants
  'moderate play': 'MP',
  'moderately played': 'MP',
  'mp': 'MP',
  'raw-mp': 'MP',

  // Heavy Play variants
  'heavy play': 'HP',
  'heavily played': 'HP',
  'hp': 'HP',
  'raw-hp': 'HP',

  // Damaged variants
  'damaged': 'D',
  'd': 'D',
  'raw-dmg': 'D',

  // Mint (treat as Near Mint if standalone)
  'mint': 'NM',
  'm': 'NM'
};

/**
 * Normalizes a raw condition string from any source to a canonical condition code.
 * Returns the canonical code (NM, LP, MP, HP, D) or null if condition cannot be determined.
 */
export function normalizeCondition(rawCondition: string | null | undefined): string | null {
  if (!rawCondition) {
    return null;
  }

  const normalized = rawCondition.trim().toLowerCase();

  // Direct lookup
  if (CONDITION_ALIASES[normalized]) {
    return CONDITION_ALIASES[normalized];
  }

  // Partial matching for variants with extra text
  for (const [alias, canonical] of Object.entries(CONDITION_ALIASES)) {
    if (normalized.includes(alias)) {
      return canonical;
    }
  }

  // If it's a variant name with no condition info, return null
  // (e.g., "foil", "prestige", "serialized")
  return null;
}
