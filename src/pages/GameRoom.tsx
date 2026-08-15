import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
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
import { useSolanaContract } from '../hooks/useSolanaContract';
import { CARD_BUNDLES } from '../utils/cardBundles';
import { getLetterForNumber } from '../utils/gameLogic';

function GameRoom() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || 'solo';
  const playerName = searchParams.get('name') || 'Player';
  

  const { state: soloState, dispatch, deployCards } = useGameReducer();
  const multi = useMultiplayer();
  const { publicKey } = useWallet();
  const { payEntryFee } = useSolanaContract();
  const [payingFee, setPayingFee] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);
  const [selectedBundleId, setSelectedBundleId] = useState<string>(CARD_BUNDLES[0].id);

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
  const hasSyncedWallet = useRef(false);

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
    if (isMultiplayer && multi.error && multi.phase === 'idle' && multi.roomCode === null && hasConnected.current) {
      // roomCode/phase getting reset alongside an error message means
      // we were removed (kicked or wallet-timed-out), not just a
      // normal in-room error — bounce back to the home screen.
      const timer = setTimeout(() => navigate('/'), 2500);
      return () => clearTimeout(timer);
    }
  }, [isMultiplayer, multi.error, multi.phase, multi.roomCode, navigate]);

  useEffect(() => {
    if (isMultiplayer && !hasConnected.current) {
      hasConnected.current = true;
      const wallet = publicKey?.toBase58() || null;
      // Connection is automatic - just wait and send the command
      if (mode === 'create') {
        setTimeout(() => multi.createRoom(playerName, wallet), 800);
      } else if (mode === 'join' && roomCode) {
        setTimeout(() => multi.joinRoom(roomCode, playerName, wallet), 800);
      }
    }
  }, [isMultiplayer, mode, roomCode, playerName, publicKey]);

  // If the wallet connects after the room's already been created/joined,
  // push the address up once it lands — needed so the server knows
  // where to send a payout if this player wins.
  useEffect(() => {
    if (isMultiplayer && publicKey && multi.playerId && !hasSyncedWallet.current) {
      hasSyncedWallet.current = true;
      multi.setWallet(publicKey.toBase58());
    }
  }, [isMultiplayer, publicKey, multi.playerId]);

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
  const totalBonusAmount = isMultiplayer 
    ? multi.bonusAmounts.reduce((sum, a) => sum + a, 0)
    : 25;
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
        updateBalance(totalBonusAmount);
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

  async function handlePayEntryFee() {
    const bundle = CARD_BUNDLES.find(b => b.id === selectedBundleId);
    if (!bundle) return;
    setFeeError(null);
    setPayingFee(true);
    try {
      const signature = await payEntryFee(bundle.priceOren);
      multi.submitEntryFee(signature, bundle.id);
    } catch (err) {
      console.error('payEntryFee failed:', err);
      setFeeError('Payment failed or was rejected. Check your OREN balance and try again.');
    } finally {
      setPayingFee(false);
    }
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
                <p key={p.id} className="text-white text-lg flex items-center gap-2">
                  {p.name} {p.id === (myPlayerId.current || multi.playerId) ? '(You)' : ''}
                  {!p.walletAddress && (
                    <span style={{ color: '#5C5C9E', fontSize: '12px' }}>(no wallet)</span>
                  )}
                  {p.walletAddress && !p.paidEntryFee && (
                    <span style={{ color: '#FFD700', fontSize: '12px' }}>(unpaid)</span>
                  )}
                  {p.paidEntryFee && (
                    <span style={{ color: '#00E5FF', fontSize: '12px' }}>
                      ({p.cardCount} card{p.cardCount === 1 ? '' : 's'})
                    </span>
                  )}
                  {isHost && p.id !== (myPlayerId.current || multi.playerId) && (
                    <button
                      onClick={() => multi.removePlayer(p.id)}
                      style={{ fontSize: '11px', color: '#FF6464', background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </p>
              ))}
            </div>

            <div className="flex flex-col items-center gap-2">
              <WalletMultiButton />
              {!publicKey && (
                <p style={{ color: '#8B8BD4', fontSize: '12px', textAlign: 'center', maxWidth: '260px' }}>
                  Connect a Solana wallet to play. You'll be removed from the room if you don't connect within 90 seconds.
                </p>
              )}
            </div>

            {publicKey && !(multi.players.find(p => p.id === (myPlayerId.current || multi.playerId))?.paidEntryFee) && (
              <div className="flex flex-col items-center gap-3">
                <p style={{ color: '#5C5C9E', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Choose your cards
                </p>
                <div className="flex gap-2">
                  {CARD_BUNDLES.map(bundle => {
                    const isSelected = bundle.id === selectedBundleId;
                    return (
                      <button
                        key={bundle.id}
                        onClick={() => setSelectedBundleId(bundle.id)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.15)',
                          background: isSelected ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
                          color: isSelected ? '#FFD700' : '#8B8BD4',
                          cursor: 'pointer',
                          textAlign: 'center',
                          minWidth: '90px',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{bundle.label}</div>
                        <div style={{ fontSize: '13px', marginTop: '4px' }}>{bundle.priceOren} OREN</div>
                      </button>
                    );
                  })}
                </div>
                <motion.button
                  onClick={handlePayEntryFee}
                  disabled={payingFee}
                  style={{
                    padding: '12px 32px',
                    fontSize: '15px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    backgroundColor: 'rgba(255,215,0,0.1)',
                    border: '1px solid rgba(255,215,0,0.4)',
                    borderRadius: '10px',
                    color: '#FFD700',
                    cursor: payingFee ? 'wait' : 'pointer',
                    opacity: payingFee ? 0.6 : 1,
                  }}
                  whileHover={{ scale: payingFee ? 1 : 1.03 }}
                  whileTap={{ scale: payingFee ? 1 : 0.97 }}
                >
                  {payingFee ? 'Sending…' : `Pay ${CARD_BUNDLES.find(b => b.id === selectedBundleId)?.priceOren ?? ''} OREN`}
                </motion.button>
                {(feeError || multi.entryFeeError) && (
                  <p style={{ color: '#FF6464', fontSize: '12px', textAlign: 'center', maxWidth: '280px' }}>
                    {feeError || multi.entryFeeError}
                  </p>
                )}
                <p style={{ color: '#8B8BD4', fontSize: '12px', textAlign: 'center', maxWidth: '280px' }}>
                  You'll be removed from the room if you don't pay within 90 seconds of connecting.
                </p>
              </div>
            )}

            {(() => {
              const notReady = multi.players.filter(p => !p.walletAddress || !p.paidEntryFee);
              const allReady = notReady.length === 0;
              return (
                <>
                  {!allReady && (
                    <p style={{ color: '#FFD700', fontSize: '13px', textAlign: 'center', maxWidth: '320px' }}>
                      Waiting on {notReady.map(p => p.name).join(', ')} to connect a wallet and pay for{' '}
                      cards — the game can't start until everyone has.
                    </p>
                  )}
                  {isHost && (
                    <motion.button
                      onClick={handleStartGame}
                      disabled={!allReady}
                      style={{
                        padding: '14px 40px',
                        fontSize: '16px',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        backgroundColor: '#1A1A5E',
                        border: '1px solid rgba(0,229,255,0.5)',
                        borderRadius: '12px',
                        color: allReady ? '#00E5FF' : '#3A3A6E',
                        cursor: allReady ? 'pointer' : 'not-allowed',
                        opacity: allReady ? 1 : 0.5,
                      }}
                      whileHover={{ scale: allReady ? 1.02 : 1 }}
                      whileTap={{ scale: allReady ? 0.98 : 1 }}
                    >
                      Start Game
                    </motion.button>
                  )}
                </>
              );
            })()}
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
              {multi.error ? (
                <p style={{ color: '#FF6464', fontSize: '15px', maxWidth: '280px' }}>{multi.error}</p>
              ) : (
                <>
                  <div className="w-16 h-16 border-2 border-neon-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[#5C5C9E] tracking-wider uppercase text-sm">Connecting...</p>
                </>
              )}
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
            /* Payout is server-initiated and automatic — these just
               reflect status as it comes in over the socket. */
            payoutSignature={multi.payoutSignature}
            payoutError={multi.payoutError}
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