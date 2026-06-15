export type ImportCardSetResult = {
  setCode: string;
  swuId: number;
  setName: string;
  totalCards: number;
  cards: ImportCardResult[];
};

export type ImportCardResult = {
  id: string;
  collectorNumber: number;
  name: string;
};
