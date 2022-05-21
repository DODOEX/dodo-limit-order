/*
    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0
*/

pragma solidity 0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "../../lib/SafeERC20.sol";
import {IDODOApproveProxy} from "../../intf/IDODOApproveProxy.sol";
import "forge-std/console.sol";

contract DODORouteMock {
    using SafeERC20 for IERC20;

    address public _DODO_APPROVE_PROXY_;
    uint256 public _price;

    function setDODOApproveProxy(address proxy) external {
        _DODO_APPROVE_PROXY_ = proxy;
    }

    function setPrice(uint256 price) external {
        _price = price;
    }

    function swap(address fromToken, address toToken, uint256 fromAmount) public {
        IDODOApproveProxy(_DODO_APPROVE_PROXY_).claimTokens(
            fromToken,
            msg.sender,
            address(this),
            fromAmount
        );
        uint256 toAmount = fromAmount * _price;
        IERC20(toToken).safeTransfer(msg.sender, toAmount);
    }
}