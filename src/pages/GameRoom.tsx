import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameReducer } from '../hooks/useGameReducer';
import { useDrawLoop } from '../hooks/useDrawLoop';
import { useMultiplayer } from '../hooks/useMultiplayer';
import HeaderBar from '../components/HeaderBar';
import QuantumCaller from '../components/QuantumCaller';
import DrawnSequence from '../components/DrawnSequence';
import HoloCard from '../components/HoloCard';
import VictoryOverlay from '../components/VictoryOverlay';
import CountdownOverlay from '../components/CountdownOverlay';
import AudioSettings from '../components/AudioSettings';
import { useAudio } from '../hooks/useAudio';
import { useAuth } from '../hooks/useAuth';
import { getLetterForNumber } from '../utils/gameLogic';

function GameRoom() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || 'solo';
  const playerName = searchParams.get('name') || 'Player';
  

  const { state: soloState, dispatch, deployCards } = useGameReducer();
  const multi = useMultiplayer();

  const [showVictory, setShowVictory] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [victoryPhase, setVictoryPhase] = useState<'winning-cell' | 'card-scale' | 'caller-freeze' | 'overlay' | null>(null);
  const victoryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { play, speakNumber, soundEnabled, toggleSound, voicePreset, changeVoice, previewVoice } = useAudio();
  const { saveGameResult, getBalance } = useAuth();

  const prevDrawIndex = useRef(-1);
  const prevPhase = useRef(soloState.phase);
  const hasPlayedGameStart = useRef(false);
  const hasConnected = useRef(false);

  const isMultiplayer = mode === 'create' || mode === 'join';
  const [balance, setBalance] = useState(() => {
    // Load from DB async - start with localStorage fallback
    return 1000;
  });
  useEffect(() => {
    getBalance().then(bal => setBalance(bal));
  }, []);
  

  useEffect(() => {
    getBalance().then(bal => setBalance(bal));
  }, []);

  
  const [isHost] = useState(mode === 'create');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const myPlayerId = useRef<string | null>(null);

  useEffect(() => {
    if (isMultiplayer && !hasConnected.current) {
      hasConnected.current = true;
      // Connection is automatic - just wait and send the command
      if (mode === 'create') {
        setTimeout(() => multi.createRoom(playerName), 800);
      } else if (mode === 'join' && roomCode) {
        setTimeout(() => multi.joinRoom(roomCode, playerName), 800);
      }
    }
  }, [isMultiplayer, mode, roomCode, playerName]);

  useEffect(() => {
    if (!isMultiplayer && roomCode === 'new') {
      dispatch({ type: 'START_COUNTDOWN' });
    }
  }, [isMultiplayer, roomCode, dispatch]);

  useEffect(() => {
    if (isMultiplayer) return;
    if (soloState.phase === 'countdown' && soloState.countdownValue > 0) {
      const timer = setTimeout(() => dispatch({ type: 'TICK_COUNTDOWN' }), 1000);
      return () => clearTimeout(timer);
    }
    if (soloState.phase === 'countdown' && soloState.countdownValue === 0) {
      deployCards();
    }
  }, [isMultiplayer, soloState.phase, soloState.countdownValue, deployCards, dispatch]);

  useDrawLoop(
    (isMultiplayer ? 'countdown' : soloState.phase) ,
    soloState.currentDrawIndex,
    soloState.drawSequence.length,
    dispatch
  );

  const phase = (isMultiplayer ? multi.phase : soloState.phase) ;
  const cards = isMultiplayer ? multi.cards : soloState.cards;
  const currentBall = isMultiplayer
    ? multi.currentBall
    : soloState.currentDrawIndex >= 0
      ? soloState.drawSequence[soloState.currentDrawIndex]
      : null;
  const drawnBalls = isMultiplayer
    ? multi.drawnBalls
    : soloState.drawSequence.slice(0, soloState.currentDrawIndex + 1);
  const winningCardIndex = isMultiplayer
    ? (multi.winningPlayerId === multi.playerId ? multi.cardIndex : null)
    : soloState.winningCardIndex;
  const bonusWinner = isMultiplayer
    ? (multi.bonusWinnerId === multi.playerId ? 0 : null)
    : soloState.bonusWinner;
  const isMultiplayerWinner = isMultiplayer && multi.winningPlayerId === multi.playerId;
  const isMultiplayerLoser = isMultiplayer && multi.winningPlayerId !== null && multi.winningPlayerId !== '' && multi.winningPlayerId !== multi.playerId;
  const winnerName = isMultiplayer ? multi.winningPlayerName : null;
  const isNearMiss = false;
  if (isMultiplayer && multi.playerId && !myPlayerId.current) {
    myPlayerId.current = multi.playerId;
  }
  const displayRoomCode = isMultiplayer ? multi.roomCode : soloState.roomCode || roomCode || '------';

  useEffect(() => {
    if (phase === 'countdown' && soloState.countdownValue > 0 && soloState.countdownValue <= 3) {
      play('countdown');
    }
  }, [phase, soloState.countdownValue, play]);

  useEffect(() => {
    if (phase === 'playing' && !hasPlayedGameStart.current && cards.length > 0) {
      hasPlayedGameStart.current = true;
      play('gameStart');
    }
    if (phase !== 'playing') hasPlayedGameStart.current = false;
  }, [phase, cards.length, play]);

  useEffect(() => {
    if (phase === 'playing' && currentBall !== null) {
      if (currentBall !== prevDrawIndex.current) {
        prevDrawIndex.current = currentBall as number;
        play('ballDraw');
        const letter = getLetterForNumber(currentBall as number);
        setTimeout(() => speakNumber(letter, currentBall as number), 300);
      }
    } else {
      prevDrawIndex.current = -1;
    }
  }, [phase, currentBall, play, speakNumber]);

  useEffect(() => {
    if (phase === 'finished' && prevPhase.current !== 'finished') {
      const hasWin = winningCardIndex !== null || bonusWinner !== null;
      if (hasWin) {
      play('win');
      if (winningCardIndex !== null) {
        updateBalance(100);
        saveGameResult('win', 100, displayRoomCode || 'solo', mode);
      }
      if (bonusWinner !== null) {
        updateBalance(25);
        saveGameResult('bonus', 25, displayRoomCode || 'solo', mode);
      }
    } else if (phase === 'finished') {
      saveGameResult('loss', 0, displayRoomCode || 'solo', mode);
    }
    }
    prevPhase.current = phase;
  }, [phase, winningCardIndex, bonusWinner, play]);

  useEffect(() => {
    if (phase === 'finished' && !showVictory) {
      const hasWin = winningCardIndex !== null || bonusWinner !== null;
      if (hasWin) {
        setVictoryPhase('winning-cell');
        victoryTimerRef.current = setTimeout(() => setVictoryPhase('card-scale'), 400);
        victoryTimerRef.current = setTimeout(() => setVictoryPhase('caller-freeze'), 800);
        victoryTimerRef.current = setTimeout(() => {
          setVictoryPhase('overlay');
          setShowVictory(true);
        }, 1200);
      } else {
        victoryTimerRef.current = setTimeout(() => setShowVictory(true), 600);
      }
    }
    return () => { if (victoryTimerRef.current) clearTimeout(victoryTimerRef.current); };
  }, [phase, winningCardIndex, bonusWinner, showVictory]);

  function updateBalance(amount: number) {
    const newBal = balance + amount;
    setBalance(newBal);
    localStorage.setItem('noxbingo-balance', String(newBal));
  }
  function handlePlayAgain() {
    setShowVictory(false);
    setVictoryPhase(null);
    if (isMultiplayer) {
      multi.leaveRoom();
      navigate('/');
    } else {
      dispatch({ type: 'START_COUNTDOWN' });
    }
  }

  function handleBackToLobby() {
    if (phase === 'playing') {
      setShowLeaveConfirm(true);
      return;
    }
    if (isMultiplayer) multi.leaveRoom();
    navigate('/');
  }

  function confirmLeave() {
    setShowLeaveConfirm(false);
    if (isMultiplayer) multi.leaveRoom();
    navigate('/');
  }

  function handleStartGame() {
    multi.startGame();
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AnimatePresence>
        {phase === 'countdown' && <CountdownOverlay value={soloState.countdownValue} />}
      </AnimatePresence>

      <HeaderBar
        roomCode={displayRoomCode || '------'}
        ballsDrawn={drawnBalls.length}
        totalBalls={75}
        isLive={phase === 'playing'}
        isNearMiss={isNearMiss}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onOpenSettings={() => setShowAudioSettings(true)}
        onBackToLobby={handleBackToLobby}
        balance={balance}
      />

      <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ paddingTop: '12px' }}>
        {isMultiplayer && phase === 'lobby' && (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
            <p className="text-[#8B8BD4] text-xl">Room: {multi.roomCode}</p>
            <div className="flex flex-col gap-2 items-center">
              <p className="text-[#5C5C9E] text-sm uppercase tracking-wider">Players</p>
              {multi.players.map(p => (
                <p key={p.id} className="text-white text-lg">{p.name} {p.id === (myPlayerId.current || multi.playerId) ? '(You)' : ''}</p>
              ))}
            </div>
            {isHost && (
              <motion.button
                onClick={handleStartGame}
                style={{
                  padding: '14px 40px',
                  fontSize: '16px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  backgroundColor: '#1A1A5E',
                  border: '1px solid rgba(0,229,255,0.5)',
                  borderRadius: '12px',
                  color: '#00E5FF',
                  cursor: 'pointer',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Game
              </motion.button>
            )}
            {multi.error && <p className="text-red-400 text-sm">{multi.error}</p>}
          </div>
        )}

        {(phase === 'playing' || phase === 'finished') && (
          <>
            <motion.div
              className="flex flex-col items-center w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div style={{ marginBottom: '12px' }}>
                <QuantumCaller
                  currentBall={currentBall}
                  isDrawing={phase === 'playing'}
                  isFrozen={victoryPhase === 'caller-freeze' || victoryPhase === 'overlay'}
                  winningCardIndex={winningCardIndex}
                />
              </div>
              {drawnBalls.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <DrawnSequence balls={drawnBalls} />
                </div>
              )}
            </motion.div>

            <motion.div
              className="flex justify-center gap-3 px-1 flex-wrap w-full"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {cards.map((card, index) => {
                const isWinner = winningCardIndex === index;
                const hasWinner = winningCardIndex !== null;
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
                      drawnNumbers={new Set(drawnBalls)}
                      currentBall={currentBall}
                      isWinning={isWinner}
                      victoryPhase={victoryPhase}
                      onCellClick={() => {}}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}

        {isMultiplayer && phase === 'idle' && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-2 border-neon-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#5C5C9E] tracking-wider uppercase text-sm">Connecting...</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showVictory && phase === 'finished' && (
          <VictoryOverlay
            winningCardIndex={winningCardIndex}
            bonusCardIndex={bonusWinner}
            roomCode={displayRoomCode || ''}
            cards={cards}
            onPlayAgain={handlePlayAgain}
            onBackToLobby={handleBackToLobby}
            isMultiplayerWinner={isMultiplayerWinner}
            isMultiplayerLoser={isMultiplayerLoser}
            winnerName={winnerName}
            playerName={playerName}
          />
        )}
      {showLeaveConfirm && (
  <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11,11,69,0.9)', backdropFilter: 'blur(4px)' }}>
    <div style={{ backgroundColor: '#1A1A5E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '32px', maxWidth: '380px', textAlign: 'center' }}>
      <p style={{ fontSize: '18px', fontWeight: 600, color: '#FFD700', marginBottom: '12px' }}>Leave Game?</p>
      <p style={{ fontSize: '14px', color: '#8B8BD4', marginBottom: '24px' }}>Your game is still in progress. Are you sure you want to quit?</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button onClick={() => setShowLeaveConfirm(false)} style={{ padding: '10px 24px', border: '1px solid rgba(0,229,255,0.3)', borderRadius: '8px', color: '#00E5FF', background: 'rgba(0,229,255,0.1)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Stay</button>
        <button onClick={confirmLeave} style={{ padding: '10px 24px', border: '1px solid rgba(255,100,100,0.3)', borderRadius: '8px', color: '#FF6464', background: 'rgba(255,100,100,0.1)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Leave</button>
      </div>
    </div>
  </div>
)}
</AnimatePresence>
<AudioSettings
        isOpen={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        voicePreset={voicePreset}
        onChangeVoice={changeVoice}
        onPreviewVoice={previewVoice}
      />
    </div>
  );
}

export default GameRoom;


































