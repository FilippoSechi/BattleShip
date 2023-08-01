// SPDX-License-Identifier: MIT 
pragma solidity >=0.5.0 <0.9.0;

contract Battleship {
  enum States{
    Waiting,
    Connected,
    Ready,
    Over
  }

  struct Game {
    address player1;
    address player2;
    States gameSate;
    bool is_private;
    bytes32 root_p1;
    bytes32 root_p2;
    address current_turn;
    uint8 score_p1;
    uint8 score_p2;
  }

  mapping(uint256 => Game) public games;
  uint256 public totalGames;

  event GameCreated(uint256 indexed gameId, address indexed player1);
  event PlayerJoined(uint256 indexed gameId, address indexed player2);

  function createGame(bool priv) private{
    uint256 gameId = totalGames++;
    Game storage newGame = games[gameId];
    newGame.player1 = msg.sender;
    newGame.gameSate = States.Waiting;
    newGame.is_private = priv;
    emit GameCreated(gameId, msg.sender);
  }

  function createPrivateGame() external {
    createGame(true);
  }

  function joinGame(uint256 gameId) external {
    require(gameId < totalGames, "Invalid game ID");
    Game storage existingGame = games[gameId];

    require(existingGame.player1 != address(0), "Game does not exist");
    require(existingGame.gameSate != States.Connected, "Game already has 2 players");
    require(existingGame.gameSate != States.Ready, "Game already started");
    require(existingGame.gameSate != States.Over, "Game already over");

    existingGame.player2 = msg.sender;
    existingGame.gameSate = States.Connected;
    emit PlayerJoined(gameId, msg.sender);
  }


  function joinRandomGame() external {
    uint256 gameId = 0;
    bool gameFound = false;

    for(uint256 i = 0; i < totalGames; i++) {
      Game storage existingGame = games[i];
      if (existingGame.player2 == address(0) && existingGame.gameSate == States.Waiting) {
        gameFound = true;
        gameId = i;
        break;
      }
    }

    if (gameFound) {
      Game storage existingGame = games[gameId];
      existingGame.player2 = msg.sender;
      existingGame.gameSate = States.Connected;
      emit PlayerJoined(gameId, msg.sender);
    } else {
        createGame(false);
    }
  }

  function verify(bytes32 root, bool result, uint16 salt, bytes32[] memory proof) private pure returns (bool){
    
    bytes32 computedHash = keccak256(abi.encodePacked(result, salt));

    for (uint256 i = 0; i < proof.length; i++) {
      bytes32 proofElement = proof[i];

      if (computedHash <= proofElement) {
        // Hash(current computed hash + current element of the proof)
        computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
      } else {
        // Hash(current element of the proof + current computed hash)
        computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
      }
    }

    // Check if the computed hash (root) is equal to the provided root
    return computedHash == root;
  }
}
