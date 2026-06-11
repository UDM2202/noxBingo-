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
import { useAudio } from '../hooks/useAudio';
import { getLetterForNumber } from '../utils/gameLogic';

function GameRoom() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { state, dispatch, deployCards } = useGameReducer();
  const [showVictory, setShowVictory] = useState(false);
  const [victoryPhase, setVictoryPhase] = useState<'winning-cell' | 'card-scale' | 'caller-freeze' | 'overlay' | null>(null);
  const victoryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { play, speakNumber, soundEnabled, toggleSound } = useAudio();

  // Track previous values to detect actual changes
  const prevDrawIndex = useRef(-1);
  const prevPhase = useRef(state.phase);
  const hasPlayedGameStart = useRef(false);

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

  // Countdown beeps
  useEffect(() => {
    if (state.phase === 'countdown' && state.countdownValue > 0 && state.countdownValue <= 3) {
      play('countdown');
    }
  }, [state.phase, state.countdownValue, play]);

  // Game start whoosh — only once when cards deploy
  useEffect(() => {
    if (state.phase === 'playing' && !hasPlayedGameStart.current && state.cards.length > 0) {
      hasPlayedGameStart.current = true;
      play('gameStart');
    }
    if (state.phase !== 'playing') {
      hasPlayedGameStart.current = false;
    }
  }, [state.phase, state.cards.length, play]);

  // Ball draw sound + voice — fires when draw index changes
  useEffect(() => {
    if (state.phase === 'playing' && state.currentDrawIndex >= 0) {
      if (state.currentDrawIndex !== prevDrawIndex.current) {
        prevDrawIndex.current = state.currentDrawIndex;

        const ball = state.drawSequence[state.currentDrawIndex];
        if (ball) {
          play('ballDraw');
          const letter = getLetterForNumber(ball);
          setTimeout(() => {
            speakNumber(letter, ball);
          }, 300);
        }
      }
    } else {
      prevDrawIndex.current = -1;
    }
  }, [state.phase, state.currentDrawIndex, state.drawSequence, play, speakNumber]);

  // Win fanfare — only on actual win, not loss
  useEffect(() => {
    if (state.phase === 'finished' && prevPhase.current !== 'finished') {
      const hasWin = state.winningCardIndex !== null || state.bonusWinner !== null;
      if (hasWin) {
        play('win');
      }
    }
    prevPhase.current = state.phase;
  }, [state.phase, state.winningCardIndex, state.bonusWinner, play]);

  // Victory choreography — triggers for both win and no-winner
  useEffect(() => {
    if (state.phase === 'finished' && !showVictory) {
      const hasWin = state.winningCardIndex !== null || state.bonusWinner !== null;

      if (hasWin) {
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
      } else {
        // No winner — show overlay after a short pause
        victoryTimerRef.current = setTimeout(() => {
          setShowVictory(true);
        }, 600);
      }
    }

    return () => {
      if (victoryTimerRef.current) {
        clearTimeout(victoryTimerRef.current);
      }
    };
  }, [state.phase, state.winningCardIndex, state.bonusWinner, showVictory]);

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
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />

      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ paddingTop: '12px' }}>
        {(state.phase === 'playing' || state.phase === 'finished') && (
          <motion.div
            className="flex flex-col items-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ marginBottom: '28px' }}>
              <QuantumCaller
                currentBall={currentBall}
                isDrawing={state.phase === 'playing'}
                isFrozen={victoryPhase === 'caller-freeze' || victoryPhase === 'overlay'}
                winningCardIndex={state.winningCardIndex}
              />
            </div>

            {drawnBalls.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <DrawnSequence balls={drawnBalls} />
              </div>
            )}
          </motion.div>
        )}

        {(state.phase === 'playing' || state.phase === 'finished') && (
          <motion.div
            className="flex justify-center gap-4 px-2 flex-wrap w-full"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {state.cards.map((card, index) => {
              const isWinner = state.winningCardIndex === index;
              const hasWinner = state.winningCardIndex !== null;

              return (
                <motion.div
                  key={card.id}
                  animate={{
                    opacity: hasWinner && !isWinner ? 0.2 : 1,
                    scale: isWinner && victoryPhase === 'card-scale' ? 1.12 : 1,
                    zIndex: isWinner ? 10 : 1,
                    filter: hasWinner && !isWinner ? 'blur(2px)' : 'blur(0px)',
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  <HoloCard
                    card={card}
                    cardIndex={index}
                    drawnNumbers={state.drawnNumbers}
                    currentBall={currentBall}
                    isWinning={isWinner}
                    victoryPhase={victoryPhase}
                    onCellClick={(row, col) => {
                      if (state.phase === 'playing') {
                        dispatch({ type: 'MARK_CELL', cardIndex: index, row, col });
                      }
                    }}
                  />
                </motion.div>
              );
            })}
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
        {showVictory && state.phase === 'finished' && (
          <VictoryOverlay
            winningCardIndex={state.winningCardIndex}
            bonusCardIndex={state.bonusWinner}
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