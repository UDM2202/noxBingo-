import { useEffect, useRef, useState, useCallback } from 'react';
import type { BingoCard } from '../types/game';
import { CARD_BUNDLES, DEFAULT_OREN_TO_GBP_RATE, DEFAULT_GBP_TO_USDT_RATE, type CardBundle } from '../utils/cardBundles';
import { supabase } from '../lib/supabase';
import { saveSession, updateSession, clearSession, type StoredSession, type GameMode } from '../utils/gameSession';
type ServerMessage = {
  type: string;
  [key: string]: any;
};
type PlayerInfo = {
  id: string;
  name: string;
  walletAddress: string | null;
  paidEntryFee: boolean;
  bundleId: string | null;
  cardCount: number;
  // False while this player's connection is down and their seat is held.
  connected?: boolean;
};
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting';
export type ResumeFailure = {
  reason: 'expired' | 'invalid' | 'already_in_room' | string;
  // Whether the game had started before the seat was lost.
  roomStarted: boolean;
};
type MultiplayerState = {
  connected: boolean;
  connectionStatus: ConnectionStatus;
  // True while a lost seat is being restored (from sending `resume`
  // until `resume_complete`). Messages in that window are replays.
  resuming: boolean;
  resumeFailed: ResumeFailure | null;
  // Another tab or window took over this seat; this one stops.
  sessionReplaced: boolean;
  hasStoredSession: boolean;
  storedRoomCode: string | null;
  roomCode: string | null;
  playerId: string | null;
  hostId: string | null;
  maxPlayers: number;
  players: PlayerInfo[];
  phase: 'idle' | 'lobby' | 'countdown' | 'playing' | 'finished';
  cards: BingoCard[];
  currentBall: number | null;
  currentLetter: string | null;
  drawnBalls: number[];
  winningPlayerId: string | null;
  winningPlayerName: string | null;
  bonusWinnerId: string | null;
  bonusWinnerName: string | null;
  // This player's own cards whose NOX number has been drawn. Each one
  // earns its own bonus.
  myBonusCardIndexes: number[];
  // Set when this room was rebuilt by a resume. replayBallCount is how
  // many of drawnBalls came from the replay (all of them until
  // resume_complete); only balls after that were drawn live.
  restored: boolean;
  replayBallCount: number;
  cardIndex: number | null;
  error: string | null;
  noxBonusDisplay: number;
  entryFeeError: string | null;
  hostChangeNotice: string | null;
  payoutSignature: string | null;
  payoutAmount: number | null;
  payoutError: string | null;
  // This room's real bundles/rates, sent by the server on
  // room_created — falls back to client defaults only until that
  // first message arrives.
  bundles: CardBundle[];
  orenToGbpRate: number;
  gbpToUsdtRate: number;
  // Prize info for the payment screen, from room_created.
  isSolo: boolean | null;
  soloMultipliers: Record<string, number>;
  rakePercent: number | null;
  // Jackpot — shown as a hook once room_created arrives. Odds are
  // deliberately never sent by the server, so there's no field for
  // them here.
  jackpotEnabled: boolean;
  jackpotAmountOren: number;
  // Set the moment the server announces a jackpot hit (before the
  // on-chain transfer even starts) so the UI can show something
  // immediately rather than waiting for the payout to confirm.
  jackpotWon: boolean;
  jackpotWinnerId: string | null;
  jackpotWinnerName: string | null;
  jackpotWonAmount: number | null;
  jackpotSignature: string | null;
  jackpotError: string | null;
  // True for a free practice game (solo, not signed in): no wallet, no
  // payment, no prizes. Decided by the server.
  practice: boolean;
  // One-time message the server asks the wallet to sign, proving the
  // player controls the address they connect.
  walletChallenge: string | null;
};

// Everything about the current room, reset when leaving it or when a
// resume rebuilds it from the server's replay.
function roomDefaults() {
  return {
    roomCode: null,
    playerId: null,
    hostId: null,
    maxPlayers: 6,
    players: [] as PlayerInfo[],
    phase: 'idle' as const,
    cards: [] as BingoCard[],
    currentBall: null,
    currentLetter: null,
    drawnBalls: [] as number[],
    winningPlayerId: null,
    winningPlayerName: null,
    bonusWinnerId: null,
    bonusWinnerName: null,
    myBonusCardIndexes: [] as number[],
    restored: false,
    replayBallCount: 0,
    cardIndex: null,
    error: null,
    noxBonusDisplay: 25,
    entryFeeError: null,
    hostChangeNotice: null,
    payoutSignature: null,
    payoutAmount: null,
    payoutError: null,
    bundles: CARD_BUNDLES,
    orenToGbpRate: DEFAULT_OREN_TO_GBP_RATE,
    gbpToUsdtRate: DEFAULT_GBP_TO_USDT_RATE,
    isSolo: null,
    soloMultipliers: {} as Record<string, number>,
    rakePercent: null,
    jackpotEnabled: false,
    jackpotAmountOren: 0,
    jackpotWon: false,
    jackpotWinnerId: null,
    jackpotWinnerName: null,
    jackpotWonAmount: null,
    jackpotSignature: null,
    jackpotError: null,
    practice: false,
  };
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
// Wait before each reconnect attempt; the last value repeats.
const RECONNECT_DELAYS_MS = [500, 1000, 2000, 4000, 8000];

type Options = {
  // A stored seat this page should take back once connected. The page
  // decides, so a leftover session for a different game isn't resumed.
  resumeSession?: StoredSession | null;
};

export function useMultiplayer({ resumeSession = null }: Options = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const pendingRef = useRef<string[]>([]);
  // Outgoing messages wait until this is true: after `identify`, and
  // after a resume has restored the seat (so, for example, a queued
  // submit_entry_fee only goes out once the server knows who we are).
  const gateOpenRef = useRef(false);
  const activeSessionRef = useRef<StoredSession | null>(resumeSession);
  const lastRequestRef = useRef<{ mode: GameMode; playerName: string; maxPlayers?: number } | null>(null);
  const replacedRef = useRef(false);
  // Whether the seat a failed resume was for belonged to a started game.
  const failedRoomStartedRef = useRef(false);
  const everConnectedRef = useRef(false);
  const attemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const [state, setState] = useState<MultiplayerState>(() => ({
    ...roomDefaults(),
    connected: false,
    connectionStatus: 'connecting',
    resuming: !!resumeSession,
    resumeFailed: null,
    sessionReplaced: false,
    hasStoredSession: !!resumeSession,
    storedRoomCode: resumeSession?.roomCode ?? null,
    walletChallenge: null,
  }));

  const setActiveSession = useCallback((session: StoredSession | null) => {
    activeSessionRef.current = session;
    if (session) saveSession(session);
    else clearSession();
    setState(prev => ({ ...prev, hasStoredSession: !!session, storedRoomCode: session?.roomCode ?? null }));
  }, []);

  const openGate = (ws: WebSocket) => {
    gateOpenRef.current = true;
    const queued = pendingRef.current;
    pendingRef.current = [];
    queued.forEach(p => {
      if (ws.readyState === WebSocket.OPEN) ws.send(p);
      else pendingRef.current.push(p);
    });
  };

  // The one way anything is sent. If the socket isn't ready (closed,
  // reconnecting, or still restoring the seat) the message is queued and
  // sent once it is, instead of being silently dropped.
  const send = useCallback((payload: object) => {
    const data = JSON.stringify(payload);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && gateOpenRef.current) ws.send(data);
    else pendingRef.current.push(data);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    function handleSideEffects(ws: WebSocket, message: ServerMessage) {
      switch (message.type) {
        case 'session': {
          const meta = lastRequestRef.current;
          setActiveSession({
            roomCode: message.roomCode,
            playerId: message.playerId,
            resumeToken: message.resumeToken,
            savedAt: Date.now(),
            mode: meta?.mode,
            playerName: meta?.playerName,
            maxPlayers: meta?.maxPlayers,
          });
          break;
        }
        case 'resume_ok': {
          const s = activeSessionRef.current;
          if (s) {
            const refreshed = { ...s, savedAt: Date.now() };
            activeSessionRef.current = refreshed;
            saveSession(refreshed);
          }
          openGate(ws);
          break;
        }
        case 'resume_failed':
          failedRoomStartedRef.current = !!activeSessionRef.current?.started;
          setActiveSession(null);
          openGate(ws);
          break;
        case 'cards_dealt': {
          const s = activeSessionRef.current;
          if (s && !s.started) {
            activeSessionRef.current = { ...s, started: true };
            updateSession(s.roomCode, { started: true });
          }
          break;
        }
        case 'game_over': {
          const s = activeSessionRef.current;
          if (s && !s.finished) {
            activeSessionRef.current = { ...s, finished: true };
            updateSession(s.roomCode, { finished: true });
          }
          break;
        }
        case 'removed_from_room':
          setActiveSession(null);
          break;
        case 'session_replaced':
          replacedRef.current = true;
          break;
      }
    }

    function connect() {
      if (!mountedRef.current || replacedRef.current) return;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      gateOpenRef.current = false;

      ws.onopen = () => {
        if (wsRef.current !== ws) return;
        attemptRef.current = 0;
        const firstConnect = !everConnectedRef.current;
        everConnectedRef.current = true;
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            connected: true,
            connectionStatus: 'connected',
            error: firstConnect ? null : prev.error,
          }));
        }
        // Tell the server who is signed in, so wins count toward the
        // leaderboard. Guests have no session, so nothing is sent and
        // they are never ranked.
        supabase.auth
          .getSession()
          .then(({ data }) => {
            const token = data.session?.access_token;
            if (token && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'identify', accessToken: token }));
            }
          })
          .catch(() => { /* not signed in, or auth unavailable — play as guest */ })
          .then(() => {
            if (wsRef.current !== ws || ws.readyState !== WebSocket.OPEN) return;
            const session = activeSessionRef.current;
            if (session) {
              // Take the held seat back. Queued messages wait for the answer.
              setState(prev => ({ ...prev, resuming: true }));
              ws.send(JSON.stringify({ type: 'resume', roomCode: session.roomCode, resumeToken: session.resumeToken }));
            } else {
              openGate(ws);
            }
          });
      };

      ws.onmessage = (event) => {
        if (wsRef.current !== ws || !mountedRef.current) return;
        const message: ServerMessage = JSON.parse(event.data);
        handleSideEffects(ws, message);
        setState(prev => {
          switch (message.type) {
            case 'resume_ok':
              // Rebuild the room from the replay that follows.
              return {
                ...prev,
                ...roomDefaults(),
                roomCode: message.roomCode,
                playerId: message.playerId,
                resuming: true,
                resumeFailed: null,
                restored: true,
                replayBallCount: Number.MAX_SAFE_INTEGER,
              };
            case 'resume_complete':
              return { ...prev, resuming: false, replayBallCount: prev.drawnBalls.length };
            case 'resume_failed':
              return {
                ...prev,
                ...roomDefaults(),
                resuming: false,
                resumeFailed: {
                  reason: message.reason,
                  roomStarted: failedRoomStartedRef.current,
                },
              };
            case 'session_replaced':
              return {
                ...prev,
                connected: false,
                resuming: false,
                sessionReplaced: true,
                error: 'This game is open in another tab or window.',
              };
            case 'room_created':
              return {
                ...prev,
                roomCode: message.roomCode,
                playerId: message.playerId,
                hostId: message.hostId || prev.hostId,
                maxPlayers: message.maxPlayers ?? prev.maxPlayers,
                noxBonusDisplay: message.noxBonusDisplay ?? prev.noxBonusDisplay,
                bundles: message.bundles ?? prev.bundles,
                orenToGbpRate: message.orenToGbpRate ?? prev.orenToGbpRate,
                gbpToUsdtRate: message.gbpToUsdtRate ?? prev.gbpToUsdtRate,
                isSolo: typeof message.isSolo === 'boolean' ? message.isSolo : prev.isSolo,
                soloMultipliers: message.soloMultipliers && typeof message.soloMultipliers === 'object' ? message.soloMultipliers : prev.soloMultipliers,
                rakePercent: typeof message.rakePercent === 'number' ? message.rakePercent : prev.rakePercent,
                jackpotEnabled: message.jackpotEnabled ?? prev.jackpotEnabled,
                jackpotAmountOren: message.jackpotAmountOren ?? prev.jackpotAmountOren,
                practice: (message as { practice?: boolean }).practice === true,
                phase: 'lobby',
              };
            case 'player_joined':
            case 'player_left':
            case 'players_update': {
              const newHostId = message.hostId || prev.hostId;
              const newPlayers: PlayerInfo[] = message.players || prev.players;
              const hostChanged = prev.hostId && newHostId && newHostId !== prev.hostId;
              const newHostName = hostChanged ? newPlayers.find(p => p.id === newHostId)?.name : null;
              return {
                ...prev,
                players: newPlayers,
                hostId: newHostId,
                maxPlayers: message.maxPlayers ?? prev.maxPlayers,
                hostChangeNotice: hostChanged
                  ? (newHostName ? `The host left — ${newHostName} is now hosting.` : 'The host left the room.')
                  : prev.hostChangeNotice,
              };
            }
            case 'cards_dealt':
              return { ...prev, cards: message.cards, phase: 'playing', currentBall: null, drawnBalls: [] };
            case 'ball_drawn':
              return { ...prev, currentBall: message.ball, currentLetter: message.letter, drawnBalls: [...prev.drawnBalls, message.ball] };
            case 'bingo':
              return { ...prev, winningPlayerId: message.winnerId, winningPlayerName: message.winnerName, cardIndex: message.cardIndex };
            case 'nox_bonus': {
              // Sent once per card whose NOX number is drawn, for every
              // player. Only this player's own cards count toward their bonus.
              const isMine = message.winnerId === prev.playerId && typeof message.cardIndex === 'number';
              return {
                ...prev,
                bonusWinnerId: message.winnerId,
                bonusWinnerName: message.winnerName,
                myBonusCardIndexes: isMine && !prev.myBonusCardIndexes.includes(message.cardIndex)
                  ? [...prev.myBonusCardIndexes, message.cardIndex]
                  : prev.myBonusCardIndexes,
              };
            }
            case 'game_over':
              return { ...prev, phase: 'finished', winningPlayerId: message.winnerId || prev.winningPlayerId, winningPlayerName: message.winnerName || prev.winningPlayerName };
            case 'payout_sent':
              return { ...prev, payoutSignature: message.txSignature, payoutAmount: message.amount, payoutError: null };
            case 'payout_error':
              return { ...prev, payoutError: message.message };
            // Announced the instant the slim random chance hits —
            // arrives before the actual OREN transfer confirms, so the
            // UI can show "jackpot!" right away and fill in the tx
            // signature once jackpot_paid follows.
            case 'jackpot_won':
              return {
                ...prev,
                jackpotWon: true,
                jackpotWinnerId: message.winnerId,
                jackpotWinnerName: message.winnerName,
                jackpotWonAmount: message.amount,
                jackpotError: null,
              };
            case 'jackpot_paid':
              return { ...prev, jackpotSignature: message.txSignature, jackpotWonAmount: message.amount, jackpotError: null };
            case 'jackpot_payout_error':
              return { ...prev, jackpotError: message.message };
            case 'entry_fee_rejected':
              return { ...prev, entryFeeError: message.message };
            case 'entry_fee_confirmed':
              return { ...prev, entryFeeError: null };
            case 'removed_from_room':
              return {
                ...prev,
                roomCode: null, playerId: null, hostId: null, players: [], phase: 'idle', cards: [],
                currentBall: null, currentLetter: null, drawnBalls: [],
                winningPlayerId: null, winningPlayerName: null, bonusWinnerId: null,
                myBonusCardIndexes: [], bonusWinnerName: null, cardIndex: null,
                error: message.reason === 'wallet_timeout'
                  ? "You were removed for not connecting a wallet in time."
                  : message.reason === 'fee_timeout'
                  ? "You were removed for not paying the entry fee in time."
                  : "You were removed from the room by the host.",
              };
            case 'wallet_challenge':
              return { ...prev, walletChallenge: message.message };
            case 'error':
              return { ...prev, error: message.message };
            default:
              return prev;
          }
        });
      };

      ws.onclose = () => {
        if (wsRef.current !== ws) return;
        gateOpenRef.current = false;
        if (!mountedRef.current) return;
        if (replacedRef.current) {
          setState(prev => ({ ...prev, connected: false }));
          return;
        }
        setState(prev => ({
          ...prev,
          connected: false,
          connectionStatus: everConnectedRef.current ? 'reconnecting' : 'connecting',
        }));
        const delay = RECONNECT_DELAYS_MS[Math.min(attemptRef.current, RECONNECT_DELAYS_MS.length - 1)];
        attemptRef.current += 1;
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };
    }

    // Phones kill the socket while another app (like Phantom) is open.
    // Reconnect straight away when the page comes back or the network
    // returns, instead of waiting for the next backoff step.
    function reconnectNow() {
      const ws = wsRef.current;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
      connect();
    }
    function handleVisibility() {
      if (document.visibilityState === 'visible') reconnectNow();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', reconnectNow);

    connect();

    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', reconnectNow);
      if (reconnectTimerRef.current !== null) window.clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  const createRoom = useCallback((playerName: string, walletAddress?: string | null, maxPlayers?: number, isSolo?: boolean) => {
    lastRequestRef.current = { mode: isSolo ? 'solo' : 'create', playerName, maxPlayers };
    send({ type: 'create_room', playerName, walletAddress, maxPlayers, isSolo });
  }, [send]);
  const joinRoom = useCallback((roomCode: string, playerName: string, walletAddress?: string | null) => {
    lastRequestRef.current = { mode: 'join', playerName };
    send({ type: 'join_room', roomCode: roomCode.toUpperCase(), playerName, walletAddress });
  }, [send]);
  const setWallet = useCallback((walletAddress: string, walletSignature?: string) => {
    // Clear the previous attempt's error first, so an old "Could not
    // verify" message doesn't stay on screen after a retry succeeds.
    setState(prev => ({ ...prev, error: null }));
    send({ type: 'set_wallet', walletAddress, walletSignature });
  }, [send]);
  const submitEntryFee = useCallback((txSignature: string, bundleId: string, currency: 'OREN' | 'SOL') => {
    // Clear the last result first, so a repeat of the same error still
    // shows up as a fresh reply instead of looking like nothing happened.
    setState(prev => ({ ...prev, entryFeeError: null }));
    send({ type: 'submit_entry_fee', txSignature, bundleId, currency });
  }, [send]);
  const removePlayer = useCallback((playerId: string) => {
    send({ type: 'remove_player', playerId });
  }, [send]);
  const startGame = useCallback(() => {
    send({ type: 'start_game' });
  }, [send]);
  const leaveRoom = useCallback(() => {
    send({ type: 'leave_room' });
    setActiveSession(null);
    setState(prev => ({
      ...prev,
      ...roomDefaults(),
      resuming: false,
      resumeFailed: null,
    }));
  }, [send, setActiveSession]);
  return { ...state, createRoom, joinRoom, setWallet, submitEntryFee, removePlayer, startGame, leaveRoom };
}
