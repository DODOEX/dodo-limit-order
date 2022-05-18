var eth_sig_util_1 = require("eth-sig-util");
const { parseFixed } = require('@ethersproject/bignumber')

var dodoLimitOrder = "0x969782CEdA52E3a8991C8f91Add31406A781580F"

var privKeyInput = process.env.privKey;
var privKey = Buffer.from(privKeyInput, 'hex');

var order = {
    signer: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
    fromToken: "0x969782CEdA52E3a8991C8f91Add31406A781580F",//用户买的币地址
    toToken: "0xce7afae63edd2719cd9f46f8afa80eb490ede6a8",//用户卖的币地址
    fromAmount: parseFixed('10', 18).toString(), //做市商的报价
    toAmount: parseFixed('1', 18).toString(), //用户的输入
    expiration: Math.floor(new Date().getTime() / 1000 + 60 * 60 * 24 * 10), //做市商订单的过期时间，时间戳 秒
    slot: Math.round(Math.random() * Date.now()) + '' //做市商维护的唯一订单标识
}

var EIP712_DOMAIN = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
];

var ORDER_STRUCTRUE = [
    { name: 'signer', type: 'address' },
    { name: 'fromToken', type: 'address' },
    { name: 'toToken', type: 'address' },
    { name: 'fromAmount', type: 'uint256' },
    { name: 'toAmount', type: 'uint256' },
    { name: 'expiration', type: 'uint256' },
    { name: 'slot', type: 'uint256' }
];

createOrder();

async function createOrder() {
    var rfqOrderTypedData = buildOrderTypedData(order);
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


function buildOrderTypedData(rfqOrder) {
    return {
        primaryType: 'Order',
        types: {
            EIP712Domain: EIP712_DOMAIN,
            Order: ORDER_STRUCTRUE,
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