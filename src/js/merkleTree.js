// npm install merkletreejs
//npx webpack --config src/js/webpack.config.js

const { MerkleTree } = require("merkletreejs");
const keccak256 = require('keccak256');
const Buffer = require('buffer').Buffer;

class Tree {
  constructor(transactions) {
    this.transactions = transactions;
    this.salts = transactions.map(() => crypto.getRandomValues(Buffer.alloc(2)));

    const leaves = transactions.map((transaction, index) => keccak256(transaction + this.salts[index]));
    this.tree = new MerkleTree(leaves, keccak256);
  }

  getRoot() {
    return this.tree.getHexRoot();
  }

  getProof(index) {
    if (index < 0 || index >= this.salts.length) {
      throw new Error("Invalid index");
    }

    const salt = this.salts[index];
    const leaf = keccak256(this.transactions[index] + salt);
    return {
      "proof": this.tree.getHexProof(leaf),
      "salt": salt,
    };
  }
}

module.exports = Tree;

/*
const T = new Tree([true, false, true, false]);
let index = 1;
let proof = T.getProof(index); // return a dict with keys "proof" and "salt"
let root = T.getRoot();
let result = T.transactions[index];
let leaf = keccak256(result + proof["salt"]);

console.log(T.tree.verify(proof["proof"], leaf, root)); // true
//verify.call(root, result, proof["salt"], proof)
*/