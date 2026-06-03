import { motion } from 'framer-motion';

interface HeaderBarProps {
  roomCode: string;
  ballsDrawn: number;
  totalBalls: number;
  isLive: boolean;
  isNearMiss: boolean;
  onBackToLobby: () => void;
}

function HeaderBar({ roomCode, ballsDrawn, totalBalls, isLive, isNearMiss, onBackToLobby }: HeaderBarProps) {
  return (
    <motion.header
      className="sticky top-0 z-30 bg-midnight-deep/90 backdrop-blur-xl border-b border-white/5"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between h-12">
        
        {/* Left: Back button + Room code */}
        <div className="flex items-center gap-5">
          <button
            onClick={onBackToLobby}
            className="group flex items-center gap-2.5 text-gray-400 hover:text-gray-200 transition-all duration-200 cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="none"
              className="group-hover:-translate-x-1.5 transition-transform duration-300"
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-xs tracking-[0.25em] uppercase font-medium">Lobby</span>
          </button>

          <div className="h-6 w-px bg-white/8" />

          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 font-medium">Room</span>
            <div className="flex gap-1.5">
              {roomCode.split('').map((char, i) => (
                <motion.span
                  key={char + '-' + i}
                  className="w-8 h-8 flex items-center justify-center bg-midnight-surface border border-white/10 rounded-md text-sm font-mono text-neon-primary font-bold shadow-[0_0_10px_rgba(0,240,255,0.05)]"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                >
                  {char}
                </motion.span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Game Status */}
        <div className="flex items-center gap-8 pr-1">
          
          {/* Live / Standby */}
          <div className="flex items-center gap-2.5">
            {isLive ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-success-green opacity-60 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success-green shadow-[0_0_8px_rgba(0,255,136,0.5)]" />
                </span>
                <span className="text-xs text-success-green tracking-[0.2em] uppercase font-semibold">
                  Live
                </span>
              </>
            ) : (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-gray-600" />
                <span className="text-xs text-gray-500 tracking-[0.2em] uppercase font-medium">
                  Standby
                </span>
              </>
            )}
          </div>

          <div className="h-6 w-px bg-white/8" />

          {/* Balls Drawn */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-[0.3em] uppercase text-gray-500 font-medium">
              Balls Drawn
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-white tabular-nums leading-none">
                {ballsDrawn}
              </span>
              <span className="text-sm text-gray-500 font-mono">/ {totalBalls}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-white/8" />
{/* Near Miss pill */}
{isNearMiss ? (
  <motion.div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '9999px',
      border: '1px solid rgba(255,215,0,0.35)',
      backgroundColor: 'rgba(255,215,0,0.07)',
      boxShadow: '0 0 20px rgba(255,215,0,0.08)',
    }}
    initial={{ opacity: 0, scale: 0.8, x: 10 }}
    animate={{ opacity: 1, scale: 1, x: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
  >
    <motion.span
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#FFD700',
        boxShadow: '0 0 10px rgba(255,215,0,0.7)',
      }}
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 0.7, repeat: Infinity }}
    />
    <span style={{
      fontSize: '14px',
      color: '#FFD700',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      fontWeight: 600,
    }}>
      Near Miss
    </span>
  </motion.div>
) : (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '6px 12px',
    borderRadius: '9999px',
    border: '1px solid rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  }}>
    <span style={{
      width: '8px',
      height: '4px',
      borderRadius: '50%',
      backgroundColor: '#374151',
    }} />
    <span style={{
      fontSize: '14px',
      color: '#6b7280',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      fontWeight: 500,
    }}>
      Clear
    </span>
  </div>
)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] w-full bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-neon-primary/80 via-neon-primary to-neon-primary/80"
          initial={{ width: 0 }}
          animate={{ width: (ballsDrawn / totalBalls) * 100 + '%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.header>
  );
}

export default HeaderBar;