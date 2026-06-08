import { useEffect, useRef } from 'react';
import type { GameState, GameAction } from '../types/game';

export function useDrawLoop(
  phase: GameState['phase'],
  currentDrawIndex: number,
  drawSequenceLength: number,
  dispatch: React.Dispatch<GameAction>
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase !== 'playing') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (currentDrawIndex >= drawSequenceLength - 1) {
      // All balls drawn
      return;
    }

    intervalRef.current = setInterval(() => {
      dispatch({ type: 'DRAW_BALL' });
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase, currentDrawIndex, drawSequenceLength, dispatch]);
}
