export type BingoLetter = 'B' | 'I' | 'N' | 'G' | 'O';

export type CellValue = number | 'FREE';

export interface BingoCell {
  value: CellValue;
  marked: boolean;
  isFreeSpace: boolean;
}

export interface BingoCard {
  id: string;
  grid: BingoCell[][]; // 5x5
  status: 'ACTIVE' | 'STANDBY' | 'WON';
  nearMissCount: number;
}

export type GamePhase = 'countdown' | 'playing' | 'finished';

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  drawSequence: number[];
  currentDrawIndex: number;
  drawnNumbers: Set<number>;
  cards: BingoCard[];
  winningCardIndex: number | null;
  nearMissStates: number[];
  seed: string;
  countdownValue: number;
}

export type GameAction =
  | { type: 'START_COUNTDOWN' }
  | { type: 'TICK_COUNTDOWN' }
  | { type: 'DEPLOY_CARDS'; cards: BingoCard[]; seed: string; sequence: number[] }
  | { type: 'DRAW_BALL' }
  | { type: 'MARK_CELL'; cardIndex: number; row: number; col: number }
  | { type: 'DECLARE_WIN'; cardIndex: number }
  | { type: 'RESET_GAME' }
  | { type: 'UPDATE_NEAR_MISS'; states: number[] };