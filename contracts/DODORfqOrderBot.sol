/*
    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0
*/

pragma solidity 0.8.4;

import {InitializableOwnable} from "./lib/InitializableOwnable.sol";
import {IDODOApproveProxy} from "./intf/IDODOApproveProxy.sol";
import {IERC20} from "./intf/IERC20.sol";
import {SafeMath} from "./lib/SafeMath.sol";
import {SafeERC20} from "./lib/SafeERC20.sol";
import {EIP712} from "./external/draft-EIP712.sol";
import {ECDSA} from "./external/ECDSA.sol";

/**
 * @title DODORfqOrderBot
 * @author DODO Breeder
 */

 contract DODORfqOrderBot is EIP712("DODO Limit Order Protocol", "1"), InitializableOwnable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    //=============== Storage ===============
    address public _TOKEN_RECEIVER_;
    address public _DODO_APPROVE_;
    address public _DODO_APPROVE_PROXY_;
    mapping (address => bool) public isAdminListed;

    bytes32 constant public RFQ_ORDER_TYPEHASH = keccak256(
        "Order(address makerToken,address takerToken,uint256 makerAmount,uint256 takerAmount,uint256 makerTokenFeeAmount,uint256 takerFillAmount,address maker,address taker,uint256 expiration,uint256 slot)"
    );

    struct RfqOrder {
        address makerToken;
        address takerToken;
        uint256 makerAmount;
        uint256 takerAmount;
        uint256 makerTokenFeeAmount;
        uint256 takerFillAmount;
        address maker;
        address taker;
        uint256 expiration;
        uint256 slot;
    }
    
    //=============== Event ===============
    event addAdmin(address admin);
    event removeAdmin(address admin);
    event changeReceiver(address newReceiver);
    event RFQByPlatformFilled();

    function init(
        address owner, 
        address tokenReceiver,
        address dodoApprove,
        address dodoApproveProxy
    ) external {
        initOwner(owner);
        _TOKEN_RECEIVER_ = tokenReceiver;
        _DODO_APPROVE_ = dodoApprove;
        _DODO_APPROVE_PROXY_ = dodoApproveProxy;
    }


    function matchingRFQByPlatform(
        RfqOrder memory order,
        bytes memory makerSignature,
        bytes memory takerSignature,
        uint256 thresholdAddMakerTokenAmount,
        uint256 makerTokenFeeAmount,
        address taker,
        address dodoRouteProxy,
        bytes memory dodoApiData
    ) public {
        require(isAdminListed[msg.sender], "ACCESS_DENIED");
        require(order.expiration > block.timestamp, "DLOP: EXPIRE_ORDER");

        bytes32 orderHashForMaker = _rfqOrderHash(order);
        require(ECDSA.recover(orderHashForMaker, makerSignature) == order.maker, "DLOP:INVALID_MAKER_SIGNATURE");
        require(order.taker == address(0), "DLOP:TAKER_INVALID");

        order.taker = taker;
        order.makerTokenFeeAmount = makerTokenFeeAmount;
        order.takerFillAmount = order.takerAmount;

        bytes32 orderHashForTaker = _rfqOrderHash(order);
        require(ECDSA.recover(orderHashForTaker, takerSignature) == order.taker, "DLOP:INVALID_TAKER_SIGNATURE");

        _settleRFQ(order, thresholdAddMakerTokenAmount, dodoRouteProxy, dodoApiData);

        emit RFQByPlatformFilled();
    }

    function _settleRFQ(
        RfqOrder memory order, 
        uint256 thresholdAddMakerTokenAmount,
        address dodoRouteProxy,
        bytes memory dodoApiData
    ) internal {
        address taker = order.taker;
        address maker = order.maker;
        uint256 takerFillAmount = order.takerAmount;
        uint256 makerTokenFeeAmount = order.makerTokenFeeAmount;
        address orderMakerToken = order.makerToken;
        address orderTakerToken = order.takerToken;
        uint256 orderMakerAmount = order.makerAmount;
        
        IDODOApproveProxy(_DODO_APPROVE_PROXY_).claimTokens(orderTakerToken, taker, address(this), takerFillAmount);

        uint256 originMakerBalance = IERC20(orderMakerToken).balanceOf(address(this));
        _approveMax(IERC20(orderTakerToken), _DODO_APPROVE_, takerFillAmount);
        (bool success, ) = dodoRouteProxy.call(dodoApiData);
        require(success, "API_SWAP_FAILED");
        uint256 makerBalance = IERC20(orderMakerToken).balanceOf(address(this));
        uint256 returnMakerAmount = makerBalance.sub(originMakerBalance);

        if(returnMakerAmount >= orderMakerAmount) {
            uint leftMakerTokenAmount = returnMakerAmount.sub(orderMakerAmount.sub(makerTokenFeeAmount));
            IERC20(orderMakerToken).safeTransfer(_TOKEN_RECEIVER_, leftMakerTokenAmount);
        } else {
            uint addMakerTokenAmount = orderMakerAmount.sub(returnMakerAmount);
            require(addMakerTokenAmount < thresholdAddMakerTokenAmount, "DLOP: NEED_MORE_MAKERTOKEN");
            IDODOApproveProxy(_DODO_APPROVE_PROXY_).claimTokens(orderMakerToken, maker, address(this), addMakerTokenAmount);
            if(makerTokenFeeAmount > 0) {
                IERC20(orderMakerToken).safeTransfer(_TOKEN_RECEIVER_, makerTokenFeeAmount);
            }
        }

        IERC20(orderMakerToken).safeTransfer(taker, orderMakerAmount.sub(makerTokenFeeAmount));
    }


    //============  Ownable ============
    function addAdminList (address userAddr) external onlyOwner {
        isAdminListed[userAddr] = true;
        emit addAdmin(userAddr);
    }

    function removeAdminList (address userAddr) external onlyOwner {
        isAdminListed[userAddr] = false;
        emit removeAdmin(userAddr);
    }

    function changeTokenReceiver(address newTokenReceiver) external onlyOwner {
        _TOKEN_RECEIVER_ = newTokenReceiver;
        emit changeReceiver(newTokenReceiver);
    }


    //============  internal ============
    function _approveMax(IERC20 token,address to,uint256 amount) internal {
        uint256 allowance = token.allowance(address(this), to);
        if (allowance < amount) {
            if (allowance > 0) {
                token.safeApprove(to, 0);
            }
            token.safeApprove(to, type(uint256).max);
        }
    }

    function _rfqOrderHash(RfqOrder memory order) private view returns(bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    RFQ_ORDER_TYPEHASH,
                    order.makerToken,
                    order.takerToken,
                    order.makerAmount,
                    order.takerAmount,
                    order.makerTokenFeeAmount,
                    order.takerFillAmount,
                    order.maker,
                    order.taker,
                    order.expiration,
                    order.slot
                )
            )
        );
    }
 }