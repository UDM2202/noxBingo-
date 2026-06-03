import type { BingoCard } from '../types/game';

/**
 * Get the BINGO letter for a number (1-75)
 */
export function getLetterForNumber(num: number): 'B' | 'I' | 'N' | 'G' | 'O' {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  return 'O';
}

/**
 * Calculate near-miss count for a single card
 * Returns minimum number of cells away from winning across all rows and columns
 * 0 = already won, 1 = one away (near miss), 2+ = normal
 */
export function getNearMissCount(card: BingoCard): number {
  let minMissing = Infinity;

  // Check all rows
  for (let row = 0; row < 5; row++) {
    let missing = 0;
    for (let col = 0; col < 5; col++) {
      const cell = card.grid[row][col];
      if (!cell.marked) {
        if (cell.value === 'FREE') continue;
        missing++;
      }
    }
    minMissing = Math.min(minMissing, missing);
  }

  // Check all columns
  for (let col = 0; col < 5; col++) {
    let missing = 0;
    for (let row = 0; row < 5; row++) {
      const cell = card.grid[row][col];
      if (!cell.marked) {
        if (cell.value === 'FREE') continue;
        missing++;
      }
    }
    minMissing = Math.min(minMissing, missing);
  }

  return minMissing;
}

/**
 * Check if any card has won (completed row or column)
 * Returns winning card index or null
 */
export function checkForWin(cards: BingoCard[]): number | null {
  for (let i = 0; i < cards.length; i++) {
    if (hasWinningLine(cards[i])) {
      return i;
    }
  }
  return null;
}

function hasWinningLine(card: BingoCard): boolean {
  // Check rows
  for (let row = 0; row < 5; row++) {
    if (card.grid[row].every(cell => cell.marked)) return true;
  }
  // Check columns
  for (let col = 0; col < 5; col++) {
    let colComplete = true;
    for (let row = 0; row < 5; row++) {
      if (!card.grid[row][col].marked) {
        colComplete = false;
        break;
      }
    }
    if (colComplete) return true;
  }
  return false;
}

/**
 * Auto-daub: mark matching numbers on all cards
 * Returns new cards array with marked cells
 */
export function autoDaub(cards: BingoCard[], number: number): BingoCard[] {
  return cards.map(card => {
    const newGrid = card.grid.map(row =>
      row.map(cell => {
        if (cell.value === number && !cell.marked) {
          return { ...cell, marked: true };
        }
        return cell;
      })
    );
    return { ...card, grid: newGrid };
  });
}

/**
 * Format ball for display: "B-12", "N-35", etc.
 */
export function formatBallDisplay(number: number): string {
  const letter = getLetterForNumber(number);
  return letter + '-' + number.toString().padStart(2, '0');
}