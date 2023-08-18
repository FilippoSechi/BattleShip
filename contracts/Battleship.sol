// SPDX-License-Identifier: MIT 
pragma solidity >=0.5.0 <0.9.0;

contract Battleship {
  enum States{
    Waiting,
    Connected,
    Payed,
    Ready,
    Play,
    Over,
    Rewarded
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
    address payable winner;
    uint256 balance;
    uint256 price;
    uint256 accuse_deadline;
    address accuser;
  }

  mapping(uint256 => Game) public games;
  uint256 public totalGames;

  event GameCreated(uint256 indexed gameId, address player1, uint256 price);
  event PlayerJoined(uint256 indexed gameId, address player2, uint256 price);
  event PlayerReady(uint256 indexed gameId, address player);
  event Fire(uint256 indexed gameId, address indexed  victim, uint8 coordinate);
  event ShotResult(uint256 indexed gameId, address indexed attacker, uint8 indexed coordinate, bool result);
  event CheatingDetected(uint256 indexed gameId, address indexed cheater);
  event WaitingForBoardValidation( uint256 indexed gameId, address indexed player);
  event Winner(uint256 indexed gameId, address indexed winner);
  event Payed(uint256 indexed gameId, address indexed player);

  function createGame(bool priv, uint256 price) private{
    uint256 gameId = totalGames++;
    Game storage newGame = games[gameId];
    newGame.player1 = msg.sender;
    newGame.gameState = States.Waiting;
    newGame.is_private = priv;
    newGame.current_turn = msg.sender;
    newGame.winning_score = 17;
    newGame.price = price;
    emit GameCreated(gameId, msg.sender, price);
  }

  function createPrivateGame(uint256 price) external{
    createGame(true,price);
  }

  function joinGame(uint256 gameId) external{
    require(gameId < totalGames, "Invalid game ID");
    Game storage existingGame = games[gameId];

    require(existingGame.player1 != address(0), "Game does not exist");
    require(existingGame.gameState == States.Waiting,"Game already started");

    existingGame.player2 = msg.sender;
    existingGame.gameState = States.Connected;
    emit PlayerJoined(gameId, msg.sender, existingGame.price);
  }

  function pay(uint256 gameId) public payable{

    require(gameId < totalGames, "Invalid game ID");
    Game storage game = games[gameId];
    require(game.gameState == States.Connected, "Game not full");
    require(game.price == msg.value, "Please pay the full fee");
    require(game.player1 == msg.sender || game.player2 == msg.sender, "Player does not participate to this game");
    game.balance += msg.value;
    if(game.balance != msg.value)
      game.gameState = States.Payed;
    emit Payed(gameId, msg.sender);
  }

  function joinRandomGame(uint256 price) external{
    uint256 gameId = 0;
    bool gameFound = false;

    for(uint256 i = 0; i < totalGames; i++) {
      Game storage existingGame = games[i];
      if (existingGame.player2 == address(0) && existingGame.gameState == States.Waiting && 
          !existingGame.is_private && existingGame.price == price) {
        gameFound = true;
        gameId = i;
        break;
      }
    }

    if (gameFound) {
      Game storage existingGame = games[gameId];
      existingGame.player2 = msg.sender;
      existingGame.gameState = States.Connected;
      emit PlayerJoined(gameId, msg.sender,existingGame.price);
    } else {
        createGame(false,price);
    }
  }

  function accusePlayer(uint256 gameId) external {
    require(gameId < totalGames, "Invalid game ID");
    Game storage game = games[gameId];
    require(game.player1 == msg.sender || game.player2 == msg.sender, "Player does not participate to this game");
    require(game.gameState == States.Play, "Accuse not possible in this phase");
    require(game.accuser == address(0) || game.accuser == msg.sender, "Must provide an answer to the previous accuse");
    
    if(game.accuser == address(0)){
      game.accuser = msg.sender;
      game.accuse_deadline = block.number + 5;
      return;
    }
    if(game.accuse_deadline >= block.number)
      return;
    
    declareWinner(gameId, msg.sender);
  }

  function respondAccuse(uint256 gameId) private{
    Game storage game = games[gameId];
    game.accuser = address(0);
    game.accuse_deadline = 0;
  }

  function commitBoard(uint256 gameId, bytes32 root) external {
    require(gameId < totalGames, "Invalid game ID");
    Game storage game = games[gameId];

    require(game.player1 != address(0), "Game does not exist");
    require(game.gameState == States.Ready || game.gameState == States.Payed, "Game already started");
    require(game.player1 == msg.sender || game.player2 == msg.sender, "Player does not participate to this game");
    require(game.merkleRoots[msg.sender] == 0, "Player already commited their board for this game");

    game.merkleRoots[msg.sender] = root;

    //Waiting for the commit of the other player
    if(game.gameState == States.Payed)
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
    if(games[gameId].gameState == States.Payed)
      return 2;
    if(games[gameId].gameState == States.Ready)
      return 3;
    if(games[gameId].gameState == States.Play)
      return 4;
    if(games[gameId].gameState == States.Over)
      return 5;
    return 6;
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

    respondAccuse(gameId);
    game.waiting_result = true;
    address victim;
    if(game.current_turn == game.player1)
      victim = game.player2;
    else 
      victim = game.player1;
    
    emit Fire(gameId,victim,coordinate);
  }

  function shotResult(uint256 gameId, uint8 coordinate, bool result, uint32 salt, bytes32[] calldata proof) external {
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
      checkForWin(gameId, attacker);
    }
    else{
      emit CheatingDetected(gameId, msg.sender);
      game.gameState = States.Over;
      declareWinner(gameId, attacker);
    }
    game.waiting_result = false;
  }

function verify(bytes32 root, bool result, uint32 salt, bytes32[] memory proof) private pure returns (bool){
    
    bytes32 computedHash = keccak256(abi.encode(result, salt));

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

  function checkBoardValidity(uint256 gameId, bool [] memory result) public{

    require(gameId < totalGames, "Invalid game ID");
    Game storage game = games[gameId];
    require(game.winner == msg.sender, "Player is not the winner of the match");
    require(game.gameState == States.Over, "Board validity not checked in this phase");

    uint8 placed_ships = 0;
    for(uint256 i = 0; i < result.length; i++)
      placed_ships = (result[i] == true? placed_ships+1 : placed_ships);

    if(placed_ships < game.winning_score){
      emit CheatingDetected(gameId, msg.sender);
      address winner = (msg.sender == game.player1? game.player2 : game.player1);
      declareWinner(gameId, winner);
    }
    else{
      declareWinner(gameId, msg.sender);
    }
  }

  function checkForWin(uint256 gameId,address player) private {

    Game storage game=games[gameId];
    if(game.scores[player] == game.winning_score){
      game.winner = address(uint160(player));
      emit WaitingForBoardValidation(gameId, player);
      game.gameState = States.Over;
    }
  }

  function declareWinner(uint256 gameId, address winner) private{
    Game storage game=games[gameId];
    emit Winner(gameId, winner);
    game.winner = address(uint160(winner));
    game.gameState = States.Rewarded;
    game.winner.transfer(game.balance);
  }
}
