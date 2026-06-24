import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { BingoCard } from '../types/game';
interface VictoryOverlayProps {
  winningCardIndex: number | null;
  bonusCardIndex: number | null;
  roomCode: string;
  cards: BingoCard[];
  onPlayAgain: () => void;
  isMultiplayer?: boolean;
  isMultiplayerWinner?: boolean;
  isMultiplayerLoser?: boolean;
  winnerName?: string | null;
  playerName?: string;
}
function VictoryOverlay({ winningCardIndex, bonusCardIndex, roomCode, cards, onPlayAgain, isMultiplayer, isMultiplayerWinner, isMultiplayerLoser, winnerName, playerName }: VictoryOverlayProps) {
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
      for (let i = 0; i < 6; i++) fakeCode += chars[Math.floor(Math.random() * chars.length)];
      setRevealedCode(fakeCode);
    }, 60);
    return () => clearInterval(interval);
  }, [roomCode]);
  function handlePlayAgain() {
    setIsNewCodeRevealing(true);
    setTimeout(() => onPlayAgain(), 400);
  }
  function openCardViewer(startIndex: number) {
    setCurrentViewCard(startIndex);
    setViewingCards(true);
  }
  function nextCard() { setCurrentViewCard(prev => (prev + 1) % cards.length); }
  function prevCard() { setCurrentViewCard(prev => (prev - 1 + cards.length) % cards.length); }
  const clapEmoji = '\uD83D\uDC4F';
  const sparkleEmoji = '\uD83D\uDCAB';
  const trophyEmoji = '\uD83C\uDFC6';
  const starEmoji = '\u2728';
  const eyeEmoji = '\uD83D\uDC41';
  if (viewingCards) {
    const card = cards[currentViewCard];
    const isWinner = currentViewCard === winningCardIndex;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '16px', background: 'radial-gradient(ellipse at center, rgba(11,11,69,0.92), rgba(11,11,69,0.98))' }}>
        <p style={{ color: '#FFD700', fontSize: '18px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Card {currentViewCard + 1} of {cards.length}{isWinner ? ' ' + trophyEmoji : ''}{currentViewCard === bonusCardIndex && !hasBingo ? ' ' + starEmoji : ''}
        </p>
        <div style={{ background: 'linear-gradient(145deg, rgba(26,26,94,0.95), rgba(18,18,77,0.98))', padding: '20px', borderRadius: '12px', border: isWinner ? '2px solid rgba(255,215,0,0.6)' : '1px solid rgba(255,255,255,0.1)', boxShadow: isWinner ? '0 0 30px rgba(255,215,0,0.3)' : '0 4px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginBottom: '8px', textAlign: 'center' }}>
            {['B','I','N','G','O'].map(l => <div key={l} style={{ color: isWinner ? '#FFD700' : 'rgba(0,229,255,0.7)', fontWeight: 700, fontSize: '14px' }}>{l}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
            {card.grid.map((row, ri) => row.map((cell, ci) => {
              const isFree = cell.isFreeSpace;
              const isMarked = cell.marked;
              const isNox = card.noxCell?.row === ri && card.noxCell?.col === ci;
              return (
                <div key={ri+'-'+ci} style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontWeight: 700, fontSize: '14px', fontFamily: 'monospace', backgroundColor: isFree ? 'rgba(255,215,0,0.12)' : isMarked ? 'rgba(0,229,255,0.12)' : 'transparent', color: isFree ? '#FFD700' : isMarked ? '#00E5FF' : 'rgba(255,255,255,0.5)', border: isNox && !card.noxHit ? '2px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.05)', boxShadow: isNox && card.noxHit ? '0 0 12px rgba(255,215,0,0.5)' : 'none' }}>
                  {isFree ? 'NOX' : cell.value}
                </div>
              );
            }))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
          <button onClick={prevCard} style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: '18px' }}>◀</button>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>{currentViewCard + 1} / {cards.length}</span>
          <button onClick={nextCard} style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: '18px' }}>▶</button>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          <button onClick={() => setViewingCards(false)} style={{ padding: '10px 24px', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '8px', color: '#FFD700', background: 'rgba(255,215,0,0.1)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Back to Results</button>
          <button onClick={handlePlayAgain} style={{ padding: '10px 24px', border: '1px solid rgba(0,229,255,0.3)', borderRadius: '8px', color: '#00E5FF', background: 'rgba(0,229,255,0.1)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Play Again</button>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'radial-gradient(ellipse at center, rgba(11,11,69,0.85), rgba(11,11,69,0.97))', backdropFilter: 'blur(8px)' }}>
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const distance = 120 + Math.random() * 80;
        return (
          <motion.div key={i} style={{ position: 'absolute', width: '8px', height: '8px', borderRadius: '50%', background: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#00F0FF' : '#00FF88' }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, opacity: 0, scale: 0 }}
            transition={{ duration: 1.2, delay: 0.2 + Math.random() * 0.3, ease: 'easeOut' }} />
        );
      })}
      <motion.div initial={{ scale: 0.5, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 18 }}
        style={{ position: 'relative', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '160px', height: '160px', background: '#FFD700', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.2, pointerEvents: 'none' }} />
        <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}
          style={{ fontSize: '80px', marginBottom: '24px', position: 'relative' }}>
          <motion.span style={{ display: 'inline-block' }} animate={{ y: [0, -8, 0], rotate: [0, -5, 5, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
            {isMultiplayerLoser ? clapEmoji : isNoWinner ? sparkleEmoji : isDoubleWin ? trophyEmoji + starEmoji : hasBingo ? trophyEmoji : starEmoji}
          </motion.span>
        </motion.div>
        <motion.h2 initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 15 }}
          style={{ fontSize: '48px', fontWeight: 700, marginBottom: '16px' }}>
          <span style={{ background: 'linear-gradient(to right, #FFD700, #fff3b0, #FFD700)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', backgroundSize: '200% 100%' }}>
            {isMultiplayerLoser ? (winnerName || 'Opponent') + ' Wins!' : isNoWinner ? 'NO WINNER' : isDoubleWin ? 'DOUBLE WIN!' : hasBingo ? 'BINGO!' : 'NOX BONUS!'}
          </span>
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          style={{ color: '#8B8BD4', marginBottom: '8px', fontSize: '18px' }}>
          {isMultiplayerLoser ? 'Better luck next time, ' + (playerName || 'Player') :
           isNoWinner ? 'Better luck next time' :
           isDoubleWin ? 'Card ' + ((winningCardIndex ?? 0) + 1) + ' wins + Nox bonus!' :
           hasBingo ? (isMultiplayerWinner ? 'You won! Card ' + ((winningCardIndex ?? 0) + 1) : 'Card ' + ((winningCardIndex ?? 0) + 1) + ' takes the win') :
           'Card ' + ((bonusCardIndex ?? 0) + 1) + ' hit the Nox bonus!'}
        </motion.p>
        {(hasBingo || hasBonus) && !isMultiplayerLoser && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} style={{ marginBottom: '24px' }}>
            {hasBingo && <motion.p animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ fontSize: '24px', fontWeight: 700, color: '#FFD700' }}>+100 NOX</motion.p>}
            {hasBonus && <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: '18px', fontWeight: 600, color: '#00E5FF', marginTop: '4px' }}>+25 NOX Bonus</motion.p>}
          </motion.div>
        )}
        <motion.button onClick={() => openCardViewer(hasBingo ? winningCardIndex! : 0)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          style={{ padding: '10px 24px', border: '1px solid rgba(255,215,0,0.4)', borderRadius: '8px', color: '#FFD700', background: 'rgba(255,215,0,0.08)', cursor: 'pointer', fontWeight: 600, fontSize: '14px', letterSpacing: '0.05em', marginBottom: '24px' }}
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          {eyeEmoji} {hasBingo ? 'View Winning Card' : 'View All Cards'}
        </motion.button>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5C5C9E', marginBottom: '8px' }}>Room Code</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
            {(isNewCodeRevealing ? revealedCode : roomCode).split('').map((char, i) => (
              <motion.span key={char+'-'+i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 + i * 0.04 }}
                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A5E', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '6px', fontSize: '16px', fontFamily: 'monospace', color: '#FFD700', fontWeight: 700 }}>{char}</motion.span>
            ))}
          </div>
        </motion.div>
        <motion.button onClick={handlePlayAgain} disabled={isNewCodeRevealing} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
          style={{ position: 'relative', padding: '4px 8px', margin: '16px', fontSize: '16px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(0,240,255,0.1))', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '8px', color: '#FFD700', cursor: 'pointer', opacity: isNewCodeRevealing ? 0.5 : 1 }}
          whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(255,215,0,0.2)' }} whileTap={{ scale: 0.97 }}>
          {isNewCodeRevealing ? <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ width: '8px', height: '8px', backgroundColor: '#FFD700', borderRadius: '50%' }} />GENERATING...</span> : 'PLAY AGAIN'}
        </motion.button>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
          style={{ marginTop: '32px', fontSize: '11px', color: '#5C5C9E', letterSpacing: '0.05em' }}>
          New room code generated automatically
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
export default VictoryOverlay;
