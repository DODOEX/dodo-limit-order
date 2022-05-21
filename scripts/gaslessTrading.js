var eth_sig_util_1 = require("eth-sig-util");
const { parseFixed } = require('@ethersproject/bignumber')

var gaslessTrading = "0x0b7108e278c2e77e4e4f5c93d9e5e9a11ac837fc"

var privKeyInput = process.env.privKey;
var privKey = Buffer.from(privKeyInput, 'hex');

var order = {
    signer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    fromToken: "0xf5a2fe45f4f1308502b1c136b9ef8af136141382",
    toToken: "0x42997ac9251e5bb0a61f4ff790e5b991ea07fd9b",
    fromAmount: parseFixed('100', 18).toString(), 
    toAmount: parseFixed('200', 18).toString(), 
    expiration: 1792883473, // Math.floor(new Date().getTime() / 1000 + 60 * 60 * 24 * 10), 
    slot: 1234 // Math.round(Math.random() * Date.now()) + '' 
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
            chainId: 99, // in foundry test, the default chainId is 99
            verifyingContract: gaslessTrading,
        },
        message: rfqOrder,
    };
}