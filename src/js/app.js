App = {
  web3Provider: null,
  contracts: {},
  gameId: 0,

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

    return App.bindEvents();
  },
  
  bindEvents: function() {
    $(document).on('click', '#rand_game', App.joinRandomGame);
    $(document).on('click', '#priv_game', App.createPrivateGame);
    $(document).on('click', '#join_game', App.joinSpecificGame);
  },

  joinRandomGame: function() {
    // Call joinRandomgame()
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
      var account = accounts[0];
      App.contracts.Battleship.deployed().then(function(instance) {
        battleshipInstance = instance;
        return battleshipInstance.joinGame(gameId,{ from: account });
      }).then(function(result) {
        // The createPrivateGame function should not return anything,
        // so this block will be executed when the transaction is mined.
          document.getElementById("gameIdDisplay").textContent  = result.logs[0].args.gameId;
          App.gameId = parseInt(result.logs[0].args.gameId);
          App.playerConnected(1);
          App.playerConnected(2);
        }
        ).catch(e => {
        console.error(e);
      });
    });
  },
  
  createPrivateGame: function() {
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];
      App.contracts.Battleship.deployed().then(function(instance) {
        battleshipInstance = instance;
        return battleshipInstance.createPrivateGame({ from: account });
      }).then(function(result) {
        // The createPrivateGame function should not return anything,
        // so this block will be executed when the transaction is mined.
          document.getElementById("gameIdDisplay").textContent  = result.logs[0].args.gameId;
          App.gameId = parseInt(result.logs[0].args.gameId);
          App.playerConnected(1);
        }
        ).catch(e => {
        console.error(e);
      });
    });
  },  

  markAdopted: function() {
    var adoptionInstance;
    App.contracts.Battleship.deployed().then(function (instance) {
      adoptionInstance = instance;
      return adoptionInstance.getAdopters.call();
    }).then(function (adopters){
      for(i = 0; i < adopters.length; i++){
        if(adopters[i] !== '0x0000000000000000000000000000000000000000'){
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled',true);
        }
      }
    }).catch(function (err){
      console.log(err.message);
    });
  },


  playerConnected: function(num) {
    let player = `.p${parseInt(num)}`
    document.querySelector(`${player} .connected`).classList.toggle('active')
    document.querySelector(player).style.fontWeight = 'bold'
  },


  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));
    var adoptionInstance;
    web3.eth.getAccounts(function(error, accounts) {
      if(error){ console.log(error);}
      var account = accounts[0];
      App.contracts.Battleship.deployed().then(function (instance) {
        adoptionInstance = instance;
        return adoptionInstance.adopt(petId, {from: account});
      }).then(function(){
        return App.markAdopted();
      }).catch(function(err){
        console.log(err.message);
      });
    });
    
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});



document.addEventListener('DOMContentLoaded', () => {
  const userGrid = document.querySelector('.grid-user')
  const computerGrid = document.querySelector('.grid-computer')
  const displayGrid = document.querySelector('.grid-display')
  const ships = document.querySelectorAll('.ship')
  const destroyer = document.querySelector('.destroyer-container')
  const submarine = document.querySelector('.submarine-container')
  const cruiser = document.querySelector('.cruiser-container')
  const battleship = document.querySelector('.battleship-container')
  const carrier = document.querySelector('.carrier-container')
  const startButton = document.querySelector('#start')
  const rotateButton = document.querySelector('#rotate')
  const turnDisplay = document.querySelector('#whose-go')
  const infoDisplay = document.querySelector('#info')
  const setupButtons = document.getElementById('setup-buttons')
  const userSquares = []
  const computerSquares = []
  let isHorizontal = true
  let isGameOver = false
  let currentPlayer = 'user'
  const width = 10
  let playerNum = 0
  let ready = false
  let enemyReady = false
  let allShipsPlaced = false
  let shotFired = -1
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
  
  /*startMultiPlayer()

  // Multiplayer
  function startMultiPlayer() {
    const socket = io();

    // Get your player number
    socket.on('player-number', num => {
      if (num === -1) {
        infoDisplay.innerHTML = "Sorry, the server is full"
      } else {
        playerNum = parseInt(num)
        if(playerNum === 1) currentPlayer = "enemy"

        console.log(playerNum)

        // Get other player status
        socket.emit('check-players')
      }
    })

    // Another player has connected or disconnected
    socket.on('player-connection', num => {
      console.log(`Player number ${num} has connected or disconnected`)
      playerConnectedOrDisconnected(num)
    })

    // On enemy ready
    socket.on('enemy-ready', num => {
      enemyReady = true
      playerReady(num)
      if (ready) {
        playGameMulti(socket)
        setupButtons.style.display = 'none'
      }
    })

    // Check player status
    socket.on('check-players', players => {
      players.forEach((p, i) => {
        if(p.connected) playerConnectedOrDisconnected(i)
        if(p.ready) {
          playerReady(i)
          if(i !== playerReady) enemyReady = true
        }
      })
    })

    // On Timeout
    socket.on('timeout', () => {
      infoDisplay.innerHTML = 'You have reached the 10 minute limit'
    })

    // Ready button click
    startButton.addEventListener('click', () => {
      if(allShipsPlaced) playGameMulti(socket)
      else infoDisplay.innerHTML = "Please place all ships"
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

  //move around user ship
  ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
  userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
  userSquares.forEach(square => square.addEventListener('dragover', dragOver))
  userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
  userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
  userSquares.forEach(square => square.addEventListener('drop', dragDrop))
  userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

  let selectedShipNameWithIndex
  let draggedShip
  let draggedShipLength

  ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
    selectedShipNameWithIndex = e.target.id
    // console.log(selectedShipNameWithIndex)
  }))

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
    const shipNameWithLastId = draggedShip.lastChild.id;
    const shipClass = shipNameWithLastId.slice(0, -2);
    const lastShipIndex = parseInt(shipNameWithLastId.substr(-1));
    let shipLastId = lastShipIndex + parseInt(this.dataset.id);
  
    const notAllowedHorizontal = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 1, 11, 21, 31, 41, 51, 61, 71, 81, 91, 2, 22, 32, 42, 52, 62, 72, 82, 92, 3, 13, 23, 33, 43, 53, 63, 73, 83, 93];
    const notAllowedVertical = [99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60];
  
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex);
    let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex);
  
    selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));
    shipLastId = shipLastId - selectedShipIndex;
  
    const shipIsHorizontal = isHorizontal && !newNotAllowedHorizontal.includes(shipLastId);
    const shipIsVertical = !isHorizontal && !newNotAllowedVertical.includes(shipLastId);
  
    let isValidPlacement = true;
  
    for (let i = 0; i < draggedShipLength; i++) {
      let directionClass;
      if (i === 0) directionClass = 'start';
      if (i === draggedShipLength - 1) directionClass = 'end';
  
      const nextSquareIndexHorizontal = parseInt(this.dataset.id) - selectedShipIndex + i;
      const nextSquareIndexVertical = parseInt(this.dataset.id) - selectedShipIndex + width * i;
  
      if (isHorizontal) {
        if (
          userSquares[nextSquareIndexHorizontal].classList.contains('taken') ||
          newNotAllowedVertical.includes(nextSquareIndexHorizontal)
        ) {
          isValidPlacement = false;
          break; // Abort placing the ship if any square is already taken or invalid (horizontal check)
        }
      } else {
        if (
          userSquares[nextSquareIndexVertical].classList.contains('taken') ||
          newNotAllowedHorizontal.includes(nextSquareIndexVertical)
        ) {
          isValidPlacement = false;
          break; // Abort placing the ship if any square is already taken or invalid (vertical check)
        }
      }
    }
  
    if (isValidPlacement) {
      for (let i = 0; i < draggedShipLength; i++) {
        let directionClass;
        if (i === 0) directionClass = 'start';
        if (i === draggedShipLength - 1) directionClass = 'end';
  
        const nextSquareIndexHorizontal = parseInt(this.dataset.id) - selectedShipIndex + i;
        const nextSquareIndexVertical = parseInt(this.dataset.id) - selectedShipIndex + width * i;
  
        if (isHorizontal) {
          userSquares[nextSquareIndexHorizontal].classList.add('taken', 'horizontal', directionClass, shipClass);
        } else {
          userSquares[nextSquareIndexVertical].classList.add('taken', 'vertical', directionClass, shipClass);
        }
      }
    } else {
      return; // Abort placing the ship if it overlaps with other ships
    }
  
    displayGrid.removeChild(draggedShip);
    if (!displayGrid.querySelector('.ship')) allShipsPlaced = true;
  }
  
  function dragEnd() {
    // console.log('dragend')
  }

  // Game Logic for MultiPlayer
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
  }

  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`
    document.querySelector(`${player} .ready`).classList.toggle('active')
  }

  let destroyerCount = 0
  let submarineCount = 0
  let cruiserCount = 0
  let battleshipCount = 0
  let carrierCount = 0

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
  }

  let cpuDestroyerCount = 0
  let cpuSubmarineCount = 0
  let cpuCruiserCount = 0
  let cpuBattleshipCount = 0
  let cpuCarrierCount = 0


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
  }

  function gameOver() {
    isGameOver = true
  }

})
