// SPDX-License-Identifier: MIT 
pragma solidity >=0.5.0 <0.9.0;

contract Battleship {
  enum States{
    Waiting,
    Connected,
    Ready,
    Play,
    Over
  }
  
  struct Shot{
    bool result;
    bool verified;
  }

  struct Game {
    address player1;
    address player2;
    States gameState;
    bool is_private;
    mapping(address => bytes32) merkleRoots;
    address current_turn;
    mapping(address => uint8) scores;
    uint8 winning_score;
    mapping(address => mapping(uint8 => Shot)) shots;
    bool waiting_result;
  }

  mapping(uint256 => Game) public games;
  uint256 public totalGames;

  event GameCreated(uint256 indexed gameId, address player1);
  event PlayerJoined(uint256 indexed gameId, address player2);
  event PlayerReady(uint256 indexed gameId, address player);
  event Fire(uint256 indexed gameId, address indexed  victim, uint8 coordinate);
  event ShotResult(uint256 indexed gameId, address indexed attacker, uint8 indexed coordinate, bool result);
  event CheatingDetected(uint256 indexed gameId, address indexed cheater);
  event Winner(uint256 indexed gameId, address indexed winner);

  function createGame(bool priv) private{
    uint256 gameId = totalGames++;
    Game storage newGame = games[gameId];
    newGame.player1 = msg.sender;
    newGame.gameState = States.Waiting;
    newGame.is_private = priv;
    newGame.current_turn = msg.sender;
    newGame.winning_score = 17;
    emit GameCreated(gameId, msg.sender);
  }

  function createPrivateGame() external {
    createGame(true);
  }

  function joinGame(uint256 gameId) external {
    require(gameId < totalGames, "Invalid game ID");
    Game storage existingGame = games[gameId];

    require(existingGame.player1 != address(0), "Game does not exist");
    require(existingGame.gameState == States.Waiting,"Game already started");

    existingGame.player2 = msg.sender;
    existingGame.gameState = States.Connected;
    emit PlayerJoined(gameId, msg.sender);
  }


  function joinRandomGame() external {
    uint256 gameId = 0;
    bool gameFound = false;

    for(uint256 i = 0; i < totalGames; i++) {
      Game storage existingGame = games[i];
      if (existingGame.player2 == address(0) && existingGame.gameState == States.Waiting && !existingGame.is_private) {
        gameFound = true;
        gameId = i;
        break;
      }
    }

    if (gameFound) {
      Game storage existingGame = games[gameId];
      existingGame.player2 = msg.sender;
      existingGame.gameState = States.Connected;
      emit PlayerJoined(gameId, msg.sender);
    } else {
        createGame(false);
    }
  }

  function commitBoard(uint256 gameId, bytes32 root) external {
    require(gameId < totalGames, "Invalid game ID");
    Game storage game = games[gameId];

    require(game.player1 != address(0), "Game does not exist");
    require(game.gameState == States.Ready || game.gameState == States.Connected, "Game already started");
    require(game.player1 == msg.sender || game.player2 == msg.sender, "Player does not participate to this game");
    require(game.merkleRoots[msg.sender] == 0, "Player already commited their board for this game");

    game.merkleRoots[msg.sender] = root;

    //Waiting for the commit of the other player
    if(game.gameState == States.Connected)
      game.gameState = States.Ready;
    //Other player already commited their board
    else if(game.gameState == States.Ready)
      game.gameState = States.Play;
    
    emit PlayerReady(gameId,msg.sender);
  }

  function currentTurn(uint256 gameId) public view returns (address){
    require(gameId < totalGames, "Invalid game ID");
    return games[gameId].current_turn;
  }

  function gameState(uint256 gameId) external view returns (uint8){
    require(gameId < totalGames, "Invalid game ID");
    if(games[gameId].gameState == States.Waiting)
      return 0;
    if(games[gameId].gameState == States.Connected)
      return 1;
    if(games[gameId].gameState == States.Ready)
      return 2;
    if(games[gameId].gameState == States.Play)
      return 3;

    return 4;
  }

  function fire(uint256 gameId, uint8 coordinate) external{
    require(gameId < totalGames, "Invalid game ID");
    Game storage game = games[gameId];
    require(game.player1 == msg.sender || game.player2 == msg.sender, "Player does not participate to this game");
    require(game.gameState == States.Play, "Firing not allowed");
    require(game.current_turn == msg.sender,"Player must wait for their turn");
    require(coordinate >= 0 && coordinate < 100, "Invalid coordinate");
    require(!game.waiting_result, "Waiting for the result of previous shots");
    require(!game.shots[msg.sender][coordinate].verified, "Player already fired to this coordinate");

    game.waiting_result = true;
    address victim;
    if(game.current_turn == game.player1)
      victim = game.player2;
    else 
      victim = game.player1;
    
    emit Fire(gameId,victim,coordinate);
  }

  function shotResult(uint256 gameId, uint8 coordinate, bool result, bytes2 salt, bytes32[] calldata proof) external {
    require(gameId < totalGames, "Invalid game ID");
    Game storage game = games[gameId];
    require(game.current_turn != msg.sender, "Not player turn");
    require(game.gameState == States.Play,"Operation not allowed in this game state");
    require(coordinate >= 0 && coordinate < 100, "Invalid coordinate");
    require(game.player1 == msg.sender || game.player2 == msg.sender, "Player does not participate to this game");
    require(game.waiting_result, "Currently not waiting a result");

    address attacker = game.current_turn;

    require(!game.shots[attacker][coordinate].verified, "Proof for this coordinate already provided");

    if(verify(game.merkleRoots[msg.sender], result, salt, proof)){
      game.shots[attacker][coordinate].result = result;
       game.shots[attacker][coordinate].verified = true;
      if(result)
        game.scores[attacker]++;
        
      game.current_turn = msg.sender;
      emit ShotResult(gameId,attacker,coordinate,result);
      checkForWin(gameId, game, attacker);
    }
    else{
      emit CheatingDetected(gameId, msg.sender);
    }
    game.waiting_result = false;
  }

function verify(bytes32 root, bool result, bytes2 salt, bytes32[] memory proof) private pure returns (bool){
    
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
  
  function checkForWin(uint256 gameId, Game storage game,address winner) private {
    if(game.scores[winner] == game.winning_score){
      emit Winner(gameId,winner);
      game.gameState = States.Over;
    }
  }
}
