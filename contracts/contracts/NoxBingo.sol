// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NoxBingo {
    address public owner;
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
    
    constructor() {
        owner = msg.sender;
    }
    
    function createGame(string calldata roomCode, uint256 bingoPrize, uint256 noxPrize) external payable returns (uint256) {
        require(msg.value >= bingoPrize + noxPrize, "Insufficient prize pool");
        
        totalGames++;
        uint256 gameId = totalGames;
        
        games[gameId] = Game({
            id: gameId,
            host: msg.sender,
            winner: address(0),
            prizePool: msg.value,
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
        // Prize returns to host
        payable(game.host).transfer(game.prizePool);
    }
    
    function claimPrize(uint256 gameId) external {
        Game storage game = games[gameId];
        require(!game.active, "Game still active");
        require(game.winner == msg.sender, "Not the winner");
        require(!game.paid, "Already paid");
        
        uint256 amount = game.bingoPrize;
        if (game.winner != address(0)) {
            amount = game.bingoPrize + game.noxPrize;
        }
        
        game.paid = true;
        payable(msg.sender).transfer(amount);
        
        emit PrizeClaimed(msg.sender, amount);
    }
    
    function getPlayerStats(address player) external view returns (uint256 totalWinnings, uint256 played, uint256 won) {
        return (winnings[player], gamesPlayed[player], gamesWon[player]);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}
