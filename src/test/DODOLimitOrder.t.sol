// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../DODOLimitOrder.sol";
import "./mocks/DODOApproveMock.sol";
import "./mocks/DODOApproveProxyMock.sol";
import "./mocks/DODORouteMock.sol";
import "./mocks/ERC1271WalletMock.sol";

contract DODOLimitOrderTest is DODOLimitOrder, Test {
    ERC1271WalletMock public wallet;

    bytes32 public hash1 = keccak256("message 1");
    bytes32 public hash2 = keccak256("message 2");
    bytes public signature = bytes("signature");

    function setUp() public {
        wallet = new ERC1271WalletMock();
        wallet.addSignature(hash1, signature);
    }

    function testVerifySignature() public view {
        _verifyERC1271WalletSignature(address(wallet), hash1, signature);
    }

    function testFillOrderWithWrongSignature() public {
        Order memory order = Order({
            makerToken: address(1),
            takerToken: address(2),
            makerAmount: 2e18,
            takerAmount: 1e18,
            maker: address(wallet),
            taker: msg.sender,
            expiration: 1792883473,
            salt: 1234
        });
        bytes memory takerInteraction = bytes("");
        vm.expectRevert(bytes("INVALID_SIGNATURE"));
        fillLimitOrder(order, signature, 1e17, 1e6, takerInteraction);
    }
}