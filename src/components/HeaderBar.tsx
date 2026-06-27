import { motion } from 'framer-motion';

interface HeaderBarProps {
  roomCode: string;
  ballsDrawn: number;
  totalBalls: number;
  isLive: boolean;
  isNearMiss: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onBackToLobby: () => void;
  balance?: number;
}

function HeaderBar({ roomCode, ballsDrawn, totalBalls, isLive, isNearMiss, soundEnabled, onToggleSound, onOpenSettings, onBackToLobby, balance }: HeaderBarProps) {
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
            className="group flex items-center gap-2.5 text-[#5C5C9E] hover:text-[#8B8BD4] transition-all duration-200 cursor-pointer"
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
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#5C5C9E] font-medium">Room</span>
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
            </div></div>
</div>
<div className="h-6 w-px bg-white/8" />
{balance !== undefined && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#5C5C9E', fontWeight: 500 }}>Balance</span>
    <span style={{ fontSize: '16px', fontFamily: 'monospace', fontWeight: 700, color: '#FFD700' }}>{balance.toLocaleString()} NOX</span>
  </div>
)}
{/* Right: Game Status */}
        <div className="flex items-center gap-8 pr-1">

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 text-[#5C5C9E] hover:text-[#8B8BD4] transition-colors cursor-pointer"
            title="Audio settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          <div className="h-6 w-px bg-white/8" />

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            className="flex items-center gap-1.5 text-[#5C5C9E] hover:text-[#8B8BD4] transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          >
            {soundEnabled ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>

          <div className="h-6 w-px bg-white/8" />
          
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
                <span className="h-2.5 w-2.5 rounded-full bg-[#4A4A8A]" />
                <span className="text-xs text-[#5C5C9E] tracking-[0.2em] uppercase font-medium">
                  Standby
                </span>
              </>
            )}
          </div>

          <div className="h-6 w-px bg-white/8" />

          {/* Balls Drawn */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#5C5C9E] font-medium">
              Balls Drawn
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-white tabular-nums leading-none">
                {ballsDrawn}
              </span>
              <span className="text-sm text-[#4A4A8A] font-mono">/ {totalBalls}</span>
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
      backgroundColor: '#4A4A8A',
    }} />
    <span style={{
      fontSize: '14px',
      color: '#7B7BBF',
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

