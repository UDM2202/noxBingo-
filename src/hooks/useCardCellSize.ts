import { useEffect, useState } from 'react';

// Card geometry, matching HoloCard: 5 cells + 4 gaps (gap = 6/44 of a
// cell), plus 10px padding and a 1px border on each side.
const GAP_RATIO = 6 / 44;
const GRID_UNITS = 5 + 4 * GAP_RATIO;
const CARD_CHROME = 22;
const ROW_GAP = 12; // gap-3 between cards
// Slack for HoloCard rounding its gaps to whole pixels.
const ROUNDING_SLACK = 4;
const MIN_CELL = 44; // today's size: cards only ever grow from here
const MAX_CELL = 60; // above this a single card no longer fits an iPhone SE screen
const DEFAULT_CELL = 44;

/**
 * Picks the bingo cell size so the player's cards fill the space they
 * have: as few rows as possible, cards spread evenly across them (5
 * cards become 3 + 2, not 4 + 1), never smaller than MIN_CELL or bigger
 * than MAX_CELL. Attach the returned ref to the cards' row container
 * (a callback ref, so it also works when the row mounts later).
 */
export function useCardCellSize(cardCount: number) {
  const [el, ref] = useState<HTMLDivElement | null>(null);
  const [cell, setCell] = useState(DEFAULT_CELL);

  useEffect(() => {
    if (!el || cardCount === 0) return;

    const cellFor = (perRow: number, width: number) =>
      ((width - ROUNDING_SLACK - ROW_GAP * (perRow - 1)) / perRow - CARD_CHROME) / GRID_UNITS;

    const update = (width: number) => {
      // Most cards per row that still keeps cells readable.
      let perRow = cardCount;
      while (perRow > 1 && cellFor(perRow, width) < MIN_CELL) perRow--;
      // Same number of rows, cards shared out evenly between them.
      const rows = Math.ceil(cardCount / perRow);
      perRow = Math.ceil(cardCount / rows);
      const size = Math.floor(Math.min(MAX_CELL, Math.max(MIN_CELL, cellFor(perRow, width))));
      setCell(prev => (prev === size ? prev : size));
    };

    update(el.clientWidth - 8); // px-1 on the container
    const observer = new ResizeObserver(entries => update(entries[0].contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [el, cardCount]);

  return { ref, cell };
}
