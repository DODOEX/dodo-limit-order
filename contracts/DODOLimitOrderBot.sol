/*
    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0
*/

pragma solidity 0.8.4;

import {InitializableOwnable} from "./lib/InitializableOwnable.sol";
import {IERC20} from "./intf/IERC20.sol";
import {SafeMath} from "./lib/SafeMath.sol";
import {SafeERC20} from "./lib/SafeERC20.sol";

/**
 * @title DODOLimitOrder
 * @author DODO Breeder
 */

 contract DODOLimitOrderBot is InitializableOwnable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    //=============== Storage ===============
    address public _DODO_LIMIT_ORDER_;
    address public _TOKEN_RECEIVER_;
    address public _DODO_APPROVE_;
    mapping (address => bool) public isAdminListed;
    
    //=============== Event ===============
    event addAdmin(address admin);
    event removeAdmin(address admin);
    event Fill();

    function init(
        address owner, 
        address dodoLimitOrder,
        address tokenReceiver,
        address dodoApprove
    ) external {
        initOwner(owner);
        _DODO_LIMIT_ORDER_ = dodoLimitOrder;
        _TOKEN_RECEIVER_ = tokenReceiver;
        _DODO_APPROVE_ = dodoApprove;
    }
     
     function fillDODOLimitOrder(
        bytes memory callExternalData, //调用DODOLimitOrder合约的data
        address takerToken, 
        uint256 minTakerTokenAmount
     ) external {
        require(isAdminListed[msg.sender], "ACCESS_DENIED");
        uint256 originTakerBalance = IERC20(takerToken).balanceOf(address(this));

        (bool success, ) = _DODO_LIMIT_ORDER_.call(callExternalData);
        require(success, "EXEC_DODO_LIMIT_ORDER_ERROR");

        uint256 takerBalance = IERC20(takerToken).balanceOf(address(this));
        uint256 leftTakerAmount = takerBalance.sub(originTakerBalance);

        require(leftTakerAmount >= minTakerTokenAmount, "TAKER_AMOUNT_NOT_ENOUGH");
        
        IERC20(takerToken).transfer(_TOKEN_RECEIVER_, leftTakerAmount);
        
        //TODO:
        emit Fill();
     }


    function doLimitOrderSwap(
        address makerToken, //fromToken
        address takerToken, //toToken
        bytes memory orderHash,
        uint256 orderTakerAmount,
        uint256 orderMakerAmount,
        uint256 takerFillAmount,
        address dodoRouteProxy,
        bytes memory dodoApiData
    ) external {
        require(msg.sender == _DODO_LIMIT_ORDER_, "ACCESS_NENIED");
        uint256 originTakerBalance = IERC20(takerToken).balanceOf(address(this));
        //TODO: 跨合约调用
        uint256 filledTakerAmount = 0;
        
        uint256 leftTakerAmount = orderTakerAmount.sub(filledTakerAmount);
        uint256 curTakerFillAmount = takerFillAmount < leftTakerAmount ? takerFillAmount:leftTakerAmount;
        uint256 curMakerFillAmount = curTakerFillAmount.mul(orderMakerAmount).div(orderTakerAmount);        

        _approveMax(IERC20(makerToken), _DODO_APPROVE_, curMakerFillAmount);
        
        (bool success, ) = dodoRouteProxy.call(dodoApiData);
        require(success, "API_SWAP_FAILED");

        uint256 takerBalance = IERC20(takerToken).balanceOf(address(this));
        uint256 returnTakerAmount = takerBalance.sub(originTakerBalance);

        require(returnTakerAmount >= curTakerFillAmount, "SWAP_TAKER_AMOUNT_NOT_ENOUGH");
        
        _approveMax(IERC20(takerToken), _DODO_LIMIT_ORDER_, curTakerFillAmount);
    }



    function addAdminList (address userAddr) external onlyOwner {
        isAdminListed[userAddr] = true;
        emit addAdmin(userAddr);
    }

    function removeAdminList (address userAddr) external onlyOwner {
        isAdminListed[userAddr] = false;
        emit removeAdmin(userAddr);
    }

    function _approveMax(IERC20 token,address to,uint256 amount) internal {
        uint256 allowance = token.allowance(address(this), to);
        if (allowance < amount) {
            if (allowance > 0) {
                token.safeApprove(to, 0);
            }
            token.safeApprove(to, type(uint256).max);
        }
    }
 }