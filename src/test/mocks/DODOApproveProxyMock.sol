/*

    Copyright 2020 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.8.4;
pragma experimental ABIEncoderV2;

import {IDODOApprove} from "../../intf/IDODOApprove.sol";

contract DODOApproveProxyMock {

    mapping (address => bool) public _IS_ALLOWED_PROXY_; 
    address public immutable _DODO_APPROVE_;

    constructor(address dodoApporve) {
        _DODO_APPROVE_ = dodoApporve;
    }

    function addDODOProxy(address proxy) external {
        _IS_ALLOWED_PROXY_[proxy] = true;
    }

    function removeDODOProxy (address oldDodoProxy) public {
        _IS_ALLOWED_PROXY_[oldDodoProxy] = false;
    }
    
    function claimTokens(
        address token,
        address who,
        address dest,
        uint256 amount
    ) external {
        require(_IS_ALLOWED_PROXY_[msg.sender], "DODOApproveProxy:Access restricted");
        IDODOApprove(_DODO_APPROVE_).claimTokens(
            token,
            who,
            dest,
            amount
        );
    }

    function isAllowedProxy(address _proxy) external view returns (bool) {
        return _IS_ALLOWED_PROXY_[_proxy];
    }
}