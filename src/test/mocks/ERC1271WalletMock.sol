// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract ERC1271WalletMock {
    mapping(bytes32 => bytes) public signatures;

    function addSignature(bytes32 _hash, bytes calldata _signature) external {
        signatures[_hash] = _signature;
    }
    
    function isValidSignature(
        bytes32 _hash,
        bytes calldata _signature
    ) external view returns (bytes4) {
        bytes memory s1 = signatures[_hash];
        bytes memory s2 = _signature;
        if ( keccak256(s1) == keccak256(s2)) {
            return 0x1626ba7e;
        } else {
            return 0xffffffff;
        }
    }
}