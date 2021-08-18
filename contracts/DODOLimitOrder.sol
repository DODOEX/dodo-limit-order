/*
    Copyright 2021 DODO ZOO.
    SPDX-License-Identifier: Apache-2.0
*/

pragma solidity 0.8.4;

import {IERC20} from "./intf/IERC20.sol";
import {SafeMath} from "./lib/SafeMath.sol";
import {SafeERC20} from "./lib/SafeERC20.sol";
import {EIP712} from "./external/draft-EIP712.sol";
import {ECDSA} from "./external/ECDSA.sol";
import "./lib/ArgumentsDecoder.sol";

/**
 * @title DODOLimitOrder
 * @author DODO Breeder
 */
contract DODOLimitOrder is EIP712("DODO Limit Order Protocol", "1"){
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using ArgumentsDecoder for bytes;

    struct LimitOrder {
        address makerToken;
        address takerToken;
        uint256 makerAmount;
        uint256 takerAmount;
        uint256 takerTokenFeeAmount;
        address maker;
        address taker;
        address feeRecipient;
        uint256 expiration;
        uint256 salt;
    }

    // ============ Storage ============
    mapping(bytes32 => uint256) public _FILLED_TAKER_AMOUNT_;

    bytes32 constant public LIMIT_ORDER_TYPEHASH = keccak256(
        "LimitOrder(address makerToken,address takerToken,uint256 makerAmount,uint256 takerAmount,uint256 takerTokenFeeAmount,address maker,address taker,address feeRecipient,uint256 expiration,uint256 salt)"
    );
    
    // ============ Events =============
    event LimitOrderFilled(address indexed maker, address indexed taker, bytes32 orderHash, uint256 curTakerFillAmount, uint256 curMakerFillAmount);

    function fillLimitOrder(
        LimitOrder memory order,
        bytes memory signature,
        uint256 takerFillAmount,
        uint256 thresholdMakerAmount,
        bytes memory takerInteraction
    ) public returns(uint256 curTakerFillAmount, uint256 curMakerFillAmount) {
        bytes32 orderHash = _orderHash(order);
        uint256 filledTakerAmount = _FILLED_TAKER_AMOUNT_[orderHash];

        require(filledTakerAmount < order.takerAmount, "DLOP: ALREADY_FILLED");
        //TODO: takerRegistry
        require(order.taker == msg.sender, "DLOP:UNABLE_FILL");
        //TODO: makerRegistry
        require(ECDSA.recover(orderHash, signature) == order.maker, "DLOP:INVALID_SIGNATURE");
        require(order.expiration > block.timestamp, "DLOP: EXPIRE_ORDER");


        uint256 leftTakerAmount = order.takerAmount.sub(filledTakerAmount);
        curTakerFillAmount = takerFillAmount < leftTakerAmount ? takerFillAmount:leftTakerAmount;
        curMakerFillAmount = curTakerFillAmount.mul(order.makerAmount).div(order.takerAmount);

        require(curTakerFillAmount > 0 && curMakerFillAmount > 0, "DLOP: ZERO_FILL_INVALID");
        require(thresholdMakerAmount <= curMakerFillAmount, "DLOP: FILL_MAKER_LOW");

        _FILLED_TAKER_AMOUNT_[orderHash] = filledTakerAmount.add(curTakerFillAmount);

        //Maker => Taker
        IERC20(order.makerToken).safeTransferFrom(order.maker, msg.sender, curMakerFillAmount);

        if(takerInteraction.length > 0) {
            takerInteraction.patchUint256(0, curTakerFillAmount);
            takerInteraction.patchUint256(1, curMakerFillAmount);
            (bool success, ) = msg.sender.call(takerInteraction);
            require(success, "DLOP: TAKER_INTERACTIVE_FAILED");
        }

        //Taker => Maker
        IERC20(order.takerToken).safeTransferFrom(msg.sender, order.maker, curTakerFillAmount);

        emit LimitOrderFilled(order.maker, msg.sender, orderHash, curTakerFillAmount, curMakerFillAmount);
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
                    order.takerTokenFeeAmount,
                    order.maker,
                    order.taker,
                    order.feeRecipient,
                    order.expiration,
                    order.salt
                )
            )
        );
    }
}