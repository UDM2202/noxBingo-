import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAudio } from '../hooks/useAudio';
function Lobby() {
  const navigate = useNavigate();
  const [isInitiating, setIsInitiating] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const { play } = useAudio();
  function handleCreateRoom() {
    if (!playerName.trim()) return;
    setIsInitiating(true);
    play('gameStart');
    setTimeout(() => {
      navigate('/room/new?mode=create&name=' + encodeURIComponent(playerName));
    }, 600);
  }
  function handleJoinRoom() {
    if (!playerName.trim() || !roomCode.trim()) return;
    setIsInitiating(true);
    play('gameStart');
    setTimeout(() => {
      navigate('/room/' + roomCode.toUpperCase() + '?mode=join&name=' + encodeURIComponent(playerName));
    }, 600);
  }
  if (mode === 'create' || mode === 'join') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ position: 'absolute', top: '33%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '300px', background: '#00E5FF', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.04, pointerEvents: 'none' }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', maxWidth: '420px', width: '100%' }}
        >
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: '32px', fontWeight: 700, color: '#8B8BD4', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '40px' }}
          >
            {mode === 'create' ? 'Create Room' : 'Join Room'}
          </motion.h2>
          {/* Player name input */}
          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              autoFocus
              style={{
                width: '100%',
                padding: '16px 20px',
                backgroundColor: '#1A1A5E',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '18px',
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(0,229,255,0.5)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
          {/* Room code input — only for join */}
          {mode === 'join' && (
            <div style={{ marginBottom: '32px' }}>
              <input
                type="text"
                placeholder="Room code (e.g. ABC123)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  backgroundColor: '#1A1A5E',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '18px',
                  textAlign: 'center',
                  letterSpacing: '0.15em',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(0,229,255,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          )}
          {/* Action button */}
          <motion.button
            onClick={mode === 'create' ? handleCreateRoom : handleJoinRoom}
            disabled={isInitiating || !playerName.trim() || (mode === 'join' && !roomCode.trim())}
            style={{
              padding: '16px 56px',
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              backgroundColor: '#1A1A5E',
              border: '1px solid rgba(0,229,255,0.5)',
              borderRadius: '12px',
              color: '#00E5FF',
              cursor: isInitiating || !playerName.trim() || (mode === 'join' && !roomCode.trim()) ? 'not-allowed' : 'pointer',
              opacity: isInitiating ? 0.5 : 1,
              marginBottom: '32px',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isInitiating ? 'CONNECTING...' : mode === 'create' ? 'CREATE ROOM' : 'JOIN ROOM'}
          </motion.button>
          {/* Play Solo button — much bigger and visible */}
          <motion.button
            onClick={() => navigate('/room/new?mode=solo')}
            style={{
              padding: '14px 44px',
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              color: '#B8B8E8',
              cursor: 'pointer',
              marginBottom: '24px',
            }}
            whileHover={{ scale: 1.02, borderColor: 'rgba(184,184,232,0.5)', color: '#D0D0F0' }}
            whileTap={{ scale: 0.98 }}
          >
            Play Solo
          </motion.button>
          {/* Back button — bigger and more visible */}
          <div>
            <button
              onClick={() => setMode('select')}
              style={{
                padding: '10px 28px',
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                color: '#7B7BBF',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#B8B8E8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#7B7BBF')}
            >
              ? Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'absolute', top: '33%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '300px', background: '#00E5FF', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.04, pointerEvents: 'none' }} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center' }}
      >
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 1.2 }}
          style={{ width: '96px', height: '1px', margin: '0 auto 32px', background: 'linear-gradient(90deg, transparent, #00E5FF, #FFD700, #00E5FF, transparent)' }}
        />
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          style={{ fontSize: 'clamp(60px, 8vw, 120px)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '16px' }}
        >
          <span style={{ background: 'linear-gradient(to right, #5C5C9E, #8B8BD4, #FFD700)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', backgroundSize: '200% 100%', backgroundPosition: '0% 50%' }}>NOX</span>
          <span style={{ background: 'linear-gradient(to right, #FFD700, #8B8BD4, #5C5C9E)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', backgroundSize: '200% 100%', backgroundPosition: '0% 50%' }}>BINGO</span>
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#5C5C9E', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '56px', fontWeight: 300 }}
        >
          Enter the Void
        </motion.p>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
        >
          <motion.button
            onClick={() => setMode('create')}
            style={{ padding: '16px 56px', fontSize: '16px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', backgroundColor: '#1A1A5E', border: '1px solid rgba(0,229,255,0.5)', borderRadius: '12px', color: '#00E5FF', cursor: 'pointer' }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(0,229,255,0.2)' }}
            whileTap={{ scale: 0.98 }}
          >
            Create Room
          </motion.button>
          <motion.button
            onClick={() => setMode('join')}
            style={{ padding: '16px 56px', fontSize: '16px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', backgroundColor: 'transparent', border: '1px solid rgba(255,215,0,0.4)', borderRadius: '12px', color: '#FFD700', cursor: 'pointer' }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(255,215,0,0.15)' }}
            whileTap={{ scale: 0.98 }}
          >
            Join Room
          </motion.button>
          <motion.button
            onClick={() => navigate('/room/new?mode=solo')}
            style={{ padding: '14px 44px', fontSize: '15px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: '#B8B8E8', cursor: 'pointer', marginTop: '12px' }}
            whileHover={{ scale: 1.02, borderColor: 'rgba(184,184,232,0.5)', color: '#D0D0F0' }}
            whileTap={{ scale: 0.98 }}
          >
            Play Solo
          </motion.button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginTop: '80px', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5C5C9E' }}>
            <span style={{ width: '4px', height: '4px', backgroundColor: 'rgba(0,229,255,0.5)', borderRadius: '50%' }} />
            75-Ball
          </span>
          <span style={{ color: '#3D3D7A' }}>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5C5C9E' }}>
            <span style={{ width: '4px', height: '4px', backgroundColor: 'rgba(0,229,255,0.5)', borderRadius: '50%' }} />
            3 Cards
          </span>
          <span style={{ color: '#3D3D7A' }}>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5C5C9E' }}>
            <span style={{ width: '4px', height: '4px', backgroundColor: 'rgba(0,229,255,0.5)', borderRadius: '50%' }} />
            Auto-Daub
          </span>
        </motion.div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: -10,
            opacity: 0.03,
            backgroundImage: 'linear-gradient(rgba(0,229,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          }}
        />
      </motion.div>
    </div>
  );
}
export default Lobby;
