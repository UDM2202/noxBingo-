import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { getLetterForNumber } from '../utils/gameLogic';
import NoxSeal from './NoxSeal';

interface QuantumCallerProps {
  currentBall: number | null;
  isDrawing: boolean;
  isFrozen: boolean;
  winningCardIndex: number | null;
}

// Spark directions for the burst when a new ball is called.
const SPARK_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function QuantumCaller({ currentBall, isDrawing, isFrozen, winningCardIndex }: QuantumCallerProps) {
  const reduce = useReducedMotion();
  const letter = currentBall ? getLetterForNumber(currentBall) : null;
  const isWinner = isFrozen && winningCardIndex !== null;

  return (
    <div className="relative flex flex-col items-center pt-4">
      <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <motion.div
        className="absolute w-36 h-36 md:w-48 md:h-48 rounded-full"
        animate={{
          boxShadow: isWinner
            ? [
                '0 0 40px rgba(255,215,0,0.3), 0 0 80px rgba(255,215,0,0.1)',
                '0 0 60px rgba(255,215,0,0.5), 0 0 120px rgba(255,215,0,0.2)',
                '0 0 40px rgba(255,215,0,0.3), 0 0 80px rgba(255,215,0,0.1)',
              ]
            : isDrawing
              ? [
                  '0 0 30px rgba(0,240,255,0.25), 0 0 60px rgba(0,240,255,0.12)',
                  '0 0 55px rgba(0,240,255,0.5), 0 0 110px rgba(0,240,255,0.25)',
                  '0 0 30px rgba(0,240,255,0.25), 0 0 60px rgba(0,240,255,0.12)',
                ]
              : [
                  '0 0 22px rgba(0,240,255,0.14), 0 0 44px rgba(0,240,255,0.06)',
                  '0 0 34px rgba(0,240,255,0.26), 0 0 70px rgba(0,240,255,0.12)',
                  '0 0 22px rgba(0,240,255,0.14), 0 0 44px rgba(0,240,255,0.06)',
                ],
        }}
        transition={{
          duration: isWinner ? 1.5 : 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main circle */}
      <motion.div
        className="relative w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(0,229,255,0.16), rgba(11,11,69,0.92))',
          border: '2px solid rgba(0,240,255,0.25)',
          boxShadow: 'inset 0 0 26px rgba(0,229,255,0.14)',
        }}
        animate={isWinner ? {
          borderColor: [
            'rgba(255,215,0,0.3)',
            'rgba(255,215,0,0.7)',
            'rgba(255,215,0,0.3)',
          ],
        } : {
          borderColor: [
            'rgba(0,240,255,0.25)',
            'rgba(0,240,255,0.55)',
            'rgba(0,240,255,0.25)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Inner decorative ring */}
        <div
          className="absolute inset-3 rounded-full border border-white/5"
          style={{
            background: 'radial-gradient(circle at center, transparent 60%, rgba(0,240,255,0.05) 100%)',
          }}
        />

        {/* NOX sigil coin behind the number — slowly turning, faint, so
            the caller carries the same gold mark as the card's coins. */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: currentBall === null ? 0.35 : 0.5 }}
          animate={reduce ? {} : { rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-24 h-24 md:w-32 md:h-32">
            <NoxSeal size="100%" dim />
          </div>
        </motion.div>

        {/* Rotating outer track */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={isDrawing ? { rotate: 360 } : { rotate: 0 }}
          transition={isDrawing ? {
            duration: 0.5,
            repeat: Infinity,
            ease: 'linear',
          } : { duration: 0.3 }}
        >
          {/* Tick marks around the edge */}
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-px bg-neon-primary/30"
              style={{
                height: '8px',
                left: '50%',
                top: '4px',
                transform: `rotate(${i * 15}deg)`,
                transformOrigin: 'bottom center',
              }}
            />
          ))}
        </motion.div>

        {/* A new ball lands: a ring expands out of the caller and gold
            sparks fly off, same as the card cells. Keyed by the ball so it
            replays for every draw. */}
        {currentBall !== null && !reduce && !isWinner && (
          <div key={'burst-' + currentBall} className="absolute inset-0 pointer-events-none">
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ border: '2px solid rgba(0,229,255,0.9)' }}
              initial={{ scale: 1, opacity: 0.9 }}
              animate={{ scale: 1.7, opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            {SPARK_ANGLES.map((angle) => (
              <motion.span
                key={angle}
                className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full"
                style={{ background: '#FFD700', boxShadow: '0 0 8px rgba(255,215,0,0.9)' }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((angle * Math.PI) / 180) * 78,
                  y: Math.sin((angle * Math.PI) / 180) * 78,
                  opacity: 0,
                  scale: 0.3,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {currentBall === null ? (
            // Empty state
            <motion.div
              key="empty"
              className="relative text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-12 h-12 rounded-full border border-dashed border-white/10 flex items-center justify-center mx-auto">
                <span className="text-2xl text-white/20">?</span>
              </div>
            </motion.div>
          ) : isWinner ? (
            // Victory state
            <motion.div
              key="bingo"
              className="relative text-center"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
            >
              <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gold via-yellow-200 to-gold bg-clip-text text-transparent tracking-tight">
                BINGO!
              </span>
            </motion.div>
          ) : (
            // Ball display
            <motion.div
              key={currentBall}
              className="relative text-center"
              initial={{ scale: 1.8, rotate: 15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 15,
                mass: 0.5,
              }}
            >
              {/* Letter */}
              <motion.div
                className="text-xs md:text-sm font-bold tracking-[0.3em] mb-1"
                style={{ color: '#FFD700', textShadow: '0 0 8px rgba(255,215,0,0.6)' }}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                {letter}
              </motion.div>

              {/* Number */}
              <motion.div
                className="text-3xl md:text-4xl font-bold font-mono text-white tabular-nums"
                style={{ textShadow: '0 0 14px rgba(0,229,255,0.9), 0 0 28px rgba(0,229,255,0.45)' }}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.2 }}
              >
                {currentBall.toString().padStart(2, '0')}
              </motion.div>

              {/* Glow dot underneath */}
              <motion.div
                className="w-1 h-1 bg-neon-primary rounded-full mx-auto mt-2"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      </div>

      {/* Label below */}
      <div className="mt-4 text-xs tracking-[0.2em] uppercase text-gray-500 font-light text-center">
        {isWinner
          ? 'Winner'
          : isDrawing
            ? 'Drawing...'
            : currentBall === null
              ? 'Awaiting Draw'
              : 'Current Ball'}
      </div>
    </div>
  );
}

export default QuantumCaller;