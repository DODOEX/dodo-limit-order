var eth_sig_util_1 = require("eth-sig-util");
const { parseFixed } = require('@ethersproject/bignumber')
var privKey = process.env.privKey;

var dodoLimitOrder = "0x108DC7Ce5011a2a6D56E215434C19Cc74cE069Cf"
var dodoLimitOrderBot = "0x60c45cBA5f2dD81A4Aa590b29FD2D6123d095345"

var Rinkeby_LOABC = "0x0f423838d2e4ce4314d30f8ad42dc41cecde06c5"
var Rinkeby_LODEF = "0xce7afae63edd2719cd9f46f8afa80eb490ede6a8"

var limitOrder = {
    makerToken: Rinkeby_LOABC,
    takerToken: Rinkeby_LODEF,
    makerAmount: parseFixed('10', 18).toString(),
    takerAmount: parseFixed('1', 18).toString(),
    takerTokenFeeAmount: '0',
    maker: '0xbC7814de9e42945C9fFd89D2BFff1a45e07Bdb10',
    taker: dodoLimitOrderBot,
    feeRecipient: '0x0000000000000000000000000000000000000000',
    expiration: Math.floor(new Date().getTime() / 1000 + 60 * 60 * 24 * 10),
    salt: Math.round(Math.random() * Date.now()) + ''
}

var EIP712_DOMAIN = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
];

var LIMIT_ORDER_STRUCTRUE = [
    { name: 'makerToken', type: 'address' },
    { name: 'takerToken', type: 'address' },
    { name: 'makerAmount', type: 'uint256' },
    { name: 'takerAmount', type: 'uint256' },
    { name: 'takerTokenFeeAmount', type: 'uint256' },
    { name: 'maker', type: 'address' },
    { name: 'taker', type: 'address' },
    { name: 'feeRecipient', type: 'address' },
    { name: 'expiration', type: 'uint256' },
    { name: 'salt', type: 'uint256' }
];

createOrder();

async function createOrder() {
    var limitOrderTypedData = buildLimitOrderTypedData(limitOrder);
    var signature = await signTypedData(limitOrderTypedData);

    console.log("signature:", signature)
    console.log("expiration:", limitOrder.expiration)
    console.log("salt:", limitOrder.salt)
}


async function signTypedData(typedData) {
    const result = await eth_sig_util_1.signTypedData_v4(Buffer.from(privKey, 'hex'), {
        data: typedData,
    });
    return result
}

//For MetaMask
// async function signTypedData(account, typedData) {
//     return this.web3.currentProvider.send('eth_signTypedData_v4', [
//         account,
//         JSON.stringify(typedData),
//     ]);
// }

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

