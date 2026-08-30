import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useAudio } from '../hooks/useAudio'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { usePolygonContract } from '../hooks/usePolygonContract'
import { useSolanaContract } from '../hooks/useSolanaContract'

function Lobby() {
  const navigate = useNavigate()
  const [isInitiating, setIsInitiating] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
  const [prizeTier, setPrizeTier] = useState('standard')
  const [maxPlayers, setMaxPlayers] = useState(6)
  const { play } = useAudio()
  const { user, loading, signOut } = useAuth()
  const { isConnected, address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { playerStats } = usePolygonContract()
  const { publicKey: solanaPublicKey, disconnect: disconnectSolana } = useWallet()
  const { setVisible: setSolanaModalVisible } = useWalletModal()
  const [showChainPicker, setShowChainPicker] = useState(false)
  const { balance: orenBalance, getBalance: getOrenBalance } = useSolanaContract()
  const [username, setUsername] = useState('')
  const [balance] = useState(() => {
    const saved = localStorage.getItem('noxbingo-balance')
    return saved ? parseInt(saved) : 1000
  })

  useEffect(() => {
    if (solanaPublicKey) {
      getOrenBalance()
    }
  }, [solanaPublicKey])

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setUsername(data.username)
        })
    }
  }, [user])

  // Prefill the name field with the signed-in username once it loads,
  // so players don't have to retype their own name every time — they
  // can still edit it if they want to play under a different handle.
  useEffect(() => {
    if (username && !playerName) {
      setPlayerName(username)
    }
  }, [username])

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '2px solid #00E5FF',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    )
  }

  function handleChainSelect(chain: 'polygon' | 'solana') {
    setShowChainPicker(false)
    if (chain === 'polygon') openConnectModal?.()
    else setSolanaModalVisible(true)
  }

  function handleCreateRoom() {
    if (!playerName.trim()) return
    setIsInitiating(true)
    play('gameStart')
    navigate(
      '/room/new?mode=create&name=' + encodeURIComponent(playerName) + '&prize=' + prizeTier + '&maxPlayers=' + maxPlayers
    )
  }

  function handleJoinRoom() {
    if (!roomCode.trim() || !playerName.trim()) return
    setIsInitiating(true)
    play('gameStart')
    navigate(
      '/room/' + roomCode.toUpperCase() + '?mode=join&name=' + encodeURIComponent(playerName)
    )
  }

  if (mode === 'create' || mode === 'join') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '33%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '300px',
            background: '#00E5FF',
            borderRadius: '50%',
            filter: 'blur(120px)',
            opacity: 0.04,
            pointerEvents: 'none',
          }}
        />
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
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#8B8BD4',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '40px',
            }}
          >
            {mode === 'create' ? 'Create Room' : 'Join Room'}
          </motion.h2>

          {/* This was previously mislabeled "Room name" and bound to
              playerName — rooms don't have names, only auto-generated
              codes. This is your display name in the room. Shared
              between create and join so both flows actually know who
              you are, instead of join hardcoding everyone as "Player". */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              autoFocus={mode === 'create'}
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
              onFocus={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.5)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          {mode === 'join' && (
            <div style={{ marginBottom: '32px' }}>
              <input
                type="text"
                placeholder="Room code (e.g. ABC123)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
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
                  letterSpacing: '0.15em',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(0,229,255,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
          )}

          {mode === 'create' && (
            <div style={{ marginBottom: '24px' }}>
              <p
                style={{
                  fontSize: '12px',
                  color: '#5C5C9E',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                Room Size
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[2, 4, 6, 8, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => setMaxPlayers(count)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border:
                        maxPlayers === count
                          ? '1px solid rgba(0,229,255,0.5)'
                          : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: maxPlayers === count ? 'rgba(0,229,255,0.08)' : 'transparent',
                      color: maxPlayers === count ? '#00E5FF' : '#8B8BD4',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'create' && (
            <div style={{ marginBottom: '24px' }}>
              <p
                style={{
                  fontSize: '12px',
                  color: '#5C5C9E',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                Prize Pool
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {(['casual', 'standard', 'high'] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setPrizeTier(tier)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border:
                        prizeTier === tier
                          ? '1px solid rgba(0,229,255,0.5)'
                          : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: prizeTier === tier ? 'rgba(0,229,255,0.08)' : 'transparent',
                      color: prizeTier === tier ? '#00E5FF' : '#8B8BD4',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    {tier === 'casual' ? '50/10' : tier === 'standard' ? '100/25' : '500/100'}
                  </button>
                ))}
              </div>
              <p
                style={{
                  fontSize: '10px',
                  color: '#5C5C9E',
                  marginTop: '6px',
                  textAlign: 'center',
                }}
              >
                {prizeTier === 'casual'
                  ? 'BINGO: 50 NOX | Bonus: 10 NOX'
                  : prizeTier === 'standard'
                    ? 'BINGO: 100 NOX | Bonus: 25 NOX'
                    : 'BINGO: 500 NOX | Bonus: 100 NOX'}
              </p>
            </div>
          )}

          <motion.button
            onClick={mode === 'create' ? handleCreateRoom : handleJoinRoom}
            disabled={
              isInitiating ||
              !playerName.trim() ||
              (mode === 'join' && !roomCode.trim())
            }
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
              cursor: 'pointer',
              marginBottom: '32px',
              opacity: isInitiating ? 0.5 : 1,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isInitiating ? 'CONNECTING...' : mode === 'create' ? 'CREATE ROOM' : 'JOIN ROOM'}
          </motion.button>
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
              Back
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '33%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '300px',
          background: '#00E5FF',
          borderRadius: '50%',
          filter: 'blur(120px)',
          opacity: 0.04,
          pointerEvents: 'none',
        }}
      />

      {/* One button, one decision point: click to connect, pick a
          chain from the popup, then that chain's own wallet modal
          takes over. Once connected, each connected chain shows its
          own compact status instead of a button. */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'flex-end',
        }}
      >
        {isConnected && address && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#5C5C9E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Polygon
            </span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00FF88', boxShadow: '0 0 6px rgba(0,255,136,0.5)' }} />
            <span style={{ fontSize: '12px', color: '#8B8BD4', fontFamily: 'monospace' }}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
        )}

        {solanaPublicKey && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#5C5C9E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Solana
            </span>
            <button
              onClick={disconnectSolana}
              title="Click to disconnect"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00FF88', boxShadow: '0 0 6px rgba(0,255,136,0.5)' }} />
              <span style={{ fontSize: '12px', color: '#8B8BD4', fontFamily: 'monospace' }}>
                {solanaPublicKey.toBase58().slice(0, 4)}..{solanaPublicKey.toBase58().slice(-4)}
              </span>
            </button>
          </div>
        )}

        {(!isConnected || !solanaPublicKey) && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowChainPicker(v => !v)}
              style={{
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                backgroundColor: '#1A1A5E',
                border: '1px solid rgba(0,229,255,0.5)',
                borderRadius: '10px',
                color: '#00E5FF',
                cursor: 'pointer',
              }}
            >
              Connect Wallet
            </button>

            {showChainPicker && (
              <>
                {/* Invisible backdrop to close the picker on outside click */}
                <div
                  onClick={() => setShowChainPicker(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 19 }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    marginTop: '6px',
                    background: '#1A1A5E',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    zIndex: 20,
                    minWidth: '150px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}
                >
                  {!isConnected && (
                    <button
                      onClick={() => handleChainSelect('polygon')}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        color: '#8B8BD4',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,229,255,0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      Polygon
                    </button>
                  )}
                  {!solanaPublicKey && (
                    <button
                      onClick={() => handleChainSelect('solana')}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        color: '#8B8BD4',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,229,255,0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      Solana
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

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
          style={{
            width: '96px',
            height: '1px',
            margin: '0 auto 32px',
            background:
              'linear-gradient(90deg, transparent, #00E5FF, #FFD700, #00E5FF, transparent)',
          }}
        />
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
          style={{
            fontSize: 'clamp(60px, 8vw, 120px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              background: 'linear-gradient(to right, #5C5C9E, #8B8BD4, #FFD700)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            NOX
          </span>
          <span
            style={{
              background: 'linear-gradient(to right, #FFD700, #8B8BD4, #5C5C9E)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            BINGO
          </span>
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: '#5C5C9E',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            marginBottom: '16px',
            fontWeight: 300,
          }}
        >
          Enter the Void
        </motion.p>

        {user ? (
          <>
            <div
              style={{
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '14px', color: '#8B8BD4' }}>
                Welcome, {username || user.email}
              </span>
              <button
                onClick={signOut}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  color: '#FF6464',
                  background: 'rgba(255,100,100,0.1)',
                  border: '1px solid rgba(255,100,100,0.2)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <span
                style={{
                  fontSize: '18px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: '#FFD700',
                }}
              >
                {balance.toLocaleString()} NOX
              </span>
              {isConnected && playerStats && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#5C5C9E' }}>
                  Polygon: {playerStats.totalWinnings.toLocaleString()} USDC won |{' '}
                  {playerStats.gamesPlayed} played
                </div>
              )}
              {solanaPublicKey && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#5C5C9E' }}>
                  {/* We don't track historical wins/games-played for
                      Solana yet (no leaderboard/history logging wired
                      to wallet address the way Polygon's on-chain read
                      does) — showing live OREN balance is the honest
                      thing to show today, not a fabricated stat. */}
                  Solana: {orenBalance.toLocaleString()} OREN in wallet
                </div>
              )}
            </div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.8 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <motion.button
                onClick={() => setMode('create')}
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
                  cursor: 'pointer',
                }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(0,229,255,0.2)' }}
                whileTap={{ scale: 0.98 }}
              >
                Create Room
              </motion.button>
              <motion.button
                onClick={() => setMode('join')}
                style={{
                  padding: '16px 56px',
                  fontSize: '16px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,215,0,0.4)',
                  borderRadius: '12px',
                  color: '#FFD700',
                  cursor: 'pointer',
                }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(255,215,0,0.15)' }}
                whileTap={{ scale: 0.98 }}
              >
                Join Room
              </motion.button>
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
                  marginTop: '12px',
                }}
                whileHover={{ scale: 1.02, borderColor: 'rgba(184,184,232,0.5)', color: '#D0D0F0' }}
                whileTap={{ scale: 0.98 }}
              >
                Play Solo
              </motion.button>
            </motion.div>
          </>
        ) : (
          <div style={{ marginBottom: '48px' }}>
            <p style={{ color: '#8B8BD4', fontSize: '16px', marginBottom: '24px' }}>
              Sign in or connect wallet to create and join rooms
            </p>
            <motion.button
              onClick={() => navigate('/auth')}
              style={{
                padding: '14px 48px',
                fontSize: '15px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                backgroundColor: '#1A1A5E',
                border: '1px solid rgba(0,229,255,0.5)',
                borderRadius: '12px',
                color: '#00E5FF',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Sign In
            </motion.button>
            <div>
              <button
                onClick={() => navigate('/room/new?mode=solo')}
                style={{
                  padding: '12px 36px',
                  fontSize: '14px',
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '10px',
                  color: '#8B8BD4',
                  cursor: 'pointer',
                }}
              >
                Play as Guest
              </button>
            </div>
            <div style={{ marginTop: '16px' }}>
              <a
                href="/leaderboard"
                style={{ color: '#5C5C9E', fontSize: '12px', textDecoration: 'none' }}
              >
                View Leaderboard
              </a>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            marginTop: '80px',
            fontSize: '11px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5C5C9E' }}>
            <span
              style={{
                width: '4px',
                height: '4px',
                backgroundColor: 'rgba(0,229,255,0.5)',
                borderRadius: '50%',
              }}
            />
            75-Ball
          </span>
          <span style={{ color: '#3D3D7A' }}>.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5C5C9E' }}>
            <span
              style={{
                width: '4px',
                height: '4px',
                backgroundColor: 'rgba(0,229,255,0.5)',
                borderRadius: '50%',
              }}
            />
            3 Cards
          </span>
          <span style={{ color: '#3D3D7A' }}>.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5C5C9E' }}>
            <span
              style={{
                width: '4px',
                height: '4px',
                backgroundColor: 'rgba(0,229,255,0.5)',
                borderRadius: '50%',
              }}
            />
            Auto-Daub
          </span>
        </motion.div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: -10,
            opacity: 0.03,
            backgroundImage:
              'linear-gradient(rgba(0,229,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          }}
        />
      </motion.div>
    </div>
  )
}

export default Lobby