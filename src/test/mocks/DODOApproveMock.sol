/*
    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0
*/

pragma solidity 0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "../../lib/SafeERC20.sol";

contract DODOApproveMock {
    using SafeERC20 for IERC20;

    address public _DODO_PROXY_;

    function setDODOProxy(address proxy) external {
        _DODO_PROXY_ = proxy;
    }

    function claimTokens(
        address token,
        address who,
        address dest,
        uint256 amount
    ) external {
        require(msg.sender == _DODO_PROXY_, "DODOApprove:Access restricted");
        if (amount > 0) {
            IERC20(token).safeTransferFrom(who, dest, amount);
        }
    }

    function getDODOProxy() public view returns (address) {
        return _DODO_PROXY_;
    }
}