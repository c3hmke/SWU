export type CardSetImport = {
  code: string;
  swuId: number;
  name: string;
  totalCards: number;
  cards: CardImport[];
};

export type CardImport = {
  collectorNumber: number;
  name: string;
  imageUrl: string | null;
  variantOf: number | null;
};

export type PreparedCardSetImport = {
  setCode: string;
  swuId: number;
  setName: string;
  totalCards: number;
  cards: PreparedCardImport[];
};

export type PreparedCardImport = {
  id: string;
  collectorNumber: number;
  name: string;
  variantOf: string | null;
};
