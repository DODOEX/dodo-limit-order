var Web3 = require('web3');
const { parseFixed } = require('@ethersproject/bignumber')
var infuraId = process.env.infuraId;

var dodoLimitOrderAbi = require('../build/contracts/DODOLimitOrder.json').abi;
var dodoLimitOrderBotAbi = require('../build/contracts/DODOLimitOrderBot.json').abi;

//rinkeby
var web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/" + infuraId));
var dodoLimitOrderAddress = "0x3d6cD627e7F13CaDd1B577ceFe2Bb0555aBbc1a9";
var dodoLimitOrderBotAddress = "0xBAac6209dc3E92988F87EB6111f0914ADC1eAe9e";
var dodoLimitOrderInstance = new web3.eth.Contract(dodoLimitOrderAbi, dodoLimitOrderAddress);
var dodoLimitOrderBotInstance = new web3.eth.Contract(dodoLimitOrderBotAbi, dodoLimitOrderBotAddress);

// makeLimitOrderData()
// makeRFQByUserData();
makeRFQByPlatformData();

async function makeLimitOrderData() {
    var makerToken = "0x0f423838d2e4ce4314d30f8ad42dc41cecde06c5"; //LOABC
    var takerToken = "0xce7afae63edd2719cd9f46f8afa80eb490ede6a8"; //LODEF
    var makerAmount = "10";
    var takerAmount = "1";
    var maker = "0xbC7814de9e42945C9fFd89D2BFff1a45e07Bdb10";
    var taker = dodoLimitOrderBotAddress;
    var dodoProxy = "0xba001E96AF87bF9d8D0BDA667067A9921FE6d294";
    var dodoApiData = "";
    var signature = "";
    var expiration = 1638773261;
    var saltOrSolt = 244801022974;

    //step one: 构造doLimitOrderSwap
    var dodoLimitOrderSwapData = dodoLimitOrderBotInstance.methods.doLimitOrderSwap(
        0,
        0,
        makerToken,
        takerToken,
        dodoProxy,
        dodoApiData
    ).encodeABI();

    //step two: 构造DODOLimitOrder的 fillLimitOrder
    var limitOrder = [
        makerToken,
        takerToken,
        parseFixed(makerAmount, 18).toString(),
        parseFixed(takerAmount, 18).toString(),
        '0',
        maker,
        taker,
        expiration,
        saltOrSolt
    ]

    var fillLimitOrderData = dodoLimitOrderInstance.methods.fillLimitOrder(
        limitOrder,
        signature,
        parseFixed('1', 18).toString(),//all filled
        "0",
        dodoLimitOrderSwapData
    ).encodeABI();

    console.log("fillLimitOrderData:", fillLimitOrderData);

    //step three: 构造最上层DODOLimitOrderBot
    var data = dodoLimitOrderBotInstance.methods.fillDODOLimitOrder(
        fillLimitOrderData,
        takerToken,
        "0"
    ).encodeABI();

    console.log("data:", data)
}


async function makeRFQByUserData() {
    var makerToken = "0xce7afae63edd2719cd9f46f8afa80eb490ede6a8"; //LODEF
    var takerToken = "0x0f423838d2e4ce4314d30f8ad42dc41cecde06c5"; //LOABC
    var makerAmount = "1";
    var takerAmount = "10";
    var maker = "0x7e83d9d94837eE82F0cc18a691da6f42F03F1d86";
    var taker = "0x0000000000000000000000000000000000000000";
    var signature = "";
    var expiration = 1638692362;
    var saltOrSolt = 920209842331;

    var rfqOrder = [
        makerToken,
        takerToken,
        parseFixed(makerAmount, 18).toString(),
        parseFixed(takerAmount, 18).toString(),
        '0',
        maker,
        taker,
        expiration,
        saltOrSolt
    ]

    console.log("rfqOrder:", rfqOrder)

    var data = dodoLimitOrderInstance.methods.fillRFQByUser(
        rfqOrder,
        signature,
        parseFixed(takerAmount, 18).toString(),//all filled
        "0",
        "0xbC7814de9e42945C9fFd89D2BFff1a45e07Bdb10"
    ).encodeABI();

    console.log("data:", data)
}

async function makeRFQByPlatformData() {
    var makerToken = "0xce7afae63edd2719cd9f46f8afa80eb490ede6a8"; //LODEF
    var takerToken = "0x0f423838d2e4ce4314d30f8ad42dc41cecde06c5"; //LOABC
    var makerAmount = "1";
    var takerAmount = "10";
    var makerTokenFeeAmount = "0"
    var maker = "0x7e83d9d94837eE82F0cc18a691da6f42F03F1d86";
    var taker = "0x0000000000000000000000000000000000000000";
    var signatureByMM = "";
    var signatureByUser = "";
    var expiration = 1638774174;
    var saltOrSolt = 1597523953413;

    var rfqOrder = [
        makerToken,
        takerToken,
        parseFixed(makerAmount, 18).toString(),
        parseFixed(takerAmount, 18).toString(),
        parseFixed(makerTokenFeeAmount, 18).toString(),
        maker,
        taker,
        expiration,
        saltOrSolt
    ]

    console.log("rfqOrder:", rfqOrder)

    var data = dodoLimitOrderInstance.methods.matchingRFQByPlatform(
        rfqOrder,
        signatureByMM,
        signatureByUser,
        parseFixed(takerAmount, 18).toString(),//all filled
        "0",
        "10000000000000000",
        "0xbC7814de9e42945C9fFd89D2BFff1a45e07Bdb10"
    ).encodeABI();

    console.log("data:", data)
}

