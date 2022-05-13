var eth_sig_util_1 = require("eth-sig-util");
const { parseFixed } = require('@ethersproject/bignumber')

var dodoLimitOrder = "0x969782CEdA52E3a8991C8f91Add31406A781580F"
var dodoLimitOrderBot = "0xD17bfB2C31021ED1D3ae2C34D04F3f3A69e5dc82"

var Rinkeby_LOABC = "0x0f423838d2e4ce4314d30f8ad42dc41cecde06c5"
var Rinkeby_LODEF = "0xce7afae63edd2719cd9f46f8afa80eb490ede6a8"
var privKeyInput = process.env.privKey;
var privKey = Buffer.from(privKeyInput, 'hex');




var rfqOrder = {
    makerToken: "0x969782CEdA52E3a8991C8f91Add31406A781580F",//用户买的币地址
    takerToken: "0xce7afae63edd2719cd9f46f8afa80eb490ede6a8",//用户卖的币地址
    makerAmount: parseFixed('10', 18).toString(), //做市商的报价
    takerAmount: parseFixed('1', 18).toString(), //用户的输入
    makerTokenFeeAmount: '0', //默认0
    takerFillAmount: parseFixed('1', 18).toString(),//等于takerAmount
    maker: '0xbC7814de9e42945C9fFd89D2BFff1a45e07Bdb10', //做市商地址
    taker: '0x0000000000000000000000000000000000000000',//默认空地址
    expiration: Math.floor(new Date().getTime() / 1000 + 60 * 60 * 24 * 10), //做市商订单的过期时间，时间戳 秒
    slot: Math.round(Math.random() * Date.now()) + '' //做市商维护的唯一订单标识
}

var EIP712_DOMAIN = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
];

var RFQ_ORDER_STRUCTRUE = [
    { name: 'makerToken', type: 'address' },
    { name: 'takerToken', type: 'address' },
    { name: 'makerAmount', type: 'uint256' },
    { name: 'takerAmount', type: 'uint256' },
    { name: 'makerTokenFeeAmount', type: 'uint256' },
    { name: 'takerFillAmount', type: 'uint256' },
    { name: 'maker', type: 'address' },
    { name: 'taker', type: 'address' },
    { name: 'expiration', type: 'uint256' },
    { name: 'slot', type: 'uint256' }
];

createRfqOrder();

async function createRfqOrder() {
    var rfqOrderTypedData = buildRfqOrderTypedData(rfqOrder);
    var signature = await signTypedData(rfqOrderTypedData);

    console.log("signature:", signature) //做市商的签名
}

async function signTypedData(typedData) {
    const result = await eth_sig_util_1.signTypedData_v4(privKey, {
        data: typedData,
    });


    const recovered = eth_sig_util_1.recoverTypedSignature_v4({
        data: typedData,
        sig: result,
    });

    console.log("recovered:", recovered)  //得到做市商公钥地址，进行比对

    return result
}


function buildRfqOrderTypedData(rfqOrder) {
    return {
        primaryType: 'Order',
        types: {
            EIP712Domain: EIP712_DOMAIN,
            RfqOrder: RFQ_ORDER_STRUCTRUE,
        },
        domain: {
            name: 'DODO Limit Order Protocol',
            version: '1',
            chainId: 4,
            verifyingContract: dodoLimitOrder,
        },
        message: rfqOrder,
    };
}


// createOrder();

var limitOrder = {
    makerToken: Rinkeby_LOABC,
    takerToken: Rinkeby_LODEF,
    makerAmount: parseFixed('10', 18).toString(),
    takerAmount: parseFixed('1', 18).toString(),
    maker: '0xbC7814de9e42945C9fFd89D2BFff1a45e07Bdb10',
    taker: dodoLimitOrderBot,
    expiration: Math.floor(new Date().getTime() / 1000 + 60 * 60 * 24 * 10),
    salt: Math.round(Math.random() * Date.now()) + ''
}

var LIMIT_ORDER_STRUCTRUE = [
    { name: 'makerToken', type: 'address' },
    { name: 'takerToken', type: 'address' },
    { name: 'makerAmount', type: 'uint256' },
    { name: 'takerAmount', type: 'uint256' },
    { name: 'maker', type: 'address' },
    { name: 'taker', type: 'address' },
    { name: 'expiration', type: 'uint256' },
    { name: 'salt', type: 'uint256' }
];

async function createOrder() {
    var limitOrderTypedData = buildLimitOrderTypedData(limitOrder);
    var signature = await signTypedData(limitOrderTypedData);

    console.log("signature:", signature)
    console.log("expiration:", limitOrder.expiration)
    console.log("salt:", limitOrder.salt)
}


function buildLimitOrderTypedData(limitOrder) {
    return {
        primaryType: 'LimitOrder',
        types: {
            EIP712Domain: EIP712_DOMAIN,
            LimitOrder: LIMIT_ORDER_STRUCTRUE,
        },
        domain: {
            name: 'DODO Limit Order Protocol',
            version: '1',
            chainId: 4,
            verifyingContract: dodoLimitOrder,
        },
        message: limitOrder,
    };
}

