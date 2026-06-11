import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface VictoryOverlayProps {
  winningCardIndex: number | null;   
  bonusCardIndex: number | null;     
  roomCode: string;
  onPlayAgain: () => void;
}

function VictoryOverlay({ winningCardIndex, bonusCardIndex, roomCode, onPlayAgain }: VictoryOverlayProps) {
  const [isNewCodeRevealing, setIsNewCodeRevealing] = useState(false);
  const [revealedCode, setRevealedCode] = useState('');

  const hasBingo = winningCardIndex !== null;
  const hasBonus = bonusCardIndex !== null;
  const isDoubleWin = hasBingo && hasBonus;
  const isNoWinner = !hasBingo && !hasBonus;

  // Simulate room code reveal on mount
  useEffect(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let iterations = 0;
    const maxIterations = 15;
    
    const interval = setInterval(() => {
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        setRevealedCode(roomCode);
        setIsNewCodeRevealing(false);
        return;
      }
      
      let fakeCode = '';
      for (let i = 0; i < 6; i++) {
        fakeCode += chars[Math.floor(Math.random() * chars.length)];
      }
      setRevealedCode(fakeCode);
    }, 60);

    return () => clearInterval(interval);
  }, [roomCode]);

  function handlePlayAgain() {
    setIsNewCodeRevealing(true);
    // Brief delay for code reveal animation
    setTimeout(() => {
      onPlayAgain();
    }, 400);
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(11,11,69,0.85), rgba(11,11,69,0.97))',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Victory burst particles */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const distance = 120 + Math.random() * 80;
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i % 3 === 0 
                ? '#FFD700' 
                : i % 3 === 1 
                  ? '#00F0FF' 
                  : '#00FF88',
            }}
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 1,
              scale: 1,
            }}
            animate={{ 
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
              scale: 0,
            }}
            transition={{ 
              duration: 1.2, 
              delay: 0.2 + Math.random() * 0.3,
              ease: 'easeOut',
            }}
          />
        );
      })}

      <motion.div
        className="relative max-w-md w-full text-center"
        initial={{ scale: 0.5, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ 
          delay: 0.3,
          type: 'spring', 
          stiffness: 200, 
          damping: 18,
        }}
      >
        {/* Glow behind icon */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gold rounded-full blur-[80px] opacity-20 pointer-events-none" />

        {/* Icon */}
        <motion.div
          className="text-7xl md:text-8xl mb-6 relative"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <motion.span
            className="inline-block"
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, -5, 5, -3, 0],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {isNoWinner ? '💫' : isDoubleWin ? '🏆✨' : hasBingo ? '🏆' : '✨'}
          </motion.span>
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-5xl md:text-6xl font-bold mb-4"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            delay: 0.6,
            type: 'spring', 
            stiffness: 300, 
            damping: 15,
          }}
        >
          <span
            className="bg-gradient-to-r from-gold via-yellow-200 to-gold bg-clip-text text-transparent"
            style={{ backgroundSize: '200% 100%' }}
          >
            {isNoWinner ? 'NO WINNER' : isDoubleWin ? 'DOUBLE WIN!' : hasBingo ? 'BINGO!' : 'NOX BONUS!'}
          </span>
        </motion.h2>

        {/* Description */}
        <motion.p
          className="text-gray-400 mb-2 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {isNoWinner
            ? 'Better luck next time'
            : isDoubleWin
              ? 'Card ' + ((winningCardIndex ?? 0) + 1) + ' wins + Nox bonus!'
              : hasBingo
                ? 'Card ' + ((winningCardIndex ?? 0) + 1) + ' takes the win'
                : 'Card ' + ((bonusCardIndex ?? 0) + 1) + ' hit the Nox bonus!'}
        </motion.p>

        {/* Prize announcement */}
        {(hasBingo || hasBonus) && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            {hasBingo && (
              <motion.p 
                className="text-2xl font-bold text-gold"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                +100 NOX
              </motion.p>
            )}
            {hasBonus && (
              <motion.p 
                className="text-lg font-semibold text-[#00E5FF] mt-1"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                +25 NOX Bonus
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Room code */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <p className="text-xs tracking-widest uppercase text-gray-600 mb-2">Room Code</p>
          <div className="flex justify-center gap-1.5">
            {(isNewCodeRevealing ? revealedCode : roomCode).split('').map((char, i) => (
              <motion.span
                key={`${char}-${i}-${isNewCodeRevealing ? 'new' : 'old'}`}
                className="w-9 h-9 flex items-center justify-center bg-midnight-surface border border-gold/20 rounded text-base font-mono text-gold font-bold"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.95 + i * 0.04 }}
              >
                {char}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Play Again button */}
       <motion.button
  onClick={handlePlayAgain}
  disabled={isNewCodeRevealing}
  style={{
    position: 'relative',
    padding: '4px 8px',
    margin: '16px',
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(0,240,255,0.1))',
    border: '1px solid rgba(255,215,0,0.3)',
    borderRadius: '8px',
    color: '#FFD700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    opacity: isNewCodeRevealing ? 0.5 : 1,
  }}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 1.1 }}
  whileHover={{ 
    scale: 1.03,
    boxShadow: '0 0 30px rgba(255,215,0,0.2)',
  }}
  whileTap={{ scale: 0.97 }}
>
  {isNewCodeRevealing ? (
    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ 
        width: '8px', 
        height: '8px', 
        backgroundColor: '#FFD700', 
        borderRadius: '50%',
      }} />
      GENERATING...
    </span>
  ) : (
    'PLAY AGAIN'
  )}
</motion.button>
        {/* Subtle footer */}
        <motion.p
          className="mt-8 text-xs text-gray-600 tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          New room code generated automatically
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

export default VictoryOverlay;