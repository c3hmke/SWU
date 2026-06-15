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
};
