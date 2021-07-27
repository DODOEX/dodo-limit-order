/*
    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0
*/

pragma solidity 0.6.9;

import {IDODOApproveProxy} from "../SmartRoute/DODOApproveProxy.sol";
import {IERC20} from "../intf/IERC20.sol";
import {SafeMath} from "../lib/SafeMath.sol";
import {SafeERC20} from "../lib/SafeERC20.sol";
import {EIP712} from "../external/utils/draft-EIP712.sol";
import {ECDSA} from "../external/utils/ECDSA.sol";

/**
 * @title DODOLimitOrder
 * @author DODO Breeder
 */
contract DODOLimitOrder is EIP712("DODO Limit Order Protocol", "1"){
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    struct LimitOrder {
        address makerToken;
        address takerToken;
        uint256 makerAmount;
        uint256 takerAmount;
        //uint256 takerTokenFeeAmount;
        address maker;
        address taker;
        //address feeRecipient;
        uint256 expiration;
        uint256 salt;
    }

    // ============ Storage ============
    mapping(bytes32 => uint256) public _FILLED_TAKER_AMOUNT_;


    //TODO:
    bytes32 constant public LIMIT_ORDER_TYPEHASH = keccak256(
        "Order(address makerToken,address takerToken,uint256 makerAmount,uint256 takerAmount,address maker,address taker,uint256 expiration,uint256 salt)"
    );
    
    // ============ Events =============

    function fillLimitOrder(
        LimitOrder memory order,
        bytes memory signature,
        uint256 takingMaxAmount,
        uint256 thresholdMakerAmount
    ) external returns(uint256, uint256) {
        return fillLimitOrderTo(order, signature, takingMaxAmount, thresholdMakerAmount, msg.sender);
    }

    function fillLimitOrderTo(
        LimitOrder memory order,
        bytes memory signature,
        uint256 takingMaxAmount,
        uint256 thresholdMakerAmount,
        address receiver
    ) public returns(uint256, uint256) {
        bytes32 orderHash = _orderHash(order);
        uint256 filledTakerAmount = _FILLED_TAKER_AMOUNT_[orderHash];

        require(filledTakerAmount < order.takerAmount, "ALREADY_FILLED");
        //TODO: takerRegistry
        require(order.taker == tx.origin, "UNABLE_FILL");
        //TODO: filledTakerAmount == 0
        require(ECDSA.recover(orderHash, signature) == order.maker, "INVALID_SIGNATURE");
        require(order.expiration > block.timestamp, "EXPIRE_ORDER");

        // Compute maker and taker assets amount
        // if ((takingAmount == 0) == (makingAmount == 0)) {
        //     revert("LOP: only one amount should be 0");
        // }
        // else if (takingAmount == 0) {
        //     takingAmount = _callGetTakerAmount(order, makingAmount);
        //     require(takingAmount <= thresholdAmount, "LOP: taking amount too high");
        // }
        // else {
        //     makingAmount = _callGetMakerAmount(order, takingAmount);
        //     require(makingAmount >= thresholdAmount, "LOP: making amount too low");
        // }
        // require(makingAmount > 0 && takingAmount > 0, "LOP: can't swap 0 amount");
        // // Update remaining amount in storage
        // remainingMakerAmount = remainingMakerAmount.sub(makingAmount, "LOP: taking > remaining");
        // _remaining[orderHash] = remainingMakerAmount + 1;
        // emit OrderFilled(msg.sender, orderHash, remainingMakerAmount);

        // // Taker => Maker
        // _callTakerAssetTransferFrom(order.takerAsset, order.takerAssetData, takingAmount);

        // // Maker can handle funds interactively
        // if (order.interaction.length > 0) {
        //     InteractiveMaker(order.makerAssetData.decodeAddress(_FROM_INDEX))
        //         .notifyFillOrder(order.makerAsset, order.takerAsset, makingAmount, takingAmount, order.interaction);
        // }

        // // Maker => Taker
        // _callMakerAssetTransferFrom(order.makerAsset, order.makerAssetData, target, makingAmount);

        return (0, 0);
    }


    //============  internal ============
    function _orderHash(LimitOrder memory order) private view returns(bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    LIMIT_ORDER_TYPEHASH,
                    order.makerToken,
                    order.takerToken,
                    order.makerAmount,
                    order.takerAmount,
                    order.maker,
                    order.taker,
                    order.expiration,
                    order.salt
                )
            )
        );
    }

}