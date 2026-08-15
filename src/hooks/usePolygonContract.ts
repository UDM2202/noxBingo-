import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';

const CONTRACT_ADDRESS = '0x1e80312ef10965C49E626fCB79aD1A5983e15B72';
const PRIZE_WALLET = 'Gahk26BjGG5BQR8AbRVwb3CSTh5rJquyZxN4cHR44sVz';
const USDC_ADDRESS = '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582';

const contractABI = [
  {
    "type": "function",
    "name": "createGame",
    "inputs": [
      { "name": "roomCode", "type": "string" },
      { "name": "bingoPrize", "type": "uint256" },
      { "name": "noxPrize", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "declareWinner",
    "inputs": [
      { "name": "gameId", "type": "uint256" },
      { "name": "winner", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimPrize",
    "inputs": [{ "name": "gameId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getPlayerStats",
    "inputs": [{ "name": "player", "type": "address" }],
    "outputs": [
      { "name": "totalWinnings", "type": "uint256" },
      { "name": "played", "type": "uint256" },
      { "name": "won", "type": "uint256" }
    ],
    "stateMutability": "view"
  }
];

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
    
    // First approve USDC spending
    const approveTx = await writeContractAsync({
      address: USDC_ADDRESS,
      abi: ['function approve(address spender, uint256 amount) returns (bool)'],
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, totalUSDC],
    });

    // Then create game
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
      args: [BigInt(gameId), winnerAddress, parseUnits(String(amount), 6)],
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

  return {
    createGame,
    declareWinner,
    claimPrize,
    playerStats: playerStats ? {
      totalWinnings: Number(playerStats[0]) / 1e6,
      gamesPlayed: Number(playerStats[1]),
      gamesWon: Number(playerStats[2]),
    } : null,
  };
}

