const Battleship = artifacts.require("../contracts/Battleship.sol");

module.exports = function (instance) {
    instance.deploy(Battleship);
};