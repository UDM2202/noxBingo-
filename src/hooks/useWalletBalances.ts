import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

// Confirmed live on Solana mainnet: name "Oren", 8 decimals.
const OREN_MINT = new PublicKey('6EqY4SZKesXPzVJD3BhdFszYqnossy6t1gU43GSBqkQs');

/**
 * Live SOL and OREN balances for the connected wallet. A value is null
 * when it couldn't be read (shown as "—"), so an RPC error never breaks
 * the page. Refreshes when the wallet changes and when the page becomes
 * visible again; call refresh() after a payment or payout.
 */
export function useWalletBalances() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [sol, setSol] = useState<number | null>(null);
  const [oren, setOren] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  // Ignores answers for a wallet that is no longer connected.
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++requestRef.current;
    if (!publicKey) {
      setSol(null);
      setOren(null);
      return;
    }
    setLoading(true);
    const [solResult, orenResult] = await Promise.allSettled([
      connection.getBalance(publicKey),
      // No token account yet just means no OREN, so this reads as 0.
      connection.getParsedTokenAccountsByOwner(publicKey, { mint: OREN_MINT }),
    ]);
    if (request !== requestRef.current) return;
    setSol(solResult.status === 'fulfilled' ? solResult.value / LAMPORTS_PER_SOL : null);
    setOren(
      orenResult.status === 'fulfilled'
        ? orenResult.value.value.reduce(
            (sum, account) => sum + Number(account.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0),
            0
          )
        : null
    );
    setLoading(false);
  }, [connection, publicKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible') void refresh();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refresh]);

  return { sol, oren, loading, refresh };
}

export function formatBalance(value: number | null, maximumFractionDigits: number): string {
  return value === null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits });
}
