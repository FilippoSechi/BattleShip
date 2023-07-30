// npm install merkletreejs

const { MerkleTree } = require('merkletreejs');
const crypto = require('crypto');
const keccak256 = require('keccak256');

class Tree {
  constructor(transactions) {
    this.transactions = transactions;
    this.salts = transactions.map(() => crypto.randomBytes(2));

    const leaves = transactions.map((transaction, index) => keccak256(transaction + this.salts[index]));
    this.tree = new MerkleTree(leaves, keccak256);
  }

  getRoot() {
    return this.tree.getRoot();
  }

  getProof(index) {
    if (index < 0 || index >= this.salts.length) {
      throw new Error("Invalid index");
    }

    const salt = this.salts[index];
    const leaf = keccak256(this.transactions[index] + salt);
    return {
      "proof": this.tree.getProof(leaf),
      "salt": salt,
    };
  }
}

const T = new Tree(['0', '1', '1', '0']);
let index = 1;
let proof = T.getProof(index); // return a dict with keys "proof" and "salt"
let root = T.getRoot();
let result = T.transactions[index];
let leaf = keccak256(result + proof["salt"]);

console.log(T.tree.verify(proof["proof"], leaf, root)); // true
//verify.call(root, result, proof["salt"], proof)