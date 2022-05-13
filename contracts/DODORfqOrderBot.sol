/*
    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0
*/

pragma solidity 0.8.4;

import {InitializableOwnable} from "./lib/InitializableOwnable.sol";
import {IDODOApproveProxy} from "./intf/IDODOApproveProxy.sol";
import {IERC20} from "./intf/IERC20.sol";
import {SafeERC20} from "./lib/SafeERC20.sol";
import {EIP712} from "./external/draft-EIP712.sol";
import {ECDSA} from "./external/ECDSA.sol";

/**
 * @title DODORfqOrderBot
 * @author DODO Breeder
 */

contract DODORfqOrderBot is EIP712("DODO Limit Order Protocol", "1"), InitializableOwnable {
    using SafeERC20 for IERC20;

    bytes32 public constant RFQ_ORDER_TYPEHASH =
        keccak256(
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

    //=============== Storage ===============

    address public _INSURANCE_;
    address public immutable _DODO_APPROVE_;
    address public immutable _DODO_APPROVE_PROXY_;
    mapping(address => bool) public isAdmin;

    //=============== Events ===============

    event AddAdmin(address admin);

    event RemoveAdmin(address admin);

    event ChangeInsurance(address newReceiver);

    event RFQByPlatformFilled();

    //=============== Functions ===============

    function init(
        address owner,
        address insurance,
        address dodoApprove,
        address dodoApproveProxy
    ) external {
        initOwner(owner);
        _INSURANCE_ = insurance;
        _DODO_APPROVE_ = dodoApprove;
        _DODO_APPROVE_PROXY_ = dodoApproveProxy;
    }

    function matchingRFQByPlatform(
        RfqOrder memory order,
        bytes calldata makerSignature,
        bytes calldata takerSignature,
        uint256 maxTakerCompensation,
        uint256 makerTokenFeeAmount,
        address taker,
        address dodoRouteProxy,
        bytes calldata dodoApiData
    ) external {
        require(isAdmin[msg.sender], "ACCESS_DENIED");
        require(order.expiration > block.timestamp, "DLOP:EXPIRE_ORDER");

        // maker sign order first
        bytes32 orderHashForMaker = _rfqOrderHash(order);
        require(
            ECDSA.recover(orderHashForMaker, makerSignature) == order.maker,
            "DLOP:INVALID_MAKER_SIGNATURE"
        );
        require(order.taker == address(0), "DLOP:TAKER_INVALID");

        order.taker = taker;
        order.makerTokenFeeAmount = makerTokenFeeAmount;
        order.takerFillAmount = order.takerAmount;

        bytes32 orderHashForTaker = _rfqOrderHash(order);
        require(
            ECDSA.recover(orderHashForTaker, takerSignature) == order.taker,
            "DLOP:INVALID_TAKER_SIGNATURE"
        );

        _settleRFQ(order, maxTakerCompensation, dodoRouteProxy, dodoApiData);

        emit RFQByPlatformFilled();
    }

    function _settleRFQ(
        RfqOrder memory order,
        uint256 maxTakerCompensation,
        address dodoRouteProxy,
        bytes memory dodoApiData
    ) internal {
        // cache
        address taker = order.taker;
        uint256 takerFillAmount = order.takerAmount;
        uint256 makerTokenFeeAmount = order.makerTokenFeeAmount;
        address orderMakerToken = order.makerToken;
        address orderTakerToken = order.takerToken;
        uint256 orderMakerAmount = order.makerAmount;

        // flash swap
        IDODOApproveProxy(_DODO_APPROVE_PROXY_).claimTokens(
            orderTakerToken,
            taker,
            address(this),
            takerFillAmount
        );

        // transfer taker token to maker token
        uint256 originMakerTokenBalance = IERC20(orderMakerToken).balanceOf(address(this));
        _approveMax(IERC20(orderTakerToken), _DODO_APPROVE_, takerFillAmount);
        (bool success, ) = dodoRouteProxy.call(dodoApiData);
        require(success, "API_SWAP_FAILED");
        uint256 makerTokenBalance = IERC20(orderMakerToken).balanceOf(address(this));
        uint256 makerTokenAmount = makerTokenBalance - originMakerTokenBalance;

        // calculate taker receive
        uint256 takerRececive = (orderMakerAmount * takerFillAmount) /
            order.takerAmount -
            makerTokenFeeAmount;
        if (makerTokenAmount >= takerRececive) {
            // refund the overpayment
            uint256 leftMakerTokenAmount = makerTokenAmount - takerRececive;
            IERC20(orderMakerToken).safeTransfer(_INSURANCE_, leftMakerTokenAmount);
        } else {
            // supplemental payment
            uint256 takerCompensation = takerRececive - makerTokenAmount;
            require(takerCompensation <= maxTakerCompensation, "DLOP:COMPENSATION_EXCEED");
            IDODOApproveProxy(_DODO_APPROVE_PROXY_).claimTokens(
                orderMakerToken,
                _INSURANCE_,
                address(this),
                takerCompensation
            );
        }

        // transfer to taker
        IERC20(orderMakerToken).safeTransfer(taker, takerRececive);
    }

    //============  Ownable ============
    function addAdmin(address userAddr) external onlyOwner {
        isAdmin[userAddr] = true;
        emit AddAdmin(userAddr);
    }

    function removeAdmin(address userAddr) external onlyOwner {
        isAdmin[userAddr] = false;
        emit RemoveAdmin(userAddr);
    }

    function changeTokenReceiver(address newTokenReceiver) external onlyOwner {
        _INSURANCE_ = newTokenReceiver;
        emit ChangeInsurance(newTokenReceiver);
    }

    //============  internal ============

    function _approveMax(
        IERC20 token,
        address to,
        uint256 amount
    ) internal {
        uint256 allowance = token.allowance(address(this), to);
        if (allowance < amount) {
            if (allowance > 0) {
                token.safeApprove(to, 0);
            }
            token.safeApprove(to, type(uint256).max);
        }
    }

    function _rfqOrderHash(RfqOrder memory order) private view returns (bytes32) {
        // keccak256(
        //     abi.encode(
        //         RFQ_ORDER_TYPEHASH,
        //         order.makerToken,
        //         order.takerToken,
        //         order.makerAmount,
        //         order.takerAmount,
        //         order.makerTokenFeeAmount,
        //         order.takerFillAmount,
        //         order.maker,
        //         order.taker,
        //         order.expiration,
        //         order.slot
        //     )
        // )
        bytes32 structHash;
        bytes32 orderTypeHash = RFQ_ORDER_TYPEHASH;
        assembly {
            let start := sub(order, 32)
            let tmp := mload(start)
            // 352 = (1+10)*32
            // [0...32)   bytes: EIP712_ORDER_TYPE
            // [32...352) bytes: order
            mstore(start, orderTypeHash)
            structHash := keccak256(start, 352)
            mstore(start, tmp)
        }
        return _hashTypedDataV4(structHash);
    }
}
