// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract MerkleProof {
  function verify(bytes32 root, bytes1 result, uint16 salt, bytes32[] memory proof) public pure returns (bool){
    
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