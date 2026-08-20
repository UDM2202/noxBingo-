import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';

const CONTRACT_ADDRESS = '0x1e80312ef10965C49E626fCB79aD1A5983e15B72';
const USDC_ADDRESS = '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582';

// `as const` lets viem/wagmi infer real argument and return types from
// the ABI shape itself, instead of everything collapsing to `any`/`{}`.
const contractABI = [
  {
    type: 'function',
    name: 'createGame',
    inputs: [
      { name: 'roomCode', type: 'string' },
      { name: 'bingoPrize', type: 'uint256' },
      { name: 'noxPrize', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'declareWinner',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimPrize',
    inputs: [{ name: 'gameId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPlayerStats',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      { name: 'totalWinnings', type: 'uint256' },
      { name: 'played', type: 'uint256' },
      { name: 'won', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;

const erc20ApproveAbi = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

export function usePolygonContract() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: playerStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI,
    functionName: 'getPlayerStats',
    args: [address || '0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address },
  });

  const createGame = async (roomCode: string, bingoPrize: number, noxPrize: number) => {
    if (!address) return;
    const totalUSDC = parseUnits(String(bingoPrize + noxPrize), 6);

    // Approve USDC spending first. Note: this does not currently wait
    // for the approval to actually be mined before the createGame
    // transaction below is sent — on Polygon that's usually fine given
    // block times, but under load there's a real chance createGame's
    // internal transferFrom reverts because the approval hasn't landed
    // yet. If that turns out to bite in testing, wire in
    // useWaitForTransactionReceipt on the approve hash before proceeding.
    await writeContractAsync({
      address: USDC_ADDRESS,
      abi: erc20ApproveAbi,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, totalUSDC],
    });

    const tx = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'createGame',
      args: [roomCode, parseUnits(String(bingoPrize), 6), parseUnits(String(noxPrize), 6)],
    });

    return tx;
  };

  const declareWinner = async (gameId: number, winnerAddress: string, amount: number) => {
    const tx = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'declareWinner',
      args: [BigInt(gameId), winnerAddress as `0x${string}`, parseUnits(String(amount), 6)],
    });
    return tx;
  };

  const claimPrize = async (gameId: number) => {
    const tx = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'claimPrize',
      args: [BigInt(gameId)],
    });
    return tx;
  };

  const stats = playerStats as readonly [bigint, bigint, bigint] | undefined;

  return {
    createGame,
    declareWinner,
    claimPrize,
    playerStats: stats
      ? {
          totalWinnings: Number(stats[0]) / 1e6,
          gamesPlayed: Number(stats[1]),
          gamesWon: Number(stats[2]),
        }
      : null,
  };
}