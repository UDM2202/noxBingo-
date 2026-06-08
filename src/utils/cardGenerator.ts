import type { BingoCard, BingoCell } from '../types/game';
import { SeededRandom } from './seededRandom';

const B_COL_MIN = 1;   const B_COL_MAX = 15;
const I_COL_MIN = 16;  const I_COL_MAX = 30;
const N_COL_MIN = 31;  const N_COL_MAX = 45;
const G_COL_MIN = 46;  const G_COL_MAX = 60;
const O_COL_MIN = 61;  const O_COL_MAX = 75;

function generateColumnNumbers(min: number, max: number, rng: SeededRandom): number[] {
  const numbers: number[] = [];
  for (let i = min; i <= max; i++) numbers.push(i);
  return rng.shuffle(numbers).slice(0, 5);
}

function generateCardGrid(rng: SeededRandom): BingoCell[][] {
  const bCol = generateColumnNumbers(B_COL_MIN, B_COL_MAX, rng);
  const iCol = generateColumnNumbers(I_COL_MIN, I_COL_MAX, rng);
  const nCol = generateColumnNumbers(N_COL_MIN, N_COL_MAX, rng);
  const gCol = generateColumnNumbers(G_COL_MIN, G_COL_MAX, rng);
  const oCol = generateColumnNumbers(O_COL_MIN, O_COL_MAX, rng);

  const grid: BingoCell[][] = [];

  for (let row = 0; row < 5; row++) {
    const rowCells: BingoCell[] = [];
    for (let col = 0; col < 5; col++) {
      const isFreeSpace = row === 2 && col === 2;
      let value: number | 'FREE';
      if (isFreeSpace) {
        value = 'FREE';
      } else if (col === 0) value = bCol[row];
      else if (col === 1) value = iCol[row];
      else if (col === 2) value = nCol[row];
      else if (col === 3) value = gCol[row];
      else value = oCol[row];

      rowCells.push({
        value,
        marked: isFreeSpace,
        isFreeSpace,
      });
    }
    grid.push(rowCells);
  }

  return grid;
}

function pickNoxCell(rng: SeededRandom): { row: number; col: number } {
  let row: number, col: number;
  do {
    row = Math.floor(rng.next() * 5);
    col = Math.floor(rng.next() * 5);
  } while (row === 2 && col === 2);
  return { row, col };
}

export function generateCards(seed: string): BingoCard[] {
  const rng = new SeededRandom(seed + '-cards');
  const cards: BingoCard[] = [];

  for (let i = 0; i < 3; i++) {
    cards.push({
      id: 'card-' + i + '-' + Date.now(),
      grid: generateCardGrid(rng),
      status: 'STANDBY',
      nearMissCount: 99,
      noxCell: pickNoxCell(rng),
      noxHit: false,
    });
  }

  return cards;
}

export function generateDrawSequence(seed: string): number[] {
  const rng = new SeededRandom(seed + '-draw');
  const balls = Array.from({ length: 75 }, (_, i) => i + 1);
  return rng.shuffle(balls);
}