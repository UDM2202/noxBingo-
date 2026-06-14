import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { BingoCard } from '../types/game';

interface VictoryOverlayProps {
  winningCardIndex: number | null;
  bonusCardIndex: number | null;
  roomCode: string;
  cards: BingoCard[];
  onPlayAgain: () => void;
}

function VictoryOverlay({ winningCardIndex, bonusCardIndex, roomCode, cards, onPlayAgain }: VictoryOverlayProps) {
  const [isNewCodeRevealing, setIsNewCodeRevealing] = useState(false);
  const [revealedCode, setRevealedCode] = useState('');
  const [viewingCards, setViewingCards] = useState(false);
  const [currentViewCard, setCurrentViewCard] = useState(0);

  const hasBingo = winningCardIndex !== null;
  const hasBonus = bonusCardIndex !== null;
  const isDoubleWin = hasBingo && hasBonus;
  const isNoWinner = !hasBingo && !hasBonus;

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
    setTimeout(() => {
      onPlayAgain();
    }, 400);
  }

  function openCardViewer(startIndex: number) {
    setCurrentViewCard(startIndex);
    setViewingCards(true);
  }

  function nextCard() {
    setCurrentViewCard(prev => (prev + 1) % cards.length);
  }

  function prevCard() {
    setCurrentViewCard(prev => (prev - 1 + cards.length) % cards.length);
  }

  // Card viewer mode — renders static card grid
  if (viewingCards) {
   if (!cards || cards.length === 0) {
  return (
    <div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>
      <p>No cards available.</p>
      <button onClick={() => setViewingCards(false)} style={{ color: '#FFD700', marginTop: '16px' }}>
        Back to Results
      </button>
    </div>
  );
}

const card = cards[currentViewCard];
if (!card || !card.grid) {
  return (
    <div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>
      <p>Card data not available.</p>
      <button onClick={() => setViewingCards(false)} style={{ color: '#FFD700', marginTop: '16px' }}>
        Back to Results
      </button>
    </div>
  );
}
    const isWinner = currentViewCard === winningCardIndex;

    return (
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(11,11,69,0.92), rgba(11,11,69,0.98))',
        }}
      >
        <p style={{
          color: '#FFD700',
          fontSize: '18px',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Card {currentViewCard + 1} of {cards.length}
          {isWinner && ' 🏆'}
          {currentViewCard === bonusCardIndex && !hasBingo && ' ✨'}
        </p>

        {/* Static card */}
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(26,26,94,0.95), rgba(18,18,77,0.98))',
            padding: '20px',
            borderRadius: '12px',
            border: isWinner ? '2px solid rgba(255,215,0,0.6)' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: isWinner ? '0 0 30px rgba(255,215,0,0.3)' : '0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          {/* B-I-N-G-O headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '8px', textAlign: 'center' }}>
            {['B', 'I', 'N', 'G', 'O'].map(letter => (
              <div key={letter} style={{
                color: isWinner ? '#FFD700' : 'rgba(0,229,255,0.7)',
                fontWeight: 700,
                fontSize: '14px',
              }}>
                {letter}
              </div>
            ))}
          </div>

          {/* Number grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
            {card.grid.map((row, ri) =>
              row.map((cell, ci) => {
                const isFree = cell.isFreeSpace;
                const isMarked = cell.marked;
                const isNox = card.noxCell?.row === ri && card.noxCell?.col === ci;

                return (
                  <div
                    key={ri + '-' + ci}
                    style={{
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      backgroundColor: isFree
                        ? 'rgba(255,215,0,0.12)'
                        : isMarked
                          ? 'rgba(0,229,255,0.12)'
                          : 'transparent',
                      color: isFree
                        ? '#FFD700'
                        : isMarked
                          ? '#00E5FF'
                          : 'rgba(255,255,255,0.5)',
                      border: isNox && !card.noxHit
                        ? '2px solid rgba(255,215,0,0.4)'
                        : '1px solid rgba(255,255,255,0.05)',
                      boxShadow: isNox && card.noxHit
                        ? '0 0 12px rgba(255,215,0,0.5)'
                        : 'none',
                    }}
                  >
                    {isFree ? 'NOX' : cell.value}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Card navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
          <button
            onClick={prevCard}
            style={{
              padding: '8px 16px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              background: 'rgba(255,255,255,0.05)',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ◀
          </button>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            {currentViewCard + 1} / {cards.length}
          </span>
          <button
            onClick={nextCard}
            style={{
              padding: '8px 16px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              background: 'rgba(255,255,255,0.05)',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ▶
          </button>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          <button
            onClick={() => setViewingCards(false)}
            style={{
              padding: '10px 24px',
              border: '1px solid rgba(255,215,0,0.3)',
              borderRadius: '8px',
              color: '#FFD700',
              background: 'rgba(255,215,0,0.1)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Back to Results
          </button>
          <button
            onClick={handlePlayAgain}
            style={{
              padding: '10px 24px',
              border: '1px solid rgba(0,229,255,0.3)',
              borderRadius: '8px',
              color: '#00E5FF',
              background: 'rgba(0,229,255,0.1)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Play Again
          </button>
        </div>
      </motion.div>
    );
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
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 1.2, delay: 0.2 + Math.random() * 0.3, ease: 'easeOut' }}
          />
        );
      })}

      <motion.div
        className="relative max-w-md w-full text-center"
        initial={{ scale: 0.5, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 18 }}
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
            animate={{ y: [0, -8, 0], rotate: [0, -5, 5, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {isNoWinner ? '💫' : isDoubleWin ? '🏆✨' : hasBingo ? '🏆' : '✨'}
          </motion.span>
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-5xl md:text-6xl font-bold mb-4"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 15 }}
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

        {/* View cards button — always show */}
        <motion.button
          onClick={() => openCardViewer(hasBingo ? winningCardIndex! : 0)}
          className="mb-6"
          style={{
            padding: '10px 24px',
            border: '1px solid rgba(255,215,0,0.4)',
            borderRadius: '8px',
            color: '#FFD700',
            background: 'rgba(255,215,0,0.08)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            letterSpacing: '0.05em',
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          👁 {hasBingo ? 'View Winning Card' : 'View All Cards'}
        </motion.button>

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
          whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(255,215,0,0.2)' }}
          whileTap={{ scale: 0.97 }}
        >
          {isNewCodeRevealing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#FFD700', borderRadius: '50%' }} />
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