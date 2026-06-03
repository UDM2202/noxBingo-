import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getLetterForNumber } from '../utils/gameLogic';

interface DrawnSequenceProps {
  balls: number[];
}

function DrawnSequence({ balls }: DrawnSequenceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (latestRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const element = latestRef.current;
      const scrollLeft = element.offsetLeft - container.offsetWidth / 2 + element.offsetWidth / 2;
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }
  }, [balls.length]);

  if (balls.length === 0) return null;

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-3">
      {/* Label */}
      <div className="text-[11px] tracking-[0.3em] uppercase text-gray-400 font-medium mt-8">
        Drawn Sequence
      </div>

      {/* Scrollable pills container */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto pb-3 px-2 w-full"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        }}
      >
        {balls.map((ball, index) => {
          const letter = getLetterForNumber(ball);
          const isLatest = index === balls.length - 1;
          const isRecent = index >= balls.length - 5;

          return (
            <motion.div
              key={ball + '-' + index}
              ref={isLatest ? latestRef : null}
              className="flex-shrink-0 flex items-center rounded-full border font-mono font-bold"
              style={{
                gap: '10px',
                padding: '10px 18px',
                fontSize: '14px',
                backgroundColor: isLatest 
                  ? 'rgba(0,240,255,0.12)' 
                  : isRecent 
                    ? 'rgba(15,22,34,0.8)' 
                    : 'rgba(15,22,34,0.4)',
                borderColor: isLatest 
                  ? 'rgba(0,240,255,0.35)' 
                  : isRecent 
                    ? 'rgba(255,255,255,0.08)' 
                    : 'rgba(255,255,255,0.04)',
                color: isLatest ? '#00F0FF' : isRecent ? '#d1d5db' : '#6b7280',
                boxShadow: isLatest ? '0 0 14px rgba(0,240,255,0.12)' : 'none',
              }}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 20,
              }}
              layout
            >
              <span style={{
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: isLatest ? 'rgba(0,240,255,0.65)' : '#6b7280',
              }}>
                {letter}
              </span>
              <span style={{
                color: isLatest ? '#ffffff' : 'inherit',
              }}>
                {ball.toString().padStart(2, '0')}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Ball counter */}
      <span className="text-sm text-gray-400 tracking-wider font-mono mt-1">
        {balls.length} / 75
      </span>
    </div>
  );
}

export default DrawnSequence;