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
function HeaderBar({ roomCode, ballsDrawn, totalBalls, soundEnabled, onToggleSound, onOpenSettings, onBackToLobby, balance }: HeaderBarProps) {
  return (
    <motion.header
      className="sticky top-0 z-30 bg-midnight-deep/90 backdrop-blur-xl border-b border-white/5"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left: Back + Room code */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={onBackToLobby} style={{ color: '#5C5C9E', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 12L6 8L10 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ display: 'flex', gap: '3px' }}>
            {roomCode.split('').map((char, i) => (
              <span key={char+'-'+i} style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A5E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', color: '#00E5FF', fontWeight: 700 }}>{char}</span>
            ))}
          </div>
        </div>
        {/* Center: Balls count */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
          <span style={{ fontSize: '16px', fontFamily: 'monospace', fontWeight: 700, color: '#fff' }}>{ballsDrawn}</span>
          <span style={{ fontSize: '10px', color: '#4A4A8A', fontFamily: 'monospace' }}>/{totalBalls}</span>
        </div>
        {/* Right: Icons + Balance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {balance !== undefined && (
            <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 600, color: '#FFD700', opacity: 0.85 }}>{balance.toLocaleString()}</span>
          )}
          <button onClick={onToggleSound} style={{ color: '#5C5C9E', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
            {soundEnabled ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            )}
          </button>
          <button onClick={onOpenSettings} style={{ color: '#5C5C9E', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83"/></svg>
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: '2px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          style={{ height: '100%', background: 'linear-gradient(to right, rgba(0,229,255,0.8), #00E5FF, rgba(0,229,255,0.8))' }}
          initial={{ width: 0 }}
          animate={{ width: (ballsDrawn / totalBalls) * 100 + '%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </motion.header>
  );
}
export default HeaderBar;

