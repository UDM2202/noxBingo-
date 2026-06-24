import { useEffect, useRef, useState, useCallback } from 'react';
import type { BingoCard } from '../types/game';

type ServerMessage = {
  type: string;
  [key: string]: any;
};

type MultiplayerState = {
  connected: boolean;
  roomCode: string | null;
  playerId: string | null;
  players: { id: string; name: string }[];
  phase: 'idle' | 'lobby' | 'countdown' | 'playing' | 'finished';
  hostId: string | null;
  cards: BingoCard[];
  currentBall: number | null;
  currentLetter: string | null;
  drawnBalls: number[];
  winningPlayerId: string | null;
  winningPlayerName: string | null;
  bonusWinnerId: string | null;
  bonusWinnerName: string | null;
  cardIndex: number | null;
  error: string | null;
};

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export function useMultiplayer() {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<MultiplayerState>({
    connected: false,
    roomCode: null,
    playerId: null,
    players: [],
    phase: 'idle',
    hostId: null,
    cards: [],
    currentBall: null,
    currentLetter: null,
    drawnBalls: [],
    winningPlayerId: null,
    winningPlayerName: null,
    bonusWinnerId: null,
    bonusWinnerName: null,
    cardIndex: null,
    error: null,
  });

  // Connect once on first use
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setState(prev => ({ ...prev, connected: true, error: null }));
    };

    ws.onmessage = (event) => {
      const message: ServerMessage = JSON.parse(event.data);
      setState(prev => {
        switch (message.type) {
          case 'room_created':
            return { ...prev, roomCode: message.roomCode, playerId: message.playerId, hostId: message.hostId || prev.hostId, phase: 'lobby' };
          case 'player_joined':
          case 'player_left':
          case 'players_update':
            return { ...prev, players: message.players || prev.players, hostId: message.hostId || prev.hostId };
          case 'cards_dealt':
            return { ...prev, cards: message.cards, phase: 'playing', currentBall: null, drawnBalls: [] };
          case 'ball_drawn':
            return { ...prev, currentBall: message.ball, currentLetter: message.letter, drawnBalls: [...prev.drawnBalls, message.ball] };
          case 'bingo':
            return { ...prev, winningPlayerId: message.winnerId, winningPlayerName: message.winnerName, cardIndex: message.cardIndex };
          case 'nox_bonus':
            return { ...prev, bonusWinnerId: message.winnerId, bonusWinnerName: message.winnerName };
          case 'game_over':
            return { ...prev, phase: 'finished', winningPlayerId: message.winnerId || prev.winningPlayerId, winningPlayerName: message.winnerName || prev.winningPlayerName };
          case 'error':
            return { ...prev, error: message.message };
          default:
            return prev;
        }
      });
    };

    ws.onclose = () => {
      setState(prev => ({ ...prev, connected: false }));
    };

    ws.onerror = () => {
      setState(prev => ({ ...prev, error: 'Connection failed. Is the server running?' }));
    };

    return () => {
      ws.close();
    };
  }, []);

  const createRoom = useCallback((playerName: string) => {
    const ws = wsRef.current;
    if (!ws) return;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'create_room', playerName }));
    } else {
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'create_room', playerName }));
      };
    }
  }, []);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    const ws = wsRef.current;
    if (!ws) return;
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'join_room', roomCode: roomCode.toUpperCase(), playerName }));
    } else {
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join_room', roomCode: roomCode.toUpperCase(), playerName }));
      };
    }
  }, []);

  const startGame = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'start_game' }));
  }, []);

  const leaveRoom = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'leave_room' }));
    setState(prev => ({
      ...prev,
      roomCode: null, playerId: null, hostId: null, players: [], phase: 'idle', cards: [],
      currentBall: null, currentLetter: null, drawnBalls: [],
      winningPlayerId: null, winningPlayerName: null, bonusWinnerId: null, bonusWinnerName: null, cardIndex: null, error: null,
    }));
  }, []);

  return { ...state, createRoom, joinRoom, startGame, leaveRoom };
}

