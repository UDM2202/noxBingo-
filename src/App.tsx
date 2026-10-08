import { useMemo, useEffect } from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  TrustWalletAdapter,
  CoinbaseWalletAdapter,
} from '@solana/wallet-adapter-wallets'
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

/**
 * Wraps the normal, browser-visited pages — connects via a real
 * extension wallet (Phantom, Backpack, etc.) the way the whole app
 * has worked all along.
 */
function StandardWalletLayout() {
  const endpoint = useMemo(() => SOLANA_RPC_URL, [])

  // Wallet Standard auto-detects wallets that are actually installed
  // and injected into the browser — but on its own it never lists a
  // wallet the user DOESN'T have installed, which was the bug: the
  // modal only ever showed whatever extension happened to already be
  // present. Explicitly listing adapters here is what makes the
  // modal's "More options" section show every one of these wallets
  // even when uninstalled — clicking an uninstalled one takes the
  // user to that wallet's install page (desktop) or deep-links into
  // its mobile app (iOS/Android), instead of the option simply not
  // existing. Add or remove adapters here as needed; each one some
  // developer still has to maintain, so keep this to wallets real
  // Solana bingo players actually use.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new TrustWalletAdapter(),
      new CoinbaseWalletAdapter(),
    ],
    []
  )

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

/**
 * Wraps the Farcaster Mini App entry point — FarcasterSolanaProvider
 * connects through whatever Solana wallet the user already has
 * selected inside Farcaster's own client. WalletModalProvider is
 * still needed even here, because GameRoom's WalletMultiButton calls
 * useWalletModal() internally — without this wrapper that hook has
 * nothing to call, so clicking the button silently does nothing at
 * all (no crash, no visible error, just a dead click).
 */
function MiniAppLayout() {
  const endpoint = useMemo(() => SOLANA_RPC_URL, [])

  useEffect(() => {
    // Tells Farcaster the app has finished loading so it can dismiss
    // its own splash screen and show this content. Required — the
    // app stays stuck behind Farcaster's loading state without it.
    sdk.actions.ready()
  }, [])

  return (
    <FarcasterSolanaProvider endpoint={endpoint}>
      <WalletModalProvider>
        <Outlet />
      </WalletModalProvider>
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
            {/* Solo-only for now — GameRoom's existing mode=solo path
                already does everything needed (wallet check, bundle
                picker, payment, server-authoritative draw, payout).
                Multiplayer inside the embed is a separate feature for
                later, not something this route needs to support yet. */}
            <Route path="/miniapp" element={<GameRoom />} />
          </Route>
        </Routes>
      </div>
    </div>
  )
}

export default App