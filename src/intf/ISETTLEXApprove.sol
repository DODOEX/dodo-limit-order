/*

    Copyright 2025 SETTLEX
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.8.4;

interface ISETTLEXApprove {
    function claimTokens(address token,address who,address dest,uint256 amount) external;
    function getSETTLEXProxy() external view returns (address);
}
