import { useMemo, useEffect } from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { FarcasterSolanaProvider } from '@farcaster/mini-app-solana'
import { sdk } from '@farcaster/miniapp-sdk'
import AnimatedBackground from './components/AnimatedBackground'
import Lobby from './pages/Lobby'
import Auth from './pages/Auth'
import Leaderboard from './pages/Leaderboard'
import GameRoom from './pages/GameRoom'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

// Prefer a dedicated RPC (Helius/QuickNode/Alchemy) via env var if set,
// since the public devnet endpoint rate-limits hard under load. Falls
// back to the public devnet endpoint if no env var is configured.
const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl('devnet')

function StandardWalletLayout() {
  const endpoint = useMemo(() => SOLANA_RPC_URL, [])
  const wallets = useMemo(() => [], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Outlet />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

function MiniAppLayout() {
  const endpoint = useMemo(() => SOLANA_RPC_URL, [])

  useEffect(() => {
    sdk.actions.ready()
  }, [])

  return (
    <FarcasterSolanaProvider endpoint={endpoint}>
      <Outlet />
    </FarcasterSolanaProvider>
  )
}

function App() {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10">
        <Routes>
          <Route element={<StandardWalletLayout />}>
            <Route path="/" element={<Lobby />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/room/:roomCode" element={<GameRoom />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
          <Route element={<MiniAppLayout />}>
            <Route path="/miniapp" element={<GameRoom />} />
          </Route>
        </Routes>
      </div>
    </div>
  )
}

export default App