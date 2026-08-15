// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

contract NoxBingoPolygon {
    address public owner;
    IERC20 public usdc;
    uint256 public totalGames;
    
    struct Game {
        uint256 id;
        address host;
        address winner;
        uint256 prizePool;
        uint256 bingoPrize;
        uint256 noxPrize;
        string roomCode;
        bool active;
        bool paid;
        uint256 timestamp;
    }
    
    mapping(uint256 => Game) public games;
    mapping(address => uint256) public winnings;
    mapping(address => uint256) public gamesPlayed;
    mapping(address => uint256) public gamesWon;
    
    event GameCreated(uint256 gameId, address host, string roomCode, uint256 bingoPrize, uint256 noxPrize);
    event WinnerDeclared(uint256 gameId, address winner, uint256 amount);
    event PrizeClaimed(address winner, uint256 amount);
    
    // Polygon USDC: 0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582 (Amoy testnet)
    // Polygon USDC: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 (Mainnet)
    constructor(address _usdc) {
        owner = msg.sender;
        usdc = IERC20(_usdc);
    }
    
    function createGame(string calldata roomCode, uint256 bingoPrize, uint256 noxPrize) external returns (uint256) {
        uint256 totalPrize = bingoPrize + noxPrize;
        require(usdc.transferFrom(msg.sender, address(this), totalPrize), "USDC transfer failed");
        
        totalGames++;
        uint256 gameId = totalGames;
        
        games[gameId] = Game({
            id: gameId,
            host: msg.sender,
            winner: address(0),
            prizePool: totalPrize,
            bingoPrize: bingoPrize,
            noxPrize: noxPrize,
            roomCode: roomCode,
            active: true,
            paid: false,
            timestamp: block.timestamp
        });
        
        emit GameCreated(gameId, msg.sender, roomCode, bingoPrize, noxPrize);
        return gameId;
    }
    
    function declareWinner(uint256 gameId, address winner, uint256 amount) external {
        Game storage game = games[gameId];
        require(game.active, "Game not active");
        require(game.winner == address(0), "Winner already declared");
        require(msg.sender == game.host || msg.sender == owner, "Only host or owner");
        require(amount <= game.prizePool, "Prize exceeds pool");
        
        game.winner = winner;
        game.active = false;
        
        winnings[winner] += amount;
        gamesPlayed[winner]++;
        gamesWon[winner]++;
        
        emit WinnerDeclared(gameId, winner, amount);
    }
    
    function declareNoWinner(uint256 gameId) external {
        Game storage game = games[gameId];
        require(game.active, "Game not active");
        require(msg.sender == game.host || msg.sender == owner, "Only host or owner");
        
        game.active = false;
        require(usdc.transfer(game.host, game.prizePool), "Refund failed");
    }
    
    function claimPrize(uint256 gameId) external {
        Game storage game = games[gameId];
        require(!game.active, "Game still active");
        require(game.winner == msg.sender, "Not the winner");
        require(!game.paid, "Already paid");
        
        game.paid = true;
        uint256 amount = game.bingoPrize;
        if (game.noxPrize > 0) {
            amount += game.noxPrize;
        }
        
        require(usdc.transfer(msg.sender, amount), "Prize transfer failed");
        emit PrizeClaimed(msg.sender, amount);
    }
    
    function getPlayerStats(address player) external view returns (uint256 totalWinnings, uint256 played, uint256 won) {
        return (winnings[player], gamesPlayed[player], gamesWon[player]);
    }
}
