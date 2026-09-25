import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
} from '@solana/spl-token';
import { useState } from 'react';

// Confirmed live on Solana mainnet: name "Oren", ticker $SOREN,
// supply 2,600,000,000, 8 decimals.
const OREN_MINT = new PublicKey('6EqY4SZKesXPzVJD3BhdFszYqnossy6t1gU43GSBqkQs');
// Same address the server pays winners from — public knowledge, safe
// to hardcode (it's just where the money goes, not a secret).
export const TREASURY_WALLET = new PublicKey('Gahk26BjGG5BQR8AbRVwb3CSTh5rJquyZxN4cHR44sVz');
const DECIMALS = 8;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Live SOL/USD price, fetched purely for showing the player a quote
 * before they sign. Routed through our own backend rather than
 * calling Pyth's Hermes API directly from the browser — that call
 * works fine server-side (see server/src/pyth.ts, used for real
 * payment verification) but can fail client-side due to CORS, which
 * has no bearing on security since the server independently re-checks
 * the live price at verification time regardless of what this
 * endpoint returns — this only ever affects what's displayed.
 */
export async function getSolUsdPrice(): Promise<number> {
  const res = await fetch(`${API_URL}/sol-price`);
  if (!res.ok) throw new Error('Could not fetch live SOL price');
  const data = await res.json();
  if (typeof data.price !== 'number') throw new Error('No SOL/USD price available right now');
  return data.price;
}

export function useSolanaContract() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const getBalance = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const ata = await getAssociatedTokenAddress(OREN_MINT, publicKey);
      const info = await connection.getTokenAccountBalance(ata);
      setBalance(Number(info.value.uiAmount || 0));
    } catch {
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Player signs and sends their own OREN transfer to the treasury
   * wallet as the room's entry fee. Returns the tx signature, which
   * gets sent to the server for independent on-chain verification —
   * the server never trusts this call's success on its own.
   */
  const payEntryFee = async (amountUiTokens: number): Promise<string> => {
    if (!publicKey) throw new Error('Wallet not connected');
    setLoading(true);
    try {
      const playerAta = await getAssociatedTokenAddress(OREN_MINT, publicKey);
      const treasuryAta = await getAssociatedTokenAddress(OREN_MINT, TREASURY_WALLET);

      const tx = new Transaction();

      const treasuryAtaInfo = await connection.getAccountInfo(treasuryAta);
      if (!treasuryAtaInfo) {
        tx.add(createAssociatedTokenAccountInstruction(publicKey, treasuryAta, TREASURY_WALLET, OREN_MINT));
      }

      const rawAmount = BigInt(Math.round(amountUiTokens * 10 ** DECIMALS));
      tx.add(
        createTransferCheckedInstruction(playerAta, OREN_MINT, treasuryAta, publicKey, rawAmount, DECIMALS)
      );

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      return signature;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Player signs and sends a native SOL transfer to the treasury as
   * the entry fee — no token account needed, just a plain system
   * transfer. amountSol should already be computed from the live
   * price (see getSolUsdPrice above) before calling this.
   */
  const payEntryFeeSol = async (amountSol: number): Promise<string> => {
    if (!publicKey) throw new Error('Wallet not connected');
    setLoading(true);
    try {
      const lamports = Math.round(amountSol * 1e9);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: TREASURY_WALLET,
          lamports,
        })
      );
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      return signature;
    } finally {
      setLoading(false);
    }
  };

  return { getBalance, balance, payEntryFee, payEntryFeeSol, loading };
}