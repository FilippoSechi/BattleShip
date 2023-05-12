// npm install merkletreejs
const { MerkleTree } = require('merkletreejs')
const crypto = require('crypto');
const SHA256 = require('crypto-js/sha256')

class Tree{

    constructor(transactions){
        this.saltMap = new Map();

        transactions.forEach(x => {
            this.saltMap.set(x,crypto.randomBytes(16).toString('hex'))
        });

        const leaves = transactions.map(x => SHA256(x+this.saltMap.get(x)));
        this.tree = new MerkleTree(leaves, SHA256);
    }

    getRoot(){
        return this.tree.getRoot().toString('hex');
    }

    getProof(transaction){
        const salt = this.saltMap.get(transaction);
        const leaf = SHA256(transaction+salt);
        return {"proof":this.tree.getProof(leaf),
                "salt":salt
                };
    }
}

const T = new Tree(['a','b','c','d']);
let proof = T.getProof('a'); //return a dict with keys "proof" and "salt"
let root = T.getRoot();
let leaf = SHA256('a'+proof["salt"]);
console.log(MerkleTree.verify(proof["proof"], leaf, root)) // true