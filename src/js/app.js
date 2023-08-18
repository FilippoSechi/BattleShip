const Tree = require("./merkleTree");
const GameStates= {
  Waiting: 0, //Initial state
  Connected: 1, //Two players connected
  Payed: 2, //The second player payed the fee
  Ready : 3,  //One player commited their board
  Play: 4,  //Both players commited their boards
  Over: 5,   //Game ended
  Rewarded : 6  //The winner got their prize
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
  let sendingProof = false
  let fireSent = false

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

  //Highlights player status bar (READY)
  function playerReady(num) {
    let player = `.p${parseInt(num)}`
    const element = document.querySelector(`${player} .ready`);
    if (!element.classList.contains('active')) 
      element.classList.add('active');
  }

  //Highlights player status bar (CONNECTED)
  function playerConnected (num){
    let player = `.p${parseInt(num)}`
    const element = document.querySelector(`${player} .connected`);
    if (!element.classList.contains('active'))
      element.classList.add('active');
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
    price: 0,
    timer: null,
  
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
      let input = document.getElementById("gamePrice").value;
    
      // Check if the input contains only numeric characters
      if (!/^\d+$/.test(input)) {
        alert("Invalid price. Please enter only numeric characters.");
        return;
      }
  
      App.price = parseInt(input, 10);
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
        App.account = accounts[0];
        App.contracts.Battleship.deployed().then(function(instance) {
          battleshipInstance = instance;
          return battleshipInstance.joinRandomGame(App.price,{ from: App.account });
        }).then(function(result) {
            console.log("JoinRandomGame -> gas used ",result.receipt.gasUsed);
            //Player created a new game
            if(result.logs[0].event === "GameCreated"){
              //Save gameId
              App.gameId = parseInt(result.logs[0].args.gameId);
              playerConnected(1);
              console.log("EVENT GameCreated: %d",App.gameId);
              //Wait for the second player to join
              App.playerJoinedWatcher(battleshipInstance);
              App.disableButtons();
            }

            //Player joined a pre-existent game
            else if(result.logs[0].event === "PlayerJoined"){
              //Save gameId
              App.gameId = parseInt(result.logs[0].args.gameId);
              console.log("EVENT PlayerJoined: %d",App.gameId);
              playerConnected(1);
              playerConnected(2);
              playerNum = 2;
              
              document.getElementById("pay").style.display='inline';
              $(document).on('click', '#pay', App.pay);
              App.PayedEventWatcher(battleshipInstance);
              //Watch for opponent board commitment
              App.playerReadyWatcher(battleshipInstance);
              App.disableButtons();
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
          
          console.log("JoinSpecificGame -> gas used ",result.receipt.gasUsed);
            App.price = parseInt(result.logs[0].args.price);
            document.getElementById("gamePrice").value = App.price;
            document.getElementById("gameIdDisplay").textContent =gameId;
            App.gameId = gameId;
            console.log("EVENT player2 joined: %d",App.gameId);
            playerConnected(1);
            playerConnected(2);
            playerNum = 2;

            document.getElementById("pay").style.display='inline';
            $(document).on('click', '#pay', App.pay);
            App.PayedEventWatcher(battleshipInstance);
            //Watch for opponent board commitment
            App.playerReadyWatcher(battleshipInstance);
            App.disableButtons();
          }
          ).catch(e => {
          console.error(e.message);
        });
      });
    },
    
    createPrivateGame: function() {
      let input = document.getElementById("gamePrice").value;
    
      // Check if the input contains only numeric characters
      if (!/^\d+$/.test(input)) {
        alert("Invalid price. Please enter only numeric characters.");
        return;
      }
  
      App.price = parseInt(input, 10);
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
        App.account = accounts[0];
        App.contracts.Battleship.deployed().then(function(instance) {
          battleshipInstance = instance;
          return battleshipInstance.createPrivateGame(App.price,{ from: App.account });
        }).then(function(result) {
          console.log("CreatePrivateGame -> gas used ",result.receipt.gasUsed);
          // The createPrivateGame function should not return anything,
          // so this block will be executed when the transaction is mined.
            App.gameId = parseInt(result.logs[0].args.gameId);
            document.getElementById("gameIdDisplay").textContent = App.gameId;
            playerConnected(1);
            console.log("EVENT GameCreated: %d",App.gameId);
  
            //Wait for another player to join the game
            App.playerJoinedWatcher(battleshipInstance);
            App.disableButtons();
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
              document.getElementById("pay").style.display='inline';
              $(document).on('click', '#pay', App.pay);
              App.PayedEventWatcher(instance);
              // Watch for the opponent's board commitment
              App.playerReadyWatcher(instance);
            }
          }catch(e){
            console.error(e)}
        }
      });
    },

    //Watch for the event Payed
    PayedEventWatcher: function (instance){
      instance.Payed().watch(async (error,result)=>{
          if(error)
            console.log(error);
          else if(App.gameId == parseInt(result.args.gameId) && App.account != result.args.player){
            console.log("EVENT: PAYED %s", result.args.player);
          }
      }
      );
    }, 

    pay: function (){
        App.contracts.Battleship.deployed().then(function(instance){
          const battleshipInstance = instance;
          return battleshipInstance.pay(App.gameId, {from: App.account, value: App.price}).then(function(result){
            console.log("Pay -> gas used ",result.receipt.gasUsed);
            console.log("EVENT: PAYED %s",result.logs[0].args.player);
            document.getElementById("pay").style.display = 'none';
          })
        }).catch((e)=> console.error(e));
    },
    
    disableButtons: function(){
      document.getElementById("priv_game").disabled = true;
      document.getElementById("rand_game").disabled = true;
      document.getElementById("join_game").disabled = true;
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

              App.fireEventWatcher(instance);

              document.getElementById("accuse").style.display='inline';
            document.getElementById("accuse").disabled = false;
            document.getElementById("accuse").addEventListener('click',App.accuse);

              //Set event listeners for shooting enemy ships
              computerSquares.forEach(square => {
                square.addEventListener('click', async () =>{
                  //Check if it's player turn
                  const currentTurn = await App.getCurrentTurn();
                  const state = await App.getGameState();
                  if(currentTurn == App.account && state == GameStates.Play) {
                    App.fire(instance,parseInt(square.dataset.id));
                  }
                })
              });
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

      if(state != GameStates.Payed && state != GameStates.Ready){
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
      }).then(function(result) {
        console.log("BoardCommitment -> gas used ",result.receipt.gasUsed);
          setupButtons.style.display = 'none';

          App.CheatingDetectedWatcher(battleshipInstance);
          App.WinnerWatcher(battleshipInstance);
          App.WaitingForBoardValidationWatcher(battleshipInstance);

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

    accuse : function(){
      App.timer = setInterval(() => {
        App.contracts.Battleship.deployed().then(function(instance) {
          battleshipInstance = instance;
          return battleshipInstance.accusePlayer(App.gameId, { from: App.account });
          }).then(function(result) {
          console.log("accusePlayer -> gas used ",result.receipt.gasUsed);
          document.getElementById("accuse").disabled = true;  
          }).catch(e => {
          console.error(e.message);
        });
      }, 60000);
    },

    //Send fire to enemy
    fire: function(instance, square) {
      if(fireSent) return;
        fireSent = true;
      instance.fire(App.gameId, square, { from: App.account }).then(async (result) =>{
          try{
            console.log("Fire -> gas used ",result.receipt.gasUsed);
            //Wait for the result of the shot to be emitted from the opponent
            await App.getShotResult(instance, square);
            fireSent = false;
          } catch (e) {
              console.error(e.message);
          }
        }).catch((e)=> console.error(e))
    },
  
    getShotResult: async function(instance, square, fireResult) {
        return new Promise((resolve, reject) => {
          instance.ShotResult().watch(async (error, result) => {
              if (error) {
                  console.log(error);
                  reject(error);
              } else {
                if ( parseInt(result.args.coordinate) != square || parseInt(result.args.gameId) != App.gameId || result.args.attacker != App.account) 
                    return;
                console.log("EVENT ShotResult: %d %d", App.gameId, parseInt(result.args.coordinate));

                const enemySquare = computerGrid.querySelector(`div[data-id='${square}']`);
                if (result.args.result == true) {
                    enemySquare.classList.add('boom');
                  } else {
                      enemySquare.classList.add('miss');
                  }

                  turnDisplay.innerHTML = "Enemy's Go";
                  resolve();
              }
            });
        });
    },  

  fireEventWatcher: function(instance) {
    instance.Fire().watch(async (error, result) => {
        if (error) {
          console.log(error);
        } else {
            try {
              if(sendingProof) return;

              // Check if event corresponds to my game
              if (parseInt(result.args.gameId) != App.gameId) return;
              // if I am the victim
              if (result.args.victim != App.account) return;
              sendingProof = true;
              document.getElementById("accuse").disabled = false;
              clearInterval(App.timer);
              const coordinate = parseInt(result.args.coordinate);

              console.log("EVENT Fire: %d %d %s", App.gameId, coordinate, App.account);

              // Store the result of the enemy's shot
              const hit = userSquares[coordinate].classList.contains('taken');
              // Build merkle proof
              const proof = App.merkleTree.getProof(coordinate);
              //Send proof to smart contract
              const emittedEvent = await App.sendShotResult(coordinate,hit,proof["salt"],proof["proof"]); 
              sendingProof = false;
              // Check if the verification was successful
              if (emittedEvent === "ShotResult") {
                  userSquares[coordinate].classList.add(hit ? 'boom' : 'miss');
                  turnDisplay.innerHTML = "Your go";
              }
              else if (emittedEvent === "CheatingDetected"){
                turnDisplay.innerHTML = "DID YOU TRIED TO CHEAT?! YOU LOSE!";
              }
              } catch (e) {
                  console.error(e.message);
            }
        }
    });
  },

  sendShotResult : function(coordinate, hit, salt,proof){
    return new Promise((resolve, reject) => {
      App.contracts.Battleship.deployed().then(function(instance) {
        battleshipInstance = instance;
        return battleshipInstance.shotResult(App.gameId, coordinate, hit, salt, proof, { from: App.account });
      }).then((result) => {
        console.log("SendShotResult -> gas used ",result.receipt.gasUsed);
        resolve(result.logs[0].event); // Resolve the promise with the result
      }).catch(e => {
        console.error(e.message);
        reject(e); // Reject the promise with the error
      });
    });
  },

  //Watch for the event WaitingForBoardValidation
  WaitingForBoardValidationWatcher: function (instance){
    instance.WaitingForBoardValidation().watch(async (error,result)=>{
        if(error)
          console.log(error);
        else if(App.gameId == parseInt(result.args.gameId) && App.account == result.args.player){
          console.log("EVENT: WAITING FOR BOARD VALIDATION %s", result.args.player);
          let ship_positions = [];
          userSquares.forEach(element => {
            if(element.classList.contains('taken'))
              ship_positions.push(true);
            else
            ship_positions.push(false);
          });
          await App.sendBoardVerification(ship_positions);
        }
    }
    );
  },

  sendBoardVerification : function(position){
    return new Promise((resolve, reject) => {
      App.contracts.Battleship.deployed().then(function(instance) {
        battleshipInstance = instance;
        return battleshipInstance.checkBoardValidity(App.gameId, position, { from: App.account });
      }).then((result) => {
        console.log("CheckBoardValidity -> gas used ",result.receipt.gasUsed);
        resolve(); // Resolve the promise with the result
      }).catch(e => {
        console.error(e.message);
        reject(e); // Reject the promise with the error
      });
    });
  },

  //Watch for the event CheatingDetected
  CheatingDetectedWatcher: function (instance){
    instance.CheatingDetected().watch( (error,result)=>{
        if(error)
          console.log(error);
        else if(App.gameId == parseInt(result.args.gameId) && App.account == result.args.cheater){
          console.log("EVENT: CHEATING DETECTED %s", result.args.player);
          turnDisplay.innerHTML = "DID YOU TRIED TO CHEAT?! YOU LOSE!";
        }
    }
    );
  },

  //Watch for the event Winner
  WinnerWatcher: function (instance){
    instance.Winner().watch((error,result)=>{
        if(error)
          console.log(error);
        else if(App.gameId == parseInt(result.args.gameId) && App.account == result.args.winner){
          console.log("EVENT: WINNER %s", result.args.winner);
          turnDisplay.innerHTML = "YOU WIN!";
        }
        else if(App.gameId == parseInt(result.args.gameId) && App.account != result.args.winner){
          console.log("EVENT: WINNER %s", result.args.winner);
          turnDisplay.innerHTML = "YOU LOSE!";
        }
    }
    );
  }

  };
  
  $(function() {
    $(window).load(function() {
      App.init();
    });
  });

})

//TODO: IMPLEMENT WATCHER FOR WINNING, CHEATING AND BOARD VALIDATION