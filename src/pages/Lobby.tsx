import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAudio } from '../hooks/useAudio';

function Lobby() {
  const navigate = useNavigate();
  const [isInitiating, setIsInitiating] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState('select');
  const { play } = useAudio();

  function handleCreateRoom() {
    if (!playerName.trim()) return;
    setIsInitiating(true);
    play('gameStart');
    setTimeout(function() {
      navigate('/room/new?mode=create&name=' + encodeURIComponent(playerName));
    }, 600);
  }

  function handleJoinRoom() {
    if (!playerName.trim() || !roomCode.trim()) return;
    setIsInitiating(true);
    play('gameStart');
    setTimeout(function() {
      navigate('/room/' + roomCode.toUpperCase() + '?mode=join&name=' + encodeURIComponent(playerName));
    }, 600);
  }

  var formStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  };

  var glowStyle = {
    position: 'absolute' as const,
    top: '33%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '300px',
    background: '#00E5FF',
    borderRadius: '50%',
    filter: 'blur(120px)',
    opacity: 0.04,
    pointerEvents: 'none' as const,
  };

  var inputStyle = {
    width: '100%',
    padding: '16px 20px',
    backgroundColor: '#1A1A5E',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '18px',
    textAlign: 'center' as const,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  var btnPrimary = {
    padding: '16px 56px',
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    backgroundColor: '#1A1A5E',
    border: '1px solid rgba(0,229,255,0.5)',
    borderRadius: '12px',
    color: '#00E5FF',
    cursor: 'pointer' as const,
  };

  var btnSecondary = {
    padding: '14px 44px',
    fontSize: '15px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    color: '#B8B8E8',
    cursor: 'pointer' as const,
  };

  if (mode === 'create' || mode === 'join') {
    return React.createElement('div', { style: formStyle },
      React.createElement('div', { style: glowStyle }),
      React.createElement(motion.div, {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
        style: { textAlign: 'center', maxWidth: '420px', width: '100%' }
      },
        React.createElement(motion.h2, {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { delay: 0.2 },
          style: { fontSize: '32px', fontWeight: 700, color: '#8B8BD4', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '40px' }
        }, mode === 'create' ? 'Create Room' : 'Join Room'),
        React.createElement('div', { style: { marginBottom: '24px' } },
          React.createElement('input', {
            type: 'text',
            placeholder: 'Your name',
            value: playerName,
            onChange: function(e) { setPlayerName(e.target.value); },
            maxLength: 20,
            autoFocus: true,
            style: inputStyle,
            onFocus: function(e) { e.target.style.borderColor = 'rgba(0,229,255,0.5)'; },
            onBlur: function(e) { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }
          })
        ),
        mode === 'join' ? React.createElement('div', { style: { marginBottom: '32px' } },
          React.createElement('input', {
            type: 'text',
            placeholder: 'Room code (e.g. ABC123)',
            value: roomCode,
            onChange: function(e) { setRoomCode(e.target.value.toUpperCase()); },
            maxLength: 6,
            style: Object.assign({}, inputStyle, { letterSpacing: '0.15em', fontFamily: 'monospace' }),
            onFocus: function(e) { e.target.style.borderColor = 'rgba(0,229,255,0.5)'; },
            onBlur: function(e) { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }
          })
        ) : null,
        React.createElement(motion.button, {
          onClick: mode === 'create' ? handleCreateRoom : handleJoinRoom,
          disabled: isInitiating || !playerName.trim() || (mode === 'join' && !roomCode.trim()),
          style: Object.assign({}, btnPrimary, {
            marginBottom: '32px',
            opacity: isInitiating ? 0.5 : 1,
            cursor: isInitiating || !playerName.trim() || (mode === 'join' && !roomCode.trim()) ? 'not-allowed' : 'pointer'
          }),
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 }
        }, isInitiating ? 'CONNECTING...' : mode === 'create' ? 'CREATE ROOM' : 'JOIN ROOM'),
        React.createElement(motion.button, {
          onClick: function() { navigate('/room/new?mode=solo'); },
          style: Object.assign({}, btnSecondary, { marginBottom: '24px' }),
          whileHover: { scale: 1.02, borderColor: 'rgba(184,184,232,0.5)', color: '#D0D0F0' },
          whileTap: { scale: 0.98 }
        }, 'Play Solo'),
        React.createElement('div', null,
          React.createElement('button', {
            onClick: function() { setMode('select'); },
            style: { padding: '10px 28px', fontSize: '14px', fontWeight: 500, letterSpacing: '0.05em', color: '#7B7BBF', background: 'none', border: 'none', cursor: 'pointer' },
            onMouseEnter: function(e) { e.currentTarget.style.color = '#B8B8E8'; },
            onMouseLeave: function(e) { e.currentTarget.style.color = '#7B7BBF'; }
          }, '<- Back')
        )
      )
    );
  }

  // Main lobby screen
  return React.createElement('div', { style: formStyle },
    React.createElement('div', { style: glowStyle }),
    React.createElement(motion.div, {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.8 },
      style: { textAlign: 'center' as const }
    },
      React.createElement(motion.div, {
        initial: { scaleX: 0, opacity: 0 },
        animate: { scaleX: 1, opacity: 1 },
        transition: { delay: 0.2, duration: 1.2 },
        style: { width: '96px', height: '1px', margin: '0 auto 32px', background: 'linear-gradient(90deg, transparent, #00E5FF, #FFD700, #00E5FF, transparent)' }
      }),
      React.createElement(motion.h1, {
        initial: { y: 30, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 0.4, duration: 0.8, ease: 'easeOut' },
        style: { fontSize: 'clamp(60px, 8vw, 120px)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '16px' }
      },
        React.createElement('span', { style: { background: 'linear-gradient(to right, #5C5C9E, #8B8BD4, #FFD700)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', backgroundSize: '200% 100%', backgroundPosition: '0% 50%' } }, 'NOX'),
        React.createElement('span', { style: { background: 'linear-gradient(to right, #FFD700, #8B8BD4, #5C5C9E)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', backgroundSize: '200% 100%', backgroundPosition: '0% 50%' } }, 'BINGO')
      ),
      React.createElement(motion.p, {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 0.7, duration: 0.8 },
        style: { fontSize: 'clamp(16px, 2vw, 20px)', color: '#5C5C9E', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: '56px', fontWeight: 300 }
      }, 'Enter the Void'),
      React.createElement(motion.div, {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { delay: 1.0, duration: 0.8 },
        style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }
      },
        React.createElement(motion.button, {
          onClick: function() { setMode('create'); },
          style: btnPrimary,
          whileHover: { scale: 1.02, boxShadow: '0 0 24px rgba(0,229,255,0.2)' },
          whileTap: { scale: 0.98 }
        }, 'Create Room'),
        React.createElement(motion.button, {
          onClick: function() { setMode('join'); },
          style: Object.assign({}, btnPrimary, { backgroundColor: 'transparent', border: '1px solid rgba(255,215,0,0.4)', color: '#FFD700' }),
          whileHover: { scale: 1.02, boxShadow: '0 0 24px rgba(255,215,0,0.15)' },
          whileTap: { scale: 0.98 }
        }, 'Join Room'),
        React.createElement(motion.button, {
          onClick: function() { navigate('/room/new?mode=solo'); },
          style: Object.assign({}, btnSecondary, { marginTop: '12px' }),
          whileHover: { scale: 1.02, borderColor: 'rgba(184,184,232,0.5)', color: '#D0D0F0' },
          whileTap: { scale: 0.98 }
        }, 'Play Solo')
      ),
      React.createElement(motion.div, {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { delay: 1.4, duration: 0.8 },
        style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginTop: '80px', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' }
      },
        React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '8px', color: '#5C5C9E' } },
          React.createElement('span', { style: { width: '4px', height: '4px', backgroundColor: 'rgba(0,229,255,0.5)', borderRadius: '50%' } }),
          '75-Ball'
        ),
        React.createElement('span', { style: { color: '#3D3D7A' } }, '.'),
        React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '8px', color: '#5C5C9E' } },
          React.createElement('span', { style: { width: '4px', height: '4px', backgroundColor: 'rgba(0,229,255,0.5)', borderRadius: '50%' } }),
          '3 Cards'
        ),
        React.createElement('span', { style: { color: '#3D3D7A' } }, '.'),
        React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '8px', color: '#5C5C9E' } },
          React.createElement('span', { style: { width: '4px', height: '4px', backgroundColor: 'rgba(0,229,255,0.5)', borderRadius: '50%' } }),
          'Auto-Daub'
        )
      ),
      React.createElement('div', {
        style: {
          position: 'absolute',
          inset: 0,
          zIndex: -10,
          opacity: 0.03,
          backgroundImage: 'linear-gradient(rgba(0,229,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
        }
      })
    )
  );
}

export default Lobby;
