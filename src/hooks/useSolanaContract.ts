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

const SOL_USD_FEED_ID = 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';
const HERMES_URL = 'https://hermes.pyth.network/v2/updates/price/latest';
export async function getSolUsdPrice(): Promise<number> {
  const res = await fetch(`${HERMES_URL}?ids[]=${SOL_USD_FEED_ID}`);
  if (!res.ok) throw new Error('Could not fetch live SOL price');
  const data = await res.json();
  const feed = data.parsed?.[0];
  if (!feed) throw new Error('No SOL/USD price available right now');
  return Number(feed.price.price) * 10 ** feed.price.expo;
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