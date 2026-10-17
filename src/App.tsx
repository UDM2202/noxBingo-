import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import type { Adapter, WalletError } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TrustWalletAdapter,
  CoinbaseWalletAdapter,
} from '@solana/wallet-adapter-wallets'
// Side-effect import: when running inside Farcaster, this registers the
// user's Farcaster Solana wallet with Wallet Standard. Outside Farcaster
// it registers nothing, so the normal site's wallet list is unaffected.
import '@farcaster/mini-app-solana'
import { sdk } from '@farcaster/miniapp-sdk'
import AnimatedBackground from './components/AnimatedBackground'
import Lobby from './pages/Lobby'
import Auth from './pages/Auth'
import Leaderboard from './pages/Leaderboard'
import GameRoom from './pages/GameRoom'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import { AppEnvContext, FARCASTER_WALLET_NAME } from './appEnv'

// The app is live on mainnet, so the fallback must be mainnet too.
// Keep VITE_SOLANA_RPC_URL set in Vercel to a dedicated mainnet RPC
// (Helius/QuickNode/Alchemy); the public endpoint rate-limits hard.
const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta')
if (!import.meta.env.VITE_SOLANA_RPC_URL) {
  console.warn('VITE_SOLANA_RPC_URL is not set; falling back to the public mainnet RPC.')
}

// Must match the key @farcaster/mini-app-solana writes to, so the
// Farcaster wallet is remembered and auto-selected.
const FARCASTER_WALLET_STORAGE_KEY = 'fcWalletName'

type AppEnv = 'checking' | 'miniapp' | 'web'

/**
 * A normal top-level browser tab can never be a Farcaster Mini App, so
 * the regular site skips the async check entirely and renders instantly.
 * Only iframes and React Native webviews need the real check.
 */
function initialEnv(): AppEnv {
  if (typeof window === 'undefined') return 'web'
  const hasRnWebView = !!(window as unknown as { ReactNativeWebView?: unknown }).ReactNativeWebView
  if (!hasRnWebView && window === window.parent) return 'web'
  return 'checking'
}

/**
 * Inside Farcaster, picks the Farcaster wallet once so the player is
 * connected without opening the wallet list. Runs only once per load:
 * if connecting fails, the error banner explains why instead of this
 * retrying in a loop.
 */
function AutoSelectFarcasterWallet() {
  const { wallets, wallet, select, connected, connecting } = useWallet()
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current || wallet || connected || connecting) return
    const farcaster = wallets.find((w) => w.adapter.name === FARCASTER_WALLET_NAME)
    if (!farcaster) return
    attempted.current = true
    select(farcaster.adapter.name)
  }, [wallets, wallet, select, connected, connecting])

  return null
}

// How long a wallet may sit on "Connecting..." before we give up on it.
const CONNECT_TIMEOUT_MS = 20000

/**
 * Some Farcaster clients (seen on desktop web) accept the connect request
 * and never answer it, so the button would spin forever. After a timeout
 * this cancels the attempt and tells the player why.
 */
function ConnectWatchdog({ onTimeout }: { onTimeout: (message: string) => void }) {
  const { connecting, disconnect, wallet } = useWallet()

  useEffect(() => {
    if (!connecting) return
    const walletName = wallet?.adapter.name
    const timer = window.setTimeout(() => {
      disconnect().catch(() => {})
      onTimeout(
        walletName === FARCASTER_WALLET_NAME
          ? "Farcaster didn't respond. Try opening NoxBingo in the Farcaster phone app."
          : `${walletName ?? 'Your wallet'} didn't respond. Check the wallet app and try again.`
      )
    }, CONNECT_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [connecting, disconnect, wallet, onTimeout])

  return null
}

type WalletLayoutProps = {
  env: Exclude<AppEnv, 'checking'>
  onWalletError: (error: WalletError, adapter?: Adapter) => void
  onConnectTimeout: (message: string) => void
}

/**
 * One wallet setup for every route. Which wallets it offers depends on
 * WHERE the app is running, not which URL is open: inside Farcaster,
 * every page (lobby, rooms, /miniapp) uses the Farcaster wallet; in a
 * normal browser, every page uses the extension/mobile wallets.
 *
 * Because this layout wraps all routes, moving between pages no longer
 * tears down the wallet connection.
 */
function WalletLayout({ env, onWalletError, onConnectTimeout }: WalletLayoutProps) {
  const endpoint = useMemo(() => SOLANA_RPC_URL, [])

  // Explicit adapters make uninstalled wallets show under "More options"
  // with an install link or mobile deep link. They are left out inside
  // Farcaster, where clicking one would try to leave the Mini App
  // (to an install page or another app) and leave a blank frame behind.
  // Backpack self-registers via Wallet Standard when installed.
  const wallets = useMemo(
    () =>
      env === 'miniapp'
        ? []
        : [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new TrustWalletAdapter(),
            new CoinbaseWalletAdapter(),
          ],
    [env]
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect
        onError={onWalletError}
        localStorageKey={env === 'miniapp' ? FARCASTER_WALLET_STORAGE_KEY : 'walletName'}
      >
        {/* GameRoom's WalletMultiButton calls useWalletModal(), so this
            is needed in both environments. */}
        <WalletModalProvider>
          {env === 'miniapp' && <AutoSelectFarcasterWallet />}
          <ConnectWatchdog onTimeout={onConnectTimeout} />
          <Outlet />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

/**
 * Wallet errors used to go only to the browser console, which is why
 * clicking a wallet could look like nothing happened. This shows them
 * on screen, which also matters inside Farcaster where there is no
 * console to check on a phone.
 */
/**
 * Turns raw wallet errors into something a player can act on. The raw
 * error is still logged to the console for debugging.
 */
function friendlyWalletMessage(error: WalletError, adapter?: Adapter): string {
  const detail = error.message || (error.error as Error | undefined)?.message || error.name
  if (adapter?.name === FARCASTER_WALLET_NAME && /no address/i.test(detail)) {
    return "Your Farcaster wallet doesn't have a Solana address yet. Open the Wallet tab in Farcaster, set up Solana, then tap Connect again."
  }
  if (/user rejected|rejected the request|user denied|cancel/i.test(detail)) {
    return `You cancelled the request in ${adapter?.name ?? 'your wallet'}. Nothing was sent.`
  }
  if (error.name === 'WalletNotSelectedError') {
    return 'No wallet was selected. Tap Connect and choose a wallet.'
  }
  if (error.name === 'WalletNotReadyError') {
    return `${adapter?.name ?? 'That wallet'} isn't installed in this browser.`
  }
  return adapter?.name ? `${adapter.name}: ${detail}` : detail
}

function WalletErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-xl border border-red-400/40 bg-red-950/90 px-4 py-3 text-sm text-red-100 shadow-lg backdrop-blur"
    >
      <div className="flex items-start gap-3">
        <p className="flex-1 break-words">
          <span className="font-semibold">Wallet:</span> {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded px-2 text-red-200 hover:text-white"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function App() {
  const [env, setEnv] = useState<AppEnv>(initialEnv)
  const [walletError, setWalletError] = useState<string | null>(null)

  // Resolve whether we're inside Farcaster (only runs for iframes/webviews).
  useEffect(() => {
    if (env !== 'checking') return
    let cancelled = false
    sdk
      .isInMiniApp()
      .then((inside) => {
        if (!cancelled) setEnv(inside ? 'miniapp' : 'web')
      })
      .catch(() => {
        if (!cancelled) setEnv('web')
      })
    return () => {
      cancelled = true
    }
  }, [env])

  // Tell Farcaster the app is ready on EVERY route, not just /miniapp.
  // Previously only /miniapp called this, so opening a room link or the
  // lobby inside Farcaster left the host waiting, which showed as a
  // blank white frame on desktop.
  useEffect(() => {
    if (env !== 'miniapp') return
    sdk.actions.ready().catch((err) => console.error('sdk.actions.ready() failed', err))
  }, [env])

  const handleWalletError = useCallback((error: WalletError, adapter?: Adapter) => {
    console.error('Wallet error', adapter?.name, error)
    setWalletError(friendlyWalletMessage(error, adapter))
  }, [])

  const handleConnectTimeout = useCallback((message: string) => {
    setWalletError(message)
  }, [])

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      {env !== 'checking' && (
        <AppEnvContext.Provider value={env}>
        <div className="relative z-10">
          <Routes>
            <Route
              element={
                <WalletLayout
                  env={env}
                  onWalletError={handleWalletError}
                  onConnectTimeout={handleConnectTimeout}
                />
              }
            >
              <Route path="/" element={<Lobby />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/room/:roomCode" element={<GameRoom />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              {/* Solo-only Farcaster entry point (manifest homeUrl). */}
              <Route path="/miniapp" element={<GameRoom />} />
            </Route>
          </Routes>
        </div>
        </AppEnvContext.Provider>
      )}
      {walletError && (
        <WalletErrorBanner message={walletError} onClose={() => setWalletError(null)} />
      )}
    </div>
  )
}

export default App
