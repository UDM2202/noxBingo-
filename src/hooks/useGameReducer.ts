import { useReducer, useCallback } from 'react';
import type { GameState, GameAction } from '../types/game';
import { generateRoomCode, generateSeed } from '../utils/seededRandom';
import { generateCards, generateDrawSequence } from '../utils/cardGenerator';
import { autoDaub, checkForWin, getNearMissCount } from '../utils/gameLogic';

const initialState: GameState = {
  roomCode: '',
  phase: 'countdown',
  drawSequence: [],
  currentDrawIndex: -1,
  drawnNumbers: new Set<number>(),
  cards: [],
  winningCardIndex: null,
  nearMissStates: [],
  seed: '',
  countdownValue: 3,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_COUNTDOWN': {
      const roomCode = generateRoomCode();
      return {
        ...initialState,
        roomCode,
        phase: 'countdown',
        countdownValue: 3,
        drawnNumbers: new Set(),
      };
    }

    case 'TICK_COUNTDOWN': {
      if (state.countdownValue <= 1) {
        return { ...state, countdownValue: 0 };
      }
      return { ...state, countdownValue: state.countdownValue - 1 };
    }

    case 'DEPLOY_CARDS': {
      return {
        ...state,
        cards: action.cards,
        seed: action.seed,
        drawSequence: action.sequence,
        phase: 'playing',
        currentDrawIndex: -1,
        drawnNumbers: new Set(),
        winningCardIndex: null,
        nearMissStates: action.cards.map(() => 99),
      };
    }

    case 'DRAW_BALL': {
      const nextIndex = state.currentDrawIndex + 1;
      if (nextIndex >= state.drawSequence.length) return state;

      const newNumber = state.drawSequence[nextIndex];
      const newDrawn = new Set(state.drawnNumbers);
      newDrawn.add(newNumber);

      const updatedCards = autoDaub(state.cards, newNumber);
      const winner = checkForWin(updatedCards);
      const nearMissStates = updatedCards.map(card => getNearMissCount(card));

      const finalCards = updatedCards.map((card, i) => ({
        ...card,
        nearMissCount: nearMissStates[i],
        status: winner === i ? 'WON' as const : card.status,
      }));

      return {
        ...state,
        currentDrawIndex: nextIndex,
        drawnNumbers: newDrawn,
        cards: finalCards,
        winningCardIndex: winner,
        nearMissStates,
        phase: winner !== null ? 'finished' : 'playing',
      };
    }

   case 'MARK_CELL': {
  // Guard: only allow marking if the cell's number has actually been drawn
  const targetCell = state.cards[action.cardIndex].grid[action.row][action.col];
  if (targetCell.value === 'FREE') return state;
  if (typeof targetCell.value === 'number' && !state.drawnNumbers.has(targetCell.value)) {
    return state; // Block — number hasn't been called yet
  }

  const newCards = state.cards.map((card, ci) => {
    if (ci !== action.cardIndex) return card;
    const newGrid = card.grid.map((row, ri) =>
      row.map((cell, coli) => {
        if (ri === action.row && coli === action.col && !cell.marked && !cell.isFreeSpace) {
          return { ...cell, marked: true };
        }
        return cell;
      })
    );
    return { ...card, grid: newGrid };
  });

  const winner = checkForWin(newCards);
  const nearMissStates = newCards.map(card => getNearMissCount(card));

  return {
    ...state,
    cards: newCards.map((card, i) => ({
      ...card,
      nearMissCount: nearMissStates[i],
      status: winner === i ? 'WON' as const : card.status,
    })),
    winningCardIndex: winner,
    nearMissStates,
    phase: winner !== null ? 'finished' : 'playing',
  };
}

    case 'DECLARE_WIN': {
      return {
        ...state,
        winningCardIndex: action.cardIndex,
        phase: 'finished',
        cards: state.cards.map((card, i) => ({
          ...card,
          status: i === action.cardIndex ? 'WON' as const : 'STANDBY' as const,
        })),
      };
    }

    case 'UPDATE_NEAR_MISS': {
      return {
        ...state,
        nearMissStates: action.states,
        cards: state.cards.map((card, i) => ({
          ...card,
          nearMissCount: action.states[i],
        })),
      };
    }

    case 'RESET_GAME': {
      return { ...initialState, drawnNumbers: new Set() };
    }

    default:
      return state;
  }
}

export function useGameReducer() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const deployCards = useCallback(() => {
    const roomCode = state.roomCode || generateRoomCode();
    const seed = generateSeed(roomCode);
    const cards = generateCards(seed);
    const sequence = generateDrawSequence(seed);

    dispatch({
      type: 'DEPLOY_CARDS',
      cards,
      seed,
      sequence,
    });
  }, [state.roomCode]);

  return { state, dispatch, deployCards };
}