import { useEffect, useRef, useState, useCallback } from 'react';
import type { BingoCard } from '../types/game';
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
};
type MultiplayerState = {
  connected: boolean;
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
  bonusAmounts: number[];
  bonusWinnerName: string | null;
  cardIndex: number | null;
  error: string | null;
  noxBonusDisplay: number;
  entryFeeError: string | null;
  hostChangeNotice: string | null;
  payoutSignature: string | null;
  payoutAmount: number | null;
  payoutError: string | null;
};
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
export function useMultiplayer() {
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const [state, setState] = useState<MultiplayerState>({
    connected: false,
    roomCode: null,
    playerId: null,
    hostId: null,
    maxPlayers: 6,
    players: [],
    phase: 'idle',
    cards: [],
    currentBall: null,
    currentLetter: null,
    drawnBalls: [],
    winningPlayerId: null,
    winningPlayerName: null,
    bonusWinnerId: null,
    bonusAmounts: [],
    bonusWinnerName: null,
    cardIndex: null,
    error: null,
    noxBonusDisplay: 25,
    entryFeeError: null,
    hostChangeNotice: null,
    payoutSignature: null,
    payoutAmount: null,
    payoutError: null,
  });
  useEffect(() => {
    mountedRef.current = true;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, connected: true, error: null }));
      }
    };
    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      const message: ServerMessage = JSON.parse(event.data);
      setState(prev => {
        switch (message.type) {
          case 'room_created':
            return {
              ...prev,
              roomCode: message.roomCode,
              playerId: message.playerId,
              hostId: message.hostId || prev.hostId,
              maxPlayers: message.maxPlayers ?? prev.maxPlayers,
              phase: 'lobby',
            };
          case 'player_joined':
          case 'player_left':
          case 'players_update': {
            const newHostId = message.hostId || prev.hostId;
            const newPlayers = message.players || prev.players;
            // A genuine host reassignment — not the initial host being
            // set when the room's first created — means whoever was
            // hosting just left or got removed. Surface that clearly
            // rather than letting the player list silently reshuffle.
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
          case 'nox_bonus':
            return { ...prev, bonusWinnerId: message.winnerId, bonusWinnerName: message.winnerName, bonusAmounts: [...prev.bonusAmounts, message.amount || 25] };
          case 'game_over':
            return { ...prev, phase: 'finished', winningPlayerId: message.winnerId || prev.winningPlayerId, winningPlayerName: message.winnerName || prev.winningPlayerName };
          case 'payout_sent':
            return { ...prev, payoutSignature: message.txSignature, payoutAmount: message.amount, payoutError: null };
          case 'payout_error':
            return { ...prev, payoutError: message.message };
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
              bonusAmounts: [], bonusWinnerName: null, cardIndex: null,
              error: message.reason === 'wallet_timeout'
                ? "You were removed for not connecting a wallet in time."
                : message.reason === 'fee_timeout'
                ? "You were removed for not paying the entry fee in time."
                : "You were removed from the room by the host.",
            };
          case 'error':
            return { ...prev, error: message.message };
          default:
            return prev;
        }
      });
    };
    ws.onclose = () => {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, connected: false }));
      }
    };
    return () => {
      mountedRef.current = false;
      ws.close();
    };
  }, []);
  const sendWhenReady = (payload: object) => {
    const ws = wsRef.current;
    if (!ws) return;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      ws.onopen = () => ws.send(JSON.stringify(payload));
    }
  };
  const createRoom = useCallback((playerName: string, walletAddress?: string | null, maxPlayers?: number) => {
    sendWhenReady({ type: 'create_room', playerName, walletAddress, maxPlayers });
  }, []);
  const joinRoom = useCallback((roomCode: string, playerName: string, walletAddress?: string | null) => {
    sendWhenReady({ type: 'join_room', roomCode: roomCode.toUpperCase(), playerName, walletAddress });
  }, []);
  const setWallet = useCallback((walletAddress: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'set_wallet', walletAddress }));
  }, []);
  const submitEntryFee = useCallback((txSignature: string, bundleId: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'submit_entry_fee', txSignature, bundleId }));
  }, []);
  const removePlayer = useCallback((playerId: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'remove_player', playerId }));
  }, []);
  const startGame = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'start_game' }));
  }, []);
  const leaveRoom = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'leave_room' }));
    setState(prev => ({
      ...prev, roomCode: null, playerId: null, hostId: null, maxPlayers: 6, players: [], phase: 'idle', cards: [],
      currentBall: null, currentLetter: null, drawnBalls: [],
      winningPlayerId: null, winningPlayerName: null, bonusWinnerId: null,
      bonusAmounts: [], bonusWinnerName: null, cardIndex: null, error: null,
      noxBonusDisplay: 25, entryFeeError: null, hostChangeNotice: null,
      payoutSignature: null, payoutAmount: null, payoutError: null,
    }));
  }, []);
  return { ...state, createRoom, joinRoom, setWallet, submitEntryFee, removePlayer, startGame, leaveRoom };
}