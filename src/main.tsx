import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { config } from './lib/web3'
import '@rainbow-me/rainbowkit/styles.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import './index.css'
import App from './App'
import { Buffer } from 'buffer'
window.Buffer = window.Buffer || Buffer

import { StrictMode, useMemo } from 'react'

const queryClient = new QueryClient()

// Prefer a dedicated RPC (Helius/QuickNode/Alchemy) via env var if set,
// since the public devnet endpoint rate-limits hard under load. Falls
// back to the public devnet endpoint if no env var is configured.
const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl('devnet')

function Root() {
  const endpoint = useMemo(() => SOLANA_RPC_URL, [])
  // Modern wallet-adapter auto-detects installed wallets (Phantom,
  // Backpack, Solflare, etc.) via the Wallet Standard, so an explicit
  // `wallets` array is no longer required — leaving it empty is
  // intentional, not an oversight.
  const wallets = useMemo(() => [], [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                <BrowserRouter>
                  <App />
                </BrowserRouter>
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)