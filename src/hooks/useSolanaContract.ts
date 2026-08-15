import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
} from '@solana/spl-token';
import { useState } from 'react';

const OREN_MINT = new PublicKey('6EqY4SZKesXPzVJD3BhdFszYqnossy6t1gU43GSBqkQs');
// Same address the server pays winners from — public knowledge, safe
// to hardcode (it's just where the money goes, not a secret).
export const TREASURY_WALLET = new PublicKey('Gahk26BjGG5BQR8AbRVwb3CSTh5rJquyZxN4cHR44sVz');
const DECIMALS = 8;

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

  return { getBalance, balance, payEntryFee, loading };
}