import type { ImportCardSetCommand } from './ImportCardSetCommand';
import type { ImportCardSetResult } from './ImportCardSetResult';
import { createCardId } from './createCardId';

export function prepareCardSetImport(command: ImportCardSetCommand): ImportCardSetResult {
  return {
    setCode: command.cardSet.code,
    swuId: command.cardSet.swuId,
    setName: command.cardSet.name,
    totalCards: command.cardSet.totalCards,
    cards: command.cardSet.cards.map(card => ({
      id: createCardId(command.cardSet.code, card.collectorNumber),
      collectorNumber: card.collectorNumber,
      name: card.name
    }))
  };
}
