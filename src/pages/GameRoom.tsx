import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameReducer } from '../hooks/useGameReducer';
import { useDrawLoop } from '../hooks/useDrawLoop';
import HeaderBar from '../components/HeaderBar';
import QuantumCaller from '../components/QuantumCaller';
import DrawnSequence from '../components/DrawnSequence';
import HoloCard from '../components/HoloCard';
import VictoryOverlay from '../components/VictoryOverlay';
import CountdownOverlay from '../components/CountdownOverlay';

function GameRoom() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { state, dispatch, deployCards } = useGameReducer();
  const [showVictory, setShowVictory] = useState(false);
  const [victoryPhase, setVictoryPhase] = useState<'winning-cell' | 'card-scale' | 'caller-freeze' | 'overlay' | null>(null);
  const victoryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useDrawLoop(state.phase, state.currentDrawIndex, state.drawSequence.length, dispatch);

  useEffect(() => {
    if (roomCode === 'new') {
      dispatch({ type: 'START_COUNTDOWN' });
    }
  }, [roomCode, dispatch]);

  useEffect(() => {
    if (state.phase === 'countdown' && state.countdownValue > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'TICK_COUNTDOWN' });
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (state.phase === 'countdown' && state.countdownValue === 0) {
      deployCards();
    }
  }, [state.phase, state.countdownValue, deployCards, dispatch]);

  useEffect(() => {
    if (state.winningCardIndex !== null && state.phase === 'finished' && !showVictory) {
      setVictoryPhase('winning-cell');

      victoryTimerRef.current = setTimeout(() => {
        setVictoryPhase('card-scale');
      }, 400);

      victoryTimerRef.current = setTimeout(() => {
        setVictoryPhase('caller-freeze');
      }, 800);

      victoryTimerRef.current = setTimeout(() => {
        setVictoryPhase('overlay');
        setShowVictory(true);
      }, 1200);
    }

    return () => {
      if (victoryTimerRef.current) {
        clearTimeout(victoryTimerRef.current);
      }
    };
  }, [state.winningCardIndex, state.phase, showVictory]);

  function handlePlayAgain() {
    setShowVictory(false);
    setVictoryPhase(null);
    dispatch({ type: 'START_COUNTDOWN' });
  }

  function handleBackToLobby() {
    navigate('/');
  }

  const currentBall = state.currentDrawIndex >= 0 && state.currentDrawIndex < state.drawSequence.length
    ? state.drawSequence[state.currentDrawIndex]
    : null;

  const drawnBalls = state.drawSequence.slice(0, state.currentDrawIndex + 1);
  const isNearMiss = state.nearMissStates.some(count => count === 1);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AnimatePresence>
        {state.phase === 'countdown' && (
          <CountdownOverlay value={state.countdownValue} />
        )}
      </AnimatePresence>

      <HeaderBar
        roomCode={state.roomCode || roomCode || '------'}
        ballsDrawn={state.currentDrawIndex + 1}
        totalBalls={75}
        isLive={state.phase === 'playing'}
        isNearMiss={isNearMiss}
        onBackToLobby={handleBackToLobby}
      />

      {/* Scrollable game area — fits caller + cards without cutoff */}
<div className="flex-1 overflow-y-auto px-4 pb-4" style={{ paddingTop: '12px' }}>
        {(state.phase === 'playing' || state.phase === 'finished') && (
          <motion.div
            className="flex flex-col items-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Quantum Caller — tighter margin */}
            <div style={{ marginBottom: '28px' }}>
              <QuantumCaller
                currentBall={currentBall}
                isDrawing={state.phase === 'playing'}
                isFrozen={victoryPhase === 'caller-freeze' || victoryPhase === 'overlay'}
                winningCardIndex={state.winningCardIndex}
              />
            </div>

            {/* Drawn Sequence — tighter margin */}
            {drawnBalls.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <DrawnSequence balls={drawnBalls} />
              </div>
            )}
          </motion.div>
        )}

        {/* Cards Grid */}
        {(state.phase === 'playing' || state.phase === 'finished') && (
          <motion.div
            className="flex justify-center gap-5 px-2 flex-wrap w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {state.cards.map((card, index) => (
              <HoloCard
                key={card.id}
                card={card}
                cardIndex={index}
                drawnNumbers={state.drawnNumbers}
                currentBall={currentBall}
                isWinning={state.winningCardIndex === index}
                victoryPhase={victoryPhase}
                onCellClick={(row, col) => {
                  if (state.phase === 'playing') {
                    dispatch({ type: 'MARK_CELL', cardIndex: index, row, col });
                  }
                }}
              />
            ))}
          </motion.div>
        )}

        {state.phase === 'countdown' && state.countdownValue === 0 && (
          <div className="flex items-center justify-center min-h-[300px]">
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 border-2 border-neon-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400 tracking-wider uppercase text-sm">
                Deploying Cards...
              </p>
            </motion.div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showVictory && state.winningCardIndex !== null && (
          <VictoryOverlay
            winningCardIndex={state.winningCardIndex}
            roomCode={state.roomCode}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </AnimatePresence>

      {isNearMiss && state.phase === 'playing' && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.03, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(ellipse at center, #FFD700 0%, transparent 70%)',
          }}
        />
      )}
    </div>
  );
}

export default GameRoom;
