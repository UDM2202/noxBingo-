export interface CardBundle {
  id: string;
  cardCount: number;
  priceOren: number;
  label: string;
}

// Must stay in sync with CARD_BUNDLES in server/src/RoomManager.ts —
// the server is the actual source of truth and re-validates every
// payment against its own copy, but the ids/prices/labels shown here
// need to match or players will pay one amount and see another.
export const CARD_BUNDLES: CardBundle[] = [
  { id: 'single', cardCount: 1, priceOren: 3, label: '1 Card' },
  { id: 'triple', cardCount: 3, priceOren: 5, label: '3 Cards' },
  { id: 'five', cardCount: 5, priceOren: 8, label: '5 Cards' },
];