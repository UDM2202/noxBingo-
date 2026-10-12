import type { CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { BingoCard } from '../types/game';
import NoxSeal from './NoxSeal';

const COLUMN_HEADERS = ['B', 'I', 'N', 'G', 'O'] as const;

// The grid is laid out on a fixed 44px cell + 6px gap, so the energy
// line drawn behind near-complete rows/columns can be positioned exactly.
const CELL = 44;
const GAP = 6;
const PITCH = CELL + GAP;
const GRID_SIZE = CELL * 5 + GAP * 4;
const center = (i: number) => i * PITCH + CELL / 2;
const GRID_COLUMNS = `repeat(5, ${CELL}px)`;

// Spark directions for the burst when a number is called.
const SPARK_ANGLES = [0, 60, 120, 180, 240, 300];

// Only opacity / stroke-offset animate, so it stays smooth on phones.
// Switched off for anyone who has "reduce motion" turned on.
const CARD_CSS = `
@keyframes nox-breathe { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes nox-flow { to { stroke-dashoffset: -10; } }
@keyframes nox-missing { 0%, 100% { opacity: .3; } 50% { opacity: 1; } }
.nox-breathe { animation: nox-breathe 2.6s ease-in-out infinite; }
.nox-flow { animation: nox-flow .9s linear infinite; }
.nox-missing { animation: nox-missing 1.1s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .nox-breathe, .nox-flow, .nox-missing { animation: none !important; }
}
`;

interface HoloCardProps {
  card: BingoCard;
  cardIndex: number;
  drawnNumbers: Set<number>;
  currentBall: number | null;
  isWinning: boolean;
  victoryPhase: 'winning-cell' | 'card-scale' | 'caller-freeze' | 'overlay' | null;
  onCellClick: (row: number, col: number) => void;
}

type Cell = BingoCard['grid'][number][number];
interface HotLine {
  kind: 'row' | 'col';
  index: number;
}

function HoloCard({ card, cardIndex, drawnNumbers, currentBall, isWinning, victoryPhase, onCellClick }: HoloCardProps) {
  const reduce = useReducedMotion();
  const cardLabel = 'Card ' + (cardIndex + 1);

  // cell.marked comes from the initial cards_dealt payload and is never
  // refreshed by the server after that (only the ball number itself is
  // sent on each draw) — so it can't be trusted mid-game. drawnNumbers,
  // on the other hand, genuinely accumulates every ball as it's called,
  // so deriving "marked" from that is what actually stays correct.
  const cellMarked = (cell: Cell): boolean =>
    cell.isFreeSpace || cell.marked || (typeof cell.value === 'number' && drawnNumbers.has(cell.value));

  // Rows / columns that are exactly one number from winning. These get a
  // flowing gold line through them and a pulsing gold border on the single
  // missing cell — so the player can see exactly which number they need.
  const hotLines: HotLine[] = [];
  const missingCells = new Set<string>();
  if (!isWinning && card.status !== 'WON') {
    for (let i = 0; i < 5; i++) {
      let rowMarked = 0;
      let rowMissing = -1;
      let colMarked = 0;
      let colMissing = -1;
      for (let j = 0; j < 5; j++) {
        if (cellMarked(card.grid[i][j])) rowMarked++;
        else rowMissing = j;
        if (cellMarked(card.grid[j][i])) colMarked++;
        else colMissing = j;
      }
      if (rowMarked === 4) {
        hotLines.push({ kind: 'row', index: i });
        missingCells.add(i + '-' + rowMissing);
      }
      if (colMarked === 4) {
        hotLines.push({ kind: 'col', index: i });
        missingCells.add(colMissing + '-' + i);
      }
    }
  }
  const isNearMiss = hotLines.length > 0;

  return (
    <motion.div
      className={`
        relative rounded-xl overflow-hidden box-border
        border transition-colors duration-500
        ${isWinning
          ? 'border-gold shadow-[0_0_30px_rgba(255,215,0,0.2)]'
          : isNearMiss
            ? 'border-neon-primary/60 shadow-[0_0_20px_rgba(0,240,255,0.1)]'
            : 'border-white/10 hover:border-white/20'
        }
      `}
      style={{
        background: 'linear-gradient(145deg, rgba(26,26,94,0.95), rgba(18,18,77,0.98))',
        padding: '10px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.03) inset',
      }}
      animate={
        isWinning && victoryPhase === 'card-scale'
          ? { scale: 1.05, zIndex: 10 }
          : { scale: 1 }
      }
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <style>{CARD_CSS}</style>

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
        }}
      />

      {/* Top highlight edge */}
      <div
        className="absolute top-0 left-4 right-4 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
        }}
      />

      {/* Card header */}
      <div
        className="relative grid text-center pb-2 border-b border-white/5 mb-2"
        style={{ gridTemplateColumns: GRID_COLUMNS, columnGap: GAP, justifyContent: 'center' }}
      >
        {COLUMN_HEADERS.map((header) => (
          <div
            key={header}
            className={`
              text-sm font-bold tracking-wider
              ${isWinning && victoryPhase === 'winning-cell'
                ? 'text-gold'
                : 'text-neon-primary/70'
              }
            `}
          >
            {header}
          </div>
        ))}
      </div>

      {/* Card label */}
      <span className="text-xs tracking-[0.2em] uppercase text-gray-400 font-medium block mb-2">
        {cardLabel}
      </span>

      {/* Number grid */}
      <div className="relative mx-auto" style={{ width: GRID_SIZE }}>
        {/* Energy line behind one-away rows / columns */}
        {hotLines.length > 0 && (
          <svg
            className="absolute left-0 top-0 pointer-events-none"
            width={GRID_SIZE}
            height={GRID_SIZE}
            viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
            aria-hidden="true"
          >
            {hotLines.map((line) => {
              const a =
                line.kind === 'row'
                  ? { x1: center(0), y1: center(line.index), x2: center(4), y2: center(line.index) }
                  : { x1: center(line.index), y1: center(0), x2: center(line.index), y2: center(4) };
              return (
                <g key={line.kind + line.index}>
                  <line {...a} stroke="rgba(255,215,0,0.4)" strokeWidth="6" strokeLinecap="butt" />
                  <line
                    {...a}
                    stroke="rgba(255,236,150,1)"
                    strokeWidth="2.2"
                    strokeLinecap="butt"
                    strokeDasharray="2 3"
                    className="nox-flow"
                  />
                </g>
              );
            })}
          </svg>
        )}

        <div
          className="grid"
          style={{ gridTemplateColumns: GRID_COLUMNS, columnGap: GAP, rowGap: GAP, justifyContent: 'center' }}
        >
          {card.grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isFreeSpace = cell.isFreeSpace;
              const isMarked = cellMarked(cell);
              const isWinningCell = isWinning && victoryPhase === 'winning-cell' && isMarked;
              const isJustCalled = currentBall !== null && cell.value === currentBall;
              const isNoxCell = card.noxCell?.row === rowIndex && card.noxCell?.col === colIndex;
              const isNoxHit = isNoxCell && card.noxHit;
              const isMissing = missingCells.has(rowIndex + '-' + colIndex) && !isMarked;
              const stagger = ((rowIndex * 5 + colIndex) % 5) * 0.35 + 's';

              // Lit-up cell: cyan glow with a bright border. Free space
              // gets the same treatment in gold.
              // The solid colour at the end of each background keeps the
              // energy line from showing through the cell and crossing
              // its number.
              const litStyle: CSSProperties | undefined = isFreeSpace
                ? {
                    background: 'radial-gradient(circle at 50% 35%, rgba(255,215,0,0.22), rgba(255,215,0,0.06) 75%), #18185c',
                    border: '1px solid rgba(255,215,0,0.45)',
                  }
                : isMarked
                  ? {
                      background: 'radial-gradient(circle at 50% 35%, rgba(0,229,255,0.32), rgba(0,229,255,0.10) 75%), #18185c',
                      border: '1px solid rgba(0,229,255,0.8)',
                    }
                  : isMissing
                    ? { background: '#18185c' }
                    : undefined;

              return (
                <motion.button
                  key={rowIndex + '-' + colIndex}
                  onClick={() => onCellClick(rowIndex, colIndex)}
                  disabled={isFreeSpace || isMarked}
                  aria-label={
                    isFreeSpace
                      ? 'Free space'
                      : typeof cell.value === 'number'
                        ? cell.value + (isMarked ? ', called' : '')
                        : undefined
                  }
                  className={`
                    relative flex items-center justify-center
                    rounded-lg text-sm md:text-base font-mono font-bold
                    transition-colors duration-200 box-border
                    ${isFreeSpace || isMarked
                      ? 'cursor-default'
                      : 'bg-transparent cursor-pointer hover:bg-white/[0.03]'
                    }
                  `}
                  style={{
                    width: CELL + 'px',
                    height: CELL + 'px',
                    padding: 0,
                    margin: 0,
                    ...litStyle,
                  }}
                  whileTap={!isFreeSpace && !isMarked ? { scale: 0.85 } : {}}
                  animate={
                    isWinningCell
                      ? {
                          backgroundColor: [
                            'rgba(0,229,255,0.1)',
                            'rgba(255,215,0,0.3)',
                            'rgba(0,229,255,0.1)',
                          ],
                        }
                      : {}
                  }
                  transition={
                    isWinningCell
                      ? { duration: 0.6, repeat: 1 }
                      : {}
                  }
                >
                  {/* Soft breathing glow around every lit cell */}
                  {isMarked && !isFreeSpace && (
                    <span
                      className="nox-breathe absolute inset-0 rounded-lg pointer-events-none"
                      style={{
                        boxShadow: '0 0 12px rgba(0,229,255,0.45), inset 0 0 10px rgba(0,229,255,0.3)',
                        animationDelay: stagger,
                      }}
                    />
                  )}

                  {/* NOX sigil coin — stamps down when the number is called */}
                  {(isMarked || isFreeSpace) && (
                    <motion.span
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      initial={isJustCalled && !reduce ? { scale: 1.9, rotate: -30, opacity: 0 } : false}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 16 }}
                    >
                      <NoxSeal size={40} plain={isNoxCell} dim={isFreeSpace} />
                    </motion.span>
                  )}

                  {/* Cell content */}
                  {isFreeSpace ? (
                    <motion.span
                      className="relative z-10 text-gold text-xs font-bold tracking-tight"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      NOX
                    </motion.span>
                  ) : (
                    <motion.span
                      className={`relative z-10 ${isMarked ? 'text-white' : isMissing ? 'text-gold' : 'text-gray-300'}`}
                      style={isMarked ? { textShadow: '0 0 8px rgba(0,229,255,0.9)' } : undefined}
                      initial={isMarked ? { scale: 1.5, opacity: 0 } : false}
                      animate={isMarked ? { scale: 1, opacity: 1 } : false}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                      {typeof cell.value === 'number' ? cell.value : ''}
                    </motion.span>
                  )}

                  {/* Nox cell circle — unmarked */}
                  {isNoxCell && !isNoxHit && !isMarked && (
                    <motion.div
                      className="absolute inset-2 rounded-full pointer-events-none"
                      style={{ border: '2px solid rgba(255,215,0,0.4)' }}
                      animate={{
                        opacity: [0.3, 0.8, 0.3],
                        boxShadow: [
                          '0 0 0px rgba(255,215,0,0)',
                          '0 0 12px rgba(255,215,0,0.4)',
                          '0 0 0px rgba(255,215,0,0)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}

                  {/* Nox cell circle — marked, bonus active */}
                  {isNoxCell && !isNoxHit && isMarked && (
                    <motion.div
                      className="absolute inset-2 rounded-full pointer-events-none"
                      style={{ border: '2px solid rgba(255,215,0,0.5)' }}
                      animate={{
                        opacity: [0.4, 0.9, 0.4],
                        boxShadow: [
                          '0 0 4px rgba(255,215,0,0.2)',
                          '0 0 16px rgba(255,215,0,0.5)',
                          '0 0 4px rgba(255,215,0,0.2)',
                        ],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}

                  {/* Nox hit celebration */}
                  {isNoxHit && (
                    <motion.div
                      className="absolute inset-0 rounded-lg pointer-events-none"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1.6, 1],
                        opacity: [0, 0.9, 0.5],
                        backgroundColor: [
                          'rgba(255,215,0,0)',
                          'rgba(255,215,0,0.35)',
                          'rgba(255,215,0,0.15)',
                        ],
                        boxShadow: [
                          '0 0 0px rgba(255,215,0,0)',
                          '0 0 30px rgba(255,215,0,0.8)',
                          '0 0 10px rgba(255,215,0,0.3)',
                        ],
                      }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  )}

                  {/* Draw flash: a ring that expands out of the cell, plus
                      a few gold sparks. Plays once when the number lands. */}
                  {isJustCalled && !reduce && (
                    <>
                      <motion.span
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{ border: '2px solid rgba(0,229,255,0.9)' }}
                        initial={{ scale: 1, opacity: 0.9 }}
                        animate={{ scale: 1.9, opacity: 0 }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                      />
                      {SPARK_ANGLES.map((angle) => (
                        <motion.span
                          key={angle}
                          className="absolute left-1/2 top-1/2 w-1 h-1 -ml-0.5 -mt-0.5 rounded-full pointer-events-none"
                          style={{ background: '#FFD700', boxShadow: '0 0 6px rgba(255,215,0,0.9)' }}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{
                            x: Math.cos((angle * Math.PI) / 180) * 28,
                            y: Math.sin((angle * Math.PI) / 180) * 28,
                            opacity: 0,
                            scale: 0.3,
                          }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                        />
                      ))}
                    </>
                  )}

                  {/* Winning cell pulse */}
                  {isWinningCell && (
                    <motion.div
                      className="absolute inset-0 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        boxShadow: [
                          'inset 0 0 0px rgba(255,215,0,0)',
                          'inset 0 0 15px rgba(255,215,0,0.6)',
                          'inset 0 0 0px rgba(255,215,0,0)',
                        ],
                      }}
                      transition={{ duration: 1, repeat: 1 }}
                    />
                  )}

                  {/* The one number still needed for a row / column */}
                  {isMissing && (
                    <span
                      className="nox-missing absolute inset-0 rounded-lg pointer-events-none"
                      style={{
                        border: '1.5px solid rgba(255,215,0,0.85)',
                        boxShadow: '0 0 12px rgba(255,215,0,0.45), inset 0 0 8px rgba(255,215,0,0.2)',
                      }}
                    />
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Card footer: near-miss indicator */}
      {isNearMiss && card.status !== 'WON' && (
        <motion.div
          className="mt-3 pt-2 border-t border-white/5 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-gold"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <span className="text-[10px] tracking-widest uppercase text-gold/70 font-medium">
            One Away
          </span>
        </motion.div>
      )}

      {/* Nox bonus footer */}
      {card.noxCell && !card.noxHit && card.status !== 'WON' && (
        <motion.div
          className="mt-2 pt-2 border-t border-gold/10 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.span
            className="text-[10px] tracking-widest uppercase text-gold/50 font-medium"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✦ Nox Bonus Active ✦
          </motion.span>
        </motion.div>
      )}
    </motion.div>
  );
}

export default HoloCard;