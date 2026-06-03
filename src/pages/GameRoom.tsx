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

  // Start the draw loop
  useDrawLoop(state.phase, state.currentDrawIndex, state.drawSequence.length, dispatch);

  // Initialize room on mount
  useEffect(() => {
    if (roomCode === 'new') {
      dispatch({ type: 'START_COUNTDOWN' });
    }
  }, [roomCode, dispatch]);

  // Countdown logic
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

  // Victory choreography
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
    <div className="min-h-screen flex flex-col">
      {/* Countdown overlay */}
      <AnimatePresence>
        {state.phase === 'countdown' && (
          <CountdownOverlay value={state.countdownValue} />
        )}
      </AnimatePresence>

      {/* Header */}
      <HeaderBar
        roomCode={state.roomCode || roomCode || '------'}
        ballsDrawn={state.currentDrawIndex + 1}
        totalBalls={75}
        isLive={state.phase === 'playing'}
        isNearMiss={isNearMiss}
        onBackToLobby={handleBackToLobby}
      />

       {/* Main game area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-6" style={{ paddingTop: '40px' }}>
        
        {/* Caller + Drawn Sequence */}
        {(state.phase === 'playing' || state.phase === 'finished') && (
          <motion.div
            className="flex flex-col items-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Quantum Caller */}
            <div style={{ marginBottom: '48px' }}>
              <QuantumCaller
                currentBall={currentBall}
                isDrawing={state.phase === 'playing'}
                isFrozen={victoryPhase === 'caller-freeze' || victoryPhase === 'overlay'}
                winningCardIndex={state.winningCardIndex}
              />
            </div>

            {/* Drawn Sequence */}
            {drawnBalls.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <DrawnSequence balls={drawnBalls} />
              </div>
            )}
          </motion.div>
        )}

        {/* Cards Grid — centered */}
        {(state.phase === 'playing' || state.phase === 'finished') && (
          <motion.div
            className="flex justify-center gap-7 mt-10 px-4 flex-wrap w-full"
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

        {/* Deploying spinner */}
        {state.phase === 'countdown' && state.countdownValue === 0 && (
          <div className="flex items-center justify-center">
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

      {/* Victory Overlay */}
      <AnimatePresence>
        {showVictory && state.winningCardIndex !== null && (
          <VictoryOverlay
            winningCardIndex={state.winningCardIndex}
            roomCode={state.roomCode}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </AnimatePresence>

      {/* Near-miss ambient effect */}
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