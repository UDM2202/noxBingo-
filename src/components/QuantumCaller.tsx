import { motion, AnimatePresence } from 'framer-motion';
import { getLetterForNumber } from '../utils/gameLogic';

interface QuantumCallerProps {
  currentBall: number | null;
  isDrawing: boolean;
  isFrozen: boolean;
  winningCardIndex: number | null;
}

function QuantumCaller({ currentBall, isDrawing, isFrozen, winningCardIndex }: QuantumCallerProps) {
  const letter = currentBall ? getLetterForNumber(currentBall) : null;

  return (
    <div className="relative flex flex-col items-center pt-4">
      {/* Outer glow ring */}
      <motion.div
        className="absolute w-36 h-36 md:w-48 md:h-48 rounded-full"
        animate={{
          boxShadow: isFrozen && winningCardIndex !== null
            ? [
                '0 0 40px rgba(255,215,0,0.3), 0 0 80px rgba(255,215,0,0.1)',
                '0 0 60px rgba(255,215,0,0.5), 0 0 120px rgba(255,215,0,0.2)',
                '0 0 40px rgba(255,215,0,0.3), 0 0 80px rgba(255,215,0,0.1)',
              ]
            : isDrawing
              ? [
                  '0 0 30px rgba(0,240,255,0.2), 0 0 60px rgba(0,240,255,0.1)',
                  '0 0 50px rgba(0,240,255,0.4), 0 0 100px rgba(0,240,255,0.2)',
                  '0 0 30px rgba(0,240,255,0.2), 0 0 60px rgba(0,240,255,0.1)',
                ]
              : '0 0 20px rgba(0,240,255,0.1)'
        }}
        transition={{
          duration: isFrozen ? 1.5 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main circle */}
      <motion.div
        className="relative w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(0,229,255,0.1), rgba(11,11,69,0.9))',
          border: '2px solid rgba(0,240,255,0.15)',
        }}
        animate={isFrozen && winningCardIndex !== null ? {
          borderColor: [
            'rgba(255,215,0,0.3)',
            'rgba(255,215,0,0.6)',
            'rgba(255,215,0,0.3)',
          ],
        } : {
          borderColor: [
            'rgba(0,240,255,0.15)',
            'rgba(0,240,255,0.3)',
            'rgba(0,240,255,0.15)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Inner decorative ring */}
        <div
          className="absolute inset-3 rounded-full border border-white/5"
          style={{
            background: 'radial-gradient(circle at center, transparent 60%, rgba(0,240,255,0.03) 100%)',
          }}
        />

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
              className="absolute w-px bg-neon-primary/20"
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

        {/* Content */}
        <AnimatePresence mode="wait">
          {currentBall === null ? (
            // Empty state
            <motion.div
              key="empty"
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-12 h-12 rounded-full border border-dashed border-white/10 flex items-center justify-center mx-auto">
                <span className="text-2xl text-white/20">?</span>
              </div>
            </motion.div>
          ) : isFrozen && winningCardIndex !== null ? (
            // Victory state
            <motion.div
              key="bingo"
              className="text-center"
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
              className="text-center"
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
                className="text-xs md:text-sm font-bold tracking-[0.3em] text-neon-primary/70 mb-1"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                {letter}
              </motion.div>

              {/* Number */}
              <motion.div
                className="text-3xl md:text-4xl font-bold font-mono text-white tabular-nums"
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

           {/* Label below */}
      <div className="mt-4 text-xs tracking-[0.2em] uppercase text-gray-500 font-light text-center">
        {isFrozen && winningCardIndex !== null
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

