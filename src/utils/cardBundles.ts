export interface CardBundle {
  id: string;
  cardCount: number;
  priceGBP: number;
  label: string;
}

// Must stay in sync with the DEFAULT_CONFIG bundles in
// server/src/gameConfig.ts — the server is the actual source of
// truth (and now, an admin can change these live from the dashboard),
// but these defaults matter for what's shown before a room's real
// config arrives from the server.
export const CARD_BUNDLES: CardBundle[] = [
  { id: 'single', cardCount: 1, priceGBP: 3.5, label: '1 Card' },
  { id: 'triple', cardCount: 3, priceGBP: 9, label: '3 Cards' },
  { id: 'five', cardCount: 5, priceGBP: 13, label: '5 Cards' },
];

// Default rates — real values should come from the room once
// connected (see room_created), these are just a fallback for the
// very first render before that arrives.
export const DEFAULT_OREN_TO_GBP_RATE = 1.5;
export const DEFAULT_GBP_TO_USDT_RATE = 1.27;

export function bundleOrenPrice(bundle: CardBundle, orenToGbpRate: number): number {
  return bundle.priceGBP / orenToGbpRate;
}

export function bundleUsdtPrice(bundle: CardBundle, gbpToUsdtRate: number): number {
  return bundle.priceGBP * gbpToUsdtRate;
}

export function bundleSolPrice(bundle: CardBundle, gbpToUsdtRate: number, solUsdPrice: number): number {
  return bundleUsdtPrice(bundle, gbpToUsdtRate) / solUsdPrice;
}