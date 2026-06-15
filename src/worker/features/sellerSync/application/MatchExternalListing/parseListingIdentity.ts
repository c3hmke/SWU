export type ParsedListingIdentity = {
  setName: string;
  collectorNumber: number;
};

export function parseListingIdentity(productName: string): ParsedListingIdentity | null {
  const match = productName.match(/\((\d+)(?:\/\d+)?\)\s*\[([^\]]+)\]/);

  if (!match) return null;

  return {
    collectorNumber: Number.parseInt(match[1], 10),
    setName: match[2].trim()
  };
}
