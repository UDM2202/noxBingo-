import { motion } from 'framer-motion';
import type { BingoCard } from '../types/game';

const COLUMN_HEADERS = ['B', 'I', 'N', 'G', 'O'] as const;

interface HoloCardProps {
  card: BingoCard;
  cardIndex: number;
  drawnNumbers: Set<number>;
  currentBall: number | null;
  isWinning: boolean;
  victoryPhase: 'winning-cell' | 'card-scale' | 'caller-freeze' | 'overlay' | null;
  onCellClick: (row: number, col: number) => void;
}

function HoloCard({ card, cardIndex, currentBall, isWinning, victoryPhase, onCellClick }: HoloCardProps) {
  const isNearMiss = card.nearMissCount === 1;
  const cardLabel = 'Card ' + (cardIndex + 1);

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
        background: 'linear-gradient(145deg, rgba(26,35,53,0.9), rgba(15,22,34,0.95))',
        padding: '16px',
      }}
      animate={
        isWinning && victoryPhase === 'card-scale'
          ? { scale: 1.05, zIndex: 10 }
          : { scale: 1 }
      }
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
        }}
      />

      {/* Card header */}
      <div className="relative grid grid-cols-5 text-center pb-2 border-b border-white/5 mb-2">
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
      <div className="grid grid-cols-5 gap-1.5">
        {card.grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isFreeSpace = cell.isFreeSpace;
            const isMarked = cell.marked;
            const isWinningCell = isWinning && victoryPhase === 'winning-cell' && isMarked;
            const isJustCalled = currentBall !== null && cell.value === currentBall;

            return (
              <motion.button
                key={rowIndex + '-' + colIndex}
                onClick={() => onCellClick(rowIndex, colIndex)}
                disabled={isFreeSpace || isMarked}
                className={`
                  relative w-full aspect-square flex items-center justify-center
                  rounded-lg text-sm md:text-base font-mono font-bold
                  transition-colors duration-200 box-border
                  ${isFreeSpace
                    ? 'bg-gold/10 cursor-default'
                    : isMarked
                      ? 'bg-neon-primary/10 cursor-default'
                      : 'bg-transparent cursor-pointer hover:bg-white/[0.03]'
                  }
                `}
                style={{
                  width: '52px',
                  height: '52px',
                  padding: 0,
                  margin: 0,
                }}
                whileTap={!isFreeSpace && !isMarked ? { scale: 0.85 } : {}}
                animate={
                  isWinningCell
                    ? {
                        backgroundColor: [
                          'rgba(0,240,255,0.1)',
                          'rgba(255,215,0,0.3)',
                          'rgba(0,240,255,0.1)',
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
                {/* Cell content */}
                {isFreeSpace ? (
                  <motion.span
                    className="text-gold text-xs font-bold tracking-tight"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    FREE
                  </motion.span>
                ) : (
                  <motion.span
                    className={isMarked ? 'text-neon-primary' : 'text-gray-300'}
                    initial={isMarked ? { scale: 1.5, opacity: 0 } : false}
                    animate={isMarked ? { scale: 1, opacity: 1 } : false}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    {typeof cell.value === 'number' ? cell.value : ''}
                  </motion.span>
                )}

                {/* Draw flash — transient glow when ball matches this cell */}
                {isJustCalled && (
                  <motion.div
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    initial={{ 
                      boxShadow: '0 0 0px rgba(0,240,255,0)', 
                      borderColor: 'rgba(0,240,255,0)',
                    }}
                    animate={{ 
                      boxShadow: [
                        '0 0 0px rgba(0,240,255,0)',
                        '0 0 20px rgba(0,240,255,0.7), 0 0 40px rgba(0,240,255,0.3)',
                        '0 0 0px rgba(0,240,255,0)',
                      ],
                      borderColor: [
                        'rgba(0,240,255,0)',
                        'rgba(0,240,255,0.8)',
                        'rgba(0,240,255,0)',
                      ],
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ border: '2px solid transparent' }}
                  />
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

                {/* Near-miss empty cell pulse */}
                {isNearMiss && !isMarked && !isFreeSpace && (
                  <motion.div
                    className="absolute inset-0 rounded-lg border border-gold/0"
                    animate={{
                      borderColor: [
                        'rgba(255,215,0,0)',
                        'rgba(255,215,0,0.3)',
                        'rgba(255,215,0,0)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            );
          })
        )}
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
    </motion.div>
  );
}

export default HoloCard;