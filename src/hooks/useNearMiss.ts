import { useEffect, useRef } from 'react';

export function useNearMiss(
  nearMissCount: number,
  onEscalate: () => void,
  onDeescalate: () => void
) {
  const prevCount = useRef(nearMissCount);

  useEffect(() => {
    if (prevCount.current > 1 && nearMissCount === 1) {
      onEscalate();
    } else if (prevCount.current === 1 && nearMissCount > 1) {
      onDeescalate();
    }
    prevCount.current = nearMissCount;
  }, [nearMissCount, onEscalate, onDeescalate]);
}
