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
import {IDODOApproveProxy} from "./intf/IDODOApproveProxy.sol";
import {InitializableOwnable} from "./lib/InitializableOwnable.sol";
import "./lib/ArgumentsDecoder.sol";

/**
 * @title DODOLimitOrder
 * @author DODO Breeder
 */
contract DODOLimitOrder is EIP712("DODO Limit Order Protocol", "1"), InitializableOwnable{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using ArgumentsDecoder for bytes;

    struct Order {
        address makerToken;
        address takerToken;
        uint256 makerAmount;
        uint256 takerAmount;
        uint256 makerTokenFeeAmount;
        address maker;
        address taker;
        uint256 expiration;
        uint256 saltOrSlot;// salt for LimitOrder; slot for RFQ
    }

    bytes32 constant public ORDER_TYPEHASH = keccak256(
        "Order(address makerToken,address takerToken,uint256 makerAmount,uint256 takerAmount,uint256 makerTokenFeeAmount,address maker,address taker,uint256 expiration,uint256 saltOrSlot)"
    );

    // ============ Storage ============
    mapping(bytes32 => uint256) public _FILLED_TAKER_AMOUNT_; //limitOrder
    mapping(address => mapping(uint256 => uint256)) public _RFQ_FILLED_TAKER_AMOUNT_; //RFQ
    
    mapping (address => bool) public isWhiteListed;
    address public _DODO_APPROVE_PROXY_;
    address public _FEE_RECEIVER_;
    
    // ============ Events =============
    event LimitOrderFilled(address indexed maker, address indexed taker, bytes32 orderHash, uint256 curTakerFillAmount, uint256 curMakerFillAmount);
    event RFQByUserFilled(address indexed maker, address indexed taker, bytes32 orderHash, uint256 curTakerFillAmount, uint256 curMakerFillAmount);
    event RFQByPlatformFilled(address indexed maker, address indexed taker, bytes32 orderHash, uint256 curTakerFillAmount, uint256 curMakerFillAmount);
    event AddWhileList(address addr);
    event RemoveWhiteList(address addr);
    event ChangeFeeReceiver(address newFeeReceiver);
    
    function init(address owner, address dodoApproveProxy, address feeReciver) external {
        initOwner(owner);
        _DODO_APPROVE_PROXY_ = dodoApproveProxy;
        _FEE_RECEIVER_ = feeReciver;
    }

    // ============= LimitOrder ===============
    function fillLimitOrder(
        Order memory order,
        bytes memory signature,
        uint256 takerFillAmount,
        uint256 thresholdTakerAmount,
        bytes memory takerInteraction
    ) public returns(uint256 curTakerFillAmount, uint256 curMakerFillAmount) {
        bytes32 orderHash = _orderHash(order);
        uint256 filledTakerAmount = _FILLED_TAKER_AMOUNT_[orderHash];

        require(filledTakerAmount < order.takerAmount, "DLOP: ALREADY_FILLED");

        if (order.taker != address(0)) {
            require(order.taker == msg.sender, "DLOP:PRIVATE_ORDER");
        }

        require(ECDSA.recover(orderHash, signature) == order.maker, "DLOP:INVALID_SIGNATURE");
        require(order.expiration > block.timestamp, "DLOP: EXPIRE_ORDER");


        uint256 leftTakerAmount = order.takerAmount.sub(filledTakerAmount);
        curTakerFillAmount = takerFillAmount < leftTakerAmount ? takerFillAmount:leftTakerAmount;
        curMakerFillAmount = curTakerFillAmount.mul(order.makerAmount).div(order.takerAmount);

        require(curTakerFillAmount > 0 && curMakerFillAmount > 0, "DLOP: ZERO_FILL_INVALID");
        require(curTakerFillAmount >= thresholdTakerAmount, "DLOP: FILL_AMOUNT_NOT_ENOUGH");

        _FILLED_TAKER_AMOUNT_[orderHash] = filledTakerAmount.add(curTakerFillAmount);

        //Maker => Taker
        IDODOApproveProxy(_DODO_APPROVE_PROXY_).claimTokens(order.makerToken, order.maker, msg.sender, curMakerFillAmount);

        if(takerInteraction.length > 0) {
            takerInteraction.patchUint256(0, curTakerFillAmount);
            takerInteraction.patchUint256(1, curMakerFillAmount);
            require(isWhiteListed[msg.sender], "DLOP: Not Whitelist Contract");
            (bool success, ) = msg.sender.call(takerInteraction);
            require(success, "DLOP: TAKER_INTERACTIVE_FAILED");
        }

        //Taker => Maker
        IERC20(order.takerToken).safeTransferFrom(msg.sender, order.maker, curTakerFillAmount);

        emit LimitOrderFilled(order.maker, msg.sender, orderHash, curTakerFillAmount, curMakerFillAmount);
    }


    //================ RFQ ================
    function fillRFQByUser(
        Order memory order,
        bytes memory signature,
        uint256 takerFillAmount,
        uint256 thresholdMakerAmount,
        address taker
    ) public returns(uint256 curTakerFillAmount, uint256 curMakerFillAmount) {
        uint256 filledTakerAmount = _RFQ_FILLED_TAKER_AMOUNT_[order.maker][order.saltOrSlot];
        require(filledTakerAmount < order.takerAmount, "DLOP: ALREADY_FILLED");

        require(order.taker == address(0), "DLOP:TAKER_INVALID");
        
        bytes32 orderHash = _orderHash(order);
        require(ECDSA.recover(orderHash, signature) == order.maker, "DLOP:INVALID_SIGNATURE");

        (curTakerFillAmount, curMakerFillAmount) = _settleRFQ(order,filledTakerAmount,takerFillAmount,thresholdMakerAmount,taker);
        
        emit RFQByUserFilled(order.maker, taker, orderHash, curTakerFillAmount, curMakerFillAmount);
    }

    function matchingRFQByPlatform(
        Order memory order,
        bytes memory makerSignature,
        bytes memory takerSignature,
        uint256 takerFillAmount,
        uint256 thresholdMakerAmount,
        uint256 makerTokenFeeAmount,
        address taker
    ) public returns(uint256 curTakerFillAmount, uint256 curMakerFillAmount) {
        uint256 filledTakerAmount = _RFQ_FILLED_TAKER_AMOUNT_[order.maker][order.saltOrSlot];
        require(filledTakerAmount < order.takerAmount, "DLOP: ALREADY_FILLED");

        bytes32 orderHashForMaker = _orderHash(order);
        require(ECDSA.recover(orderHashForMaker, makerSignature) == order.maker, "DLOP:INVALID_MAKER_SIGNATURE");
        require(order.taker == address(0), "DLOP:TAKER_INVALID");

        order.taker = taker;
        order.makerTokenFeeAmount = makerTokenFeeAmount;
        bytes32 orderHashForTaker = _orderHash(order);
        require(ECDSA.recover(orderHashForTaker, takerSignature) == taker, "DLOP:INVALID_TAKER_SIGNATURE");

        (curTakerFillAmount, curMakerFillAmount) = _settleRFQ(order,filledTakerAmount,takerFillAmount,thresholdMakerAmount,taker);
        
        emit RFQByPlatformFilled(order.maker, taker, orderHashForMaker, curTakerFillAmount, curMakerFillAmount);
    }

    //============  Ownable ============
    function addWhiteList (address contractAddr) public onlyOwner {
        isWhiteListed[contractAddr] = true;
        emit AddWhileList(contractAddr);
    }

    function removeWhiteList (address contractAddr) public onlyOwner {
        isWhiteListed[contractAddr] = false;
        emit RemoveWhiteList(contractAddr);
    }

    function changeFeeReceiver (address newFeeReceiver) public onlyOwner {
        _FEE_RECEIVER_ = newFeeReceiver;
        emit ChangeFeeReceiver(newFeeReceiver);
    }

    //============  internal ============
    function _settleRFQ(
        Order memory order,
        uint256 filledTakerAmount,
        uint256 takerFillAmount,
        uint256 thresholdMakerAmount,
        address taker
    ) internal returns(uint256,uint256) {
        require(order.expiration > block.timestamp, "DLOP: EXPIRE_ORDER");

        uint256 leftTakerAmount = order.takerAmount.sub(filledTakerAmount);
        if(takerFillAmount > leftTakerAmount) {
            return (0,0);
        }
        
        uint256 curTakerFillAmount = takerFillAmount;
        uint256 curMakerFillAmount = curTakerFillAmount.mul(order.makerAmount).div(order.takerAmount);

        require(curTakerFillAmount > 0 && curMakerFillAmount > 0, "DLOP: ZERO_FILL_INVALID");
        require(curMakerFillAmount.sub(order.makerTokenFeeAmount) >= thresholdMakerAmount, "DLOP: FILL_AMOUNT_NOT_ENOUGH");

        _RFQ_FILLED_TAKER_AMOUNT_[order.maker][order.saltOrSlot] = filledTakerAmount.add(curTakerFillAmount);

        if(order.makerTokenFeeAmount > 0) {
            IDODOApproveProxy(_DODO_APPROVE_PROXY_).claimTokens(order.makerToken, order.maker, _FEE_RECEIVER_, order.makerTokenFeeAmount);
        }
        //Maker => Taker
        IDODOApproveProxy(_DODO_APPROVE_PROXY_).claimTokens(order.makerToken, order.maker, taker, curMakerFillAmount.sub(order.makerTokenFeeAmount));
        //Taker => Maker
        IDODOApproveProxy(_DODO_APPROVE_PROXY_).claimTokens(order.takerToken, taker, order.maker, curTakerFillAmount);

        return (curTakerFillAmount, curMakerFillAmount);
    }


    function _orderHash(Order memory order) private view returns(bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    ORDER_TYPEHASH,
                    order.makerToken,
                    order.takerToken,
                    order.makerAmount,
                    order.takerAmount,
                    order.makerTokenFeeAmount,
                    order.maker,
                    order.taker,
                    order.expiration,
                    order.saltOrSlot
                )
            )
        );
    }
}