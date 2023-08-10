const Tree = require("./merkleTree");
const GameStates= {
  Waiting: 0, //Initial state
  Connected: 1, //Two players connected
  Ready : 2,  //One player commited their board
  Play: 3,  //Both players commited their boards
  Over: 4   //Game ended
};

document.addEventListener('DOMContentLoaded', () => {
  const userGrid = document.querySelector('.grid-user')
  const computerGrid = document.querySelector('.grid-computer')
  const displayGrid = document.querySelector('.grid-display')
  let destroyer = null
  let submarine = null
  let cruiser = null
  let battleship = null
  let carrier = null
  const rotateButton = document.querySelector('#rotate')
  const turnDisplay = document.querySelector('#whose-go')
  const infoDisplay = document.querySelector('#info')
  const setupButtons = document.getElementById('setup-buttons')
  const userSquares = []
  const computerSquares = []
  let ships = null;
  let isHorizontal = true
  let playerNum = 1
  const width = 10
  let allShipsPlaced = false

  //Ships
  const shipArray = [
    {
      name: 'destroyer',
      directions: [
        [0, 1],
        [0, width]
      ]
    },
    {
      name: 'submarine',
      directions: [
        [0, 1, 2],
        [0, width, width*2]
      ]
    },
    {
      name: 'cruiser',
      directions: [
        [0, 1, 2],
        [0, width, width*2]
      ]
    },
    {
      name: 'battleship',
      directions: [
        [0, 1, 2, 3],
        [0, width, width*2, width*3]
      ]
    },
    {
      name: 'carrier',
      directions: [
        [0, 1, 2, 3, 4],
        [0, width, width*2, width*3, width*4]
      ]
    },
  ]


  createBoard(userGrid, userSquares)
  createBoard(computerGrid, computerSquares)
  generateShipContainers()

  //Store the expected number of occuped cells, after correct placement of all ships
  const tot_ships = () => {
    let secondLevelChildren = 0;
    for (let child of displayGrid.children) 
      secondLevelChildren += child.children.length;

    return secondLevelChildren;
    }
  const expectedNumShip = tot_ships();
  /*startMultiPlayer()

    // On Timeout
    socket.on('timeout', () => {
      infoDisplay.innerHTML = 'You have reached the 10 minute limit'
    })

    // Setup event listeners for firing
    computerSquares.forEach(square => {
      square.addEventListener('click', () => {
        if(currentPlayer === 'user' && ready && enemyReady) {
          shotFired = square.dataset.id
          socket.emit('fire', shotFired)
        }
      })
    })

    // On Fire Received
    socket.on('fire', id => {
      enemyGo(id)
      const square = userSquares[id]
      socket.emit('fire-reply', square.classList)
      playGameMulti(socket)
    })

    // On Fire Reply Received
    socket.on('fire-reply', classList => {
      revealSquare(classList)
      playGameMulti(socket)
    })
  }
*/
  
  //Create Board
  function createBoard(grid, squares) {
    for (let i = 0; i < width*width; i++) {
      const square = document.createElement('div')
      square.dataset.id = i
      grid.appendChild(square)
      squares.push(square)
    }
  }
  
  //Clear and reset game board
  function resetBoard (grid,squares){
    while (squares.length > 0) {
      squares.pop();
    }
    while (grid.firstChild) {
      grid.removeChild(grid.lastChild);
    }
    createBoard(grid,squares);

    while(displayGrid.firstChild)
      displayGrid.removeChild(displayGrid.lastChild);
    generateShipContainers();
  }
  
  //Reset the ship placement by pressing "RESET"
  function resetPlacement(){
    resetBoard(userGrid,userSquares);
  }

  //Generate ships
  function generateShipContainers(){

    //Create html elements
    for (const ship of shipArray) {
      const shipContainer = document.createElement('div');
      shipContainer.classList.add('ship');
      shipContainer.classList.add(`${ship.name}-container`);
      shipContainer.setAttribute('draggable',true);
    
      for (let index = 0; index < ship.directions[0].length; index++) {
        const div = document.createElement('div');
        div.id = `${ship.name}-${index}`;
        shipContainer.appendChild(div);
      }
    
      displayGrid.appendChild(shipContainer);
    }

    //Initialization of ship related events
    ships = document.querySelectorAll('.ship');

    ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
      selectedShipNameWithIndex = e.target.id
      // console.log(selectedShipNameWithIndex)
    }))

    //move around user ship
    ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragover', dragOver))
    userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
    userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
    userSquares.forEach(square => square.addEventListener('drop', dragDrop))
    userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

    destroyer = document.querySelector('.destroyer-container')
    submarine = document.querySelector('.submarine-container')
    cruiser = document.querySelector('.cruiser-container')
    battleship = document.querySelector('.battleship-container')
    carrier = document.querySelector('.carrier-container')
    isHorizontal = true;
  }

  //Rotate the ships
  function rotate() {
    if (isHorizontal) {
      destroyer.classList.toggle('destroyer-container-vertical')
      submarine.classList.toggle('submarine-container-vertical')
      cruiser.classList.toggle('cruiser-container-vertical')
      battleship.classList.toggle('battleship-container-vertical')
      carrier.classList.toggle('carrier-container-vertical')
      isHorizontal = false
      // console.log(isHorizontal)
      return
    }
    if (!isHorizontal) {
      destroyer.classList.toggle('destroyer-container-vertical')
      submarine.classList.toggle('submarine-container-vertical')
      cruiser.classList.toggle('cruiser-container-vertical')
      battleship.classList.toggle('battleship-container-vertical')
      carrier.classList.toggle('carrier-container-vertical')
      isHorizontal = true
      // console.log(isHorizontal)
      return
    }
  }
  rotateButton.addEventListener('click', rotate)


  let selectedShipNameWithIndex
  let draggedShip
  let draggedShipLength

  function dragStart() {
    draggedShip = this
    draggedShipLength = this.childNodes.length
    // console.log(draggedShip)
  }

  function dragOver(e) {
    e.preventDefault()
  }

  function dragEnter(e) {
    e.preventDefault()
  }

  function dragLeave() {
    // console.log('drag leave')
  }

  function dragDrop() {
    let shipNameWithLastId = draggedShip.lastChild.id
    let shipClass = shipNameWithLastId.slice(0, -2)
    // console.log(shipClass)
    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
    let shipLastId = lastShipIndex + parseInt(this.dataset.id)
    // console.log(shipLastId)
    const notAllowedHorizontal = [0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93]
    const notAllowedVertical = [99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60]
    
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex)
    let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex)

    selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))

    shipLastId = shipLastId - selectedShipIndex
    // console.log(shipLastId)

    if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
      for (let i=0; i < draggedShipLength; i++) {
        let directionClass
        if (i === 0) directionClass = 'start'
        if (i === draggedShipLength - 1) directionClass = 'end'
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', 'horizontal', directionClass, shipClass)
      }
    //As long as the index of the ship you are dragging is not in the newNotAllowedVertical array! This means that sometimes if you drag the ship by its
    //index-1 , index-2 and so on, the ship will rebound back to the displayGrid.
    } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
      for (let i=0; i < draggedShipLength; i++) {
        let directionClass
        if (i === 0) directionClass = 'start'
        if (i === draggedShipLength - 1) directionClass = 'end'
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('taken', 'vertical', directionClass, shipClass)
      }
    } else return

    displayGrid.removeChild(draggedShip)
    //Check if all ships are correctly placed
    if(!displayGrid.querySelector('.ship')){ 
      if(checkPlacementValidity()){
        infoDisplay.innerHTML = ""
        allShipsPlaced = true;
        return;
      }
      else{
        //Invalid placement. Reset all
        resetBoard(userGrid, userSquares);
        infoDisplay.innerHTML = "Placement is not valid"
        allShipsPlaced = false;
        return;
      }
    }
  }
   
  //Check if some ships where mistakenly placed
  function checkPlacementValidity(){
    let actualNumShip = 0;
    for(const cell of userSquares){
      if(cell.classList.contains('taken'))
        actualNumShip++;
    }
    return actualNumShip == expectedNumShip;
  }

  function dragEnd() {
    // console.log('dragend')
  }

  /* Game Logic for MultiPlayer
  function playGameMulti(socket) {
    setupButtons.style.display = 'none'
    if(isGameOver) return
    if(!ready) {
      socket.emit('player-ready')
      ready = true
      playerReady(playerNum)
    }

    if(enemyReady) {
      if(currentPlayer === 'user') {
        turnDisplay.innerHTML = 'Your Go'
      }
      if(currentPlayer === 'enemy') {
        turnDisplay.innerHTML = "Enemy's Go"
      }
    }
  }*/

  //Highlights player status bar (READY)
  function playerReady(num) {
    let player = `.p${parseInt(num)}`
    document.querySelector(`${player} .ready`).classList.toggle('active')
  }

  let destroyerCount = 0
  let submarineCount = 0
  let cruiserCount = 0
  let battleshipCount = 0
  let carrierCount = 0

  /*
  function revealSquare(classList) {
    const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
    const obj = Object.values(classList)
    if (!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver) {
      if (obj.includes('destroyer')) destroyerCount++
      if (obj.includes('submarine')) submarineCount++
      if (obj.includes('cruiser')) cruiserCount++
      if (obj.includes('battleship')) battleshipCount++
      if (obj.includes('carrier')) carrierCount++
    }
    if (obj.includes('taken')) {
      enemySquare.classList.add('boom')
    } else {
      enemySquare.classList.add('miss')
    }
    checkForWins()
    currentPlayer = 'enemy'
  }*/

  let cpuDestroyerCount = 0
  let cpuSubmarineCount = 0
  let cpuCruiserCount = 0
  let cpuBattleshipCount = 0
  let cpuCarrierCount = 0

/*
  function enemyGo(square) {

    const hit = userSquares[square].classList.contains('taken')
    userSquares[square].classList.add(hit ? 'boom' : 'miss')
    if (userSquares[square].classList.contains('destroyer')) cpuDestroyerCount++
    if (userSquares[square].classList.contains('submarine')) cpuSubmarineCount++
    if (userSquares[square].classList.contains('cruiser')) cpuCruiserCount++
    if (userSquares[square].classList.contains('battleship')) cpuBattleshipCount++
    if (userSquares[square].classList.contains('carrier')) cpuCarrierCount++
    checkForWins()
    currentPlayer = 'user'
    turnDisplay.innerHTML = 'Your Go'
  }

  function checkForWins() {
    if (destroyerCount === 2) {
      infoDisplay.innerHTML = `You sunk the enemy's destroyer`
      destroyerCount = 10
    }
    if (submarineCount === 3) {
      infoDisplay.innerHTML = `You sunk the enemy's submarine`
      submarineCount = 10
    }
    if (cruiserCount === 3) {
      infoDisplay.innerHTML = `You sunk the enemy's cruiser`
      cruiserCount = 10
    }
    if (battleshipCount === 4) {
      infoDisplay.innerHTML = `You sunk the enemy's battleship`
      battleshipCount = 10
    }
    if (carrierCount === 5) {
      infoDisplay.innerHTML = `You sunk the enemy's carrier`
      carrierCount = 10
    }
    if (cpuDestroyerCount === 2) {
      infoDisplay.innerHTML = `Enemy sunk your destroyer`
      cpuDestroyerCount = 10
    }
    if (cpuSubmarineCount === 3) {
      infoDisplay.innerHTML = 'Enemy sunk your submarine'
      cpuSubmarineCount = 10
    }
    if (cpuCruiserCount === 3) {
      infoDisplay.innerHTML = `Enemy sunk your cruiser`
      cpuCruiserCount = 10
    }
    if (cpuBattleshipCount === 4) {
      infoDisplay.innerHTML = `Enemy sunk your battleship`
      cpuBattleshipCount = 10
    }
    if (cpuCarrierCount === 5) {
      infoDisplay.innerHTML = `Enemy sunk your carrier`
      cpuCarrierCount = 10
    }

    if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount) === 50) {
      infoDisplay.innerHTML = "YOU WIN"
      gameOver()
    }
    if ((cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount) === 50) {
      infoDisplay.innerHTML = `ENEMY WINS`
      gameOver()
    }
  }*/

  function gameOver() {
    isGameOver = true
  }

  //Highlights player status bar (CONNECTED)
  function playerConnected (num){
    let player = `.p${parseInt(num)}`;
    document.querySelector(`${player} .connected`).classList.toggle('active');
  }

  function bindEvents() {
    $(document).on('click', '#rand_game', App.joinRandomGame);
    $(document).on('click', '#priv_game', App.createPrivateGame);
    $(document).on('click', '#join_game', App.joinSpecificGame);
    $(document).on('click', '#ready', App.ready);
    $(document).on('click', '#reset', resetPlacement);
  }

  App = {
    web3Provider: null,
    contracts: {},
    gameId: 0,
    account: '',
    merkleTree: null,
  
    init: async function() {
      return await App.initWeb3();
    },
  
    initWeb3: async function() {
      if(window.ethereum){
        App.web3Provider = window.ethereum;
        try{
          await window.ethereum.enable();
        } catch(error){
          console.error("User denied account access");
        }
      }
      else if(window.web3){
        App.web3Provider = window.web3.currentProvider;
      }
      else{
        App.web3Provider = new Web3.provider.HttpProvider('http://localhost:7545');
      }
  
      web3 = new Web3(App.web3Provider);
      return App.initContract();
    },
  
    initContract: function() {
      $.getJSON("Battleship.json",function(data) {
        var BattleshipArtifact = data;
        App.contracts.Battleship = TruffleContract(BattleshipArtifact);
  
        App.contracts.Battleship.setProvider(App.web3Provider);
      });
  
      return bindEvents();
    },
  
    joinRandomGame: function() {
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
        App.account = accounts[0];
        App.contracts.Battleship.deployed().then(function(instance) {
          battleshipInstance = instance;
          return battleshipInstance.joinRandomGame({ from: App.account });
        }).then(function(result) {
          
            //Player created a new game
            if(result.logs[0].event === "GameCreated"){
              //Save gameId
              App.gameId = parseInt(result.logs[0].args.gameId);
              playerConnected(1);
              console.log("EVENT GameCreated: %d",App.gameId);
              //Wait for the second player to join
              App.playerJoinedWatcher(battleshipInstance);
            }

            //Player joined a pre-existent game
            else if(result.logs[0].event === "PlayerJoined"){
              //Save gameId
              App.gameId = parseInt(result.logs[0].args.gameId);
              console.log("EVENT PlayerJoined: %d",App.gameId);
              playerConnected(1);
              playerConnected(2);
              playerNum = 2;
              //Watch for opponent board commitment
              App.playerReadyWatcher(battleshipInstance);
            }
          }).catch(e => {
          console.error(e.message);
        })}
      )
    },
     
    joinSpecificGame: function() {
      let input = document.getElementById("gameIDInput").value;
    
      // Check if the input contains only numeric characters
      if (!/^\d+$/.test(input)) {
        alert("Invalid Game ID. Please enter only numeric characters.");
        return;
      }
  
      let gameId = parseInt(input, 10);
  
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
        App.account = accounts[0];
        App.contracts.Battleship.deployed().then(function(instance) {
          battleshipInstance = instance;
          return battleshipInstance.joinGame(gameId,{ from: App.account });
        }).then(function(result) {
          
            document.getElementById("gameIdDisplay").textContent = result.logs[0].args.gameId;
            App.gameId = parseInt(result.logs[0].args.gameId);
            console.log("EVENT player2 joined: %d",App.gameId);
            playerConnected(1);
            playerConnected(2);
            playerNum = 2;
            //Watch for opponent board commitment
            App.playerReadyWatcher(battleshipInstance);
          }
          ).catch(e => {
          console.error(e.message);
        });
      });
    },
    
    createPrivateGame: function() {
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
        App.account = accounts[0];
        App.contracts.Battleship.deployed().then(function(instance) {
          battleshipInstance = instance;
          return battleshipInstance.createPrivateGame({ from: App.account });
        }).then(function(result) {
          // The createPrivateGame function should not return anything,
          // so this block will be executed when the transaction is mined.
            App.gameId = parseInt(result.logs[0].args.gameId);
            document.getElementById("gameIdDisplay").textContent = App.gameId;
            playerConnected(1);
            console.log("EVENT GameCreated: %d",App.gameId);
  
            //Wait for another player to join the game
            App.playerJoinedWatcher(battleshipInstance);
            
          }).catch(e => {
          console.error(e.message);
        })}
      );
    },
  
    //Watch for the event PlayerJoined
    playerJoinedWatcher: function(instance) {
      instance.PlayerJoined().watch(async (error, result) => {
        if (error) {
          console.log(error);
        } else {
          const gameID = parseInt(result.args.gameId);
          if (App.gameId != gameID) return;
          try{
            const state = await App.getGameState();
            if (state == GameStates.Connected) {
              console.log("EVENT PlayerJoined:", gameID);
              playerConnected(2);
              // Watch for the opponent's board commitment
              App.playerReadyWatcher(instance);
            }
          }catch(e){
            console.error(e)}
        }
      });
    },

    //Watch for the event playerReady (board committed)
    playerReadyWatcher: function (instance){
      instance.PlayerReady().watch(async (error,result)=>{
          if(error)
            console.log(error);
          else{
            if(parseInt(result.args.gameId) != App.gameId) return;
            const state = await App.getGameState();

            //Case in which one player has not yet commited its board
            if( state == GameStates.Ready){
              console.log("EVENT PlayerReady: %d %s",App.gameId,result.args.player);
              if(result.args.player != App.account)
                playerReady(playerNum == 2? 1:2);
              else
                playerReady(playerNum);
            }
            //Both players have commited their boards
            else if(state == GameStates.Play){
              console.log("EVENT PlayerReady: %d %s",App.gameId,result.args.player);
              //Display msg based on whose turn it is
              const currentTurn = await App.getCurrentTurn();
              if(currentTurn === App.account)
                turnDisplay.innerHTML = 'Your Go';
              else
                turnDisplay.innerHTML = "Enemy's Go";

              if(result.args.player != App.account)
                playerReady(playerNum == 2? 1:2);
              else
                playerReady(playerNum);

              //Set event listeners for shooting enemy ships
              computerSquares.forEach(square => {
                square.addEventListener('click', async () =>{
                  //Check if it's player turn
                  const currentTurn = await App.getCurrentTurn();
                  const state = await App.getGameState();
                  if(currentTurn == App.account && state == GameStates.Play) {
                    App.fire(parseInt(square.dataset.id));
                  }
                })
              });
              App.fireEventWatcher(instance);
            }
          }
        });
    }, 

    //Player is ready to commit its board
    ready: async function(){
      //Check if all ships are placed
      if(!allShipsPlaced){
        infoDisplay.innerHTML = "Please place all ships"
        return;
      }
      const state = await App.getGameState();
      //Check if player has an opponent
      if(state == GameStates.Waiting){
        infoDisplay.innerHTML = "Please wait for the other player"
        return;
      }
      //Check if player already commited its board
      if(App.merkleTree != null){
        infoDisplay.innerHTML = "Board already commited";
        return;
      }

      if(state != GameStates.Connected && state != GameStates.Ready){
        infoDisplay.innerHTML = "Board commitment not possible in this phase";
        return;
      }

      //Send merkle root to smart contract
      App.contracts.Battleship.deployed().then(function(instance) {
        battleshipInstance = instance;
        //build merkle tree
        App.buildTree();
        const root = App.merkleTree.getRoot();
        return battleshipInstance.commitBoard(App.gameId, root,{ from: App.account });
      }).then(function() {

          setupButtons.style.display = 'none';

        }).catch(e => {
        console.error(e.message);
      });
    },

    //Build merkle tree
    buildTree: function(){
      let ship_positions = [];
      //Create a bool array of 100 positions. ship_positions[i] == true, if ship is placed in position i, otherwise ship_positions[i] == false
      userSquares.forEach(element => {
        if(element.classList.contains('taken'))
          ship_positions.push(true);
        else
          ship_positions.push(false);
      });
      App.merkleTree = new Tree(ship_positions);
    },

    getCurrentTurn: function(){
      return new Promise((resolve, reject) => {
        App.contracts.Battleship.deployed().then(function(instance) {
          battleshipInstance = instance;
          return battleshipInstance.currentTurn.call(App.gameId, { from: App.account });
        }).then((result) => {
          resolve(result); // Resolve the promise with the result
        }).catch(e => {
          console.error(e.message);
          reject(e); // Reject the promise with the error
        });
      });
    },

    getGameState: function() {
      return new Promise((resolve, reject) => {
        App.contracts.Battleship.deployed().then(function(instance) {
          battleshipInstance = instance;
          return battleshipInstance.gameState.call(App.gameId, { from: App.account });
        }).then((result) => {
          resolve(parseInt(result)); // Resolve the promise with the result
        }).catch(e => {
          console.error(e.message);
          reject(e); // Reject the promise with the error
        });
      });
    },

    //Send fire to enemy
    fire : function(square){
      App.contracts.Battleship.deployed().then(function(instance) {
        battleshipInstance = instance;
        return battleshipInstance.fire(App.gameId,square,{ from: App.account });
      }).then(function(result) {
          //wait for the result
          App.getShotResult(instance,square);
        }
        ).catch(e => {
        console.error(e.message);
      });
    },

    //Get the shot result from previous fire
    getShotResult : function(instance,square){
      instance.ShotResult().watch((error,result)=>{
        if(error)
          console.log(error);
        else{
          if(result.args.coordinate != square) return;
          if(parseInt(result.args.gameId) != App.gameId) return;
          if(result.args.attacker != App.account) return;
          console.log("EVENT ShotResult: %d %d",App.gameId,result.args.coordinate);
          
          const enemySquare = computerGrid.querySelector(`div[data-id='${square}']`)
          if (result.args.result == true) {
            enemySquare.classList.add('boom')
          } else {
            enemySquare.classList.add('miss')
          }

          turnDisplay.innerHTML = "Enemy's Go";
        }
      })
    },

    //Watch for fire sent from enemy and sent proof
    fireEventWatcher : function(instance){
      instance.Fire().watch((error,result)=>{
        if(error)
          console.log(error);
        else{
          //Check if event corresponds to my game
          if(parseInt(result.args.gameId) != App.gameId) return;
          //if I am the victim
          if(result.args.victim != App.account) return;

          const coordinate = result.args.coordinate;
          console.log("EVENT Fire: %d %d %s",App.gameId,coordinate, App.account);
          
          //Store the result of the enemy's shot
          const hit = userSquares[coordinate].classList.contains('taken');
          //Build merkle proof
          const proof = App.merkleTree.getProof(coordinate);
          return instance.ShotResult(gameId,coordinate,hit, proof["salt"], proof["proof"],{ from: App.account })
          .then(function(result) {
              //Check if the verification was successful
              if(result.logs[0].event === "ShotResult"){
                userSquares[coordinate].classList.add(hit ? 'boom' : 'miss');
              }
            }
            ).catch(e => {
            console.error(e.message);
          });
        }
      })
    }

  };

  $(function() {
    $(window).load(function() {
      App.init();
    });
  });

})
