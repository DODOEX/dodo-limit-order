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
makeRFQByUserData();
// makeRFQByPlatformData();

async function makeLimitOrderData() {
    var makerToken = "0x0f423838d2e4ce4314d30f8ad42dc41cecde06c5"; //LOABC
    var takerToken = "0xce7afae63edd2719cd9f46f8afa80eb490ede6a8"; //LODEF
    var makerAmount = "10";
    var takerAmount = "1";
    var maker = "0xbC7814de9e42945C9fFd89D2BFff1a45e07Bdb10";
    var taker = dodoLimitOrderBotAddress;
    var dodoProxy = "0xba001E96AF87bF9d8D0BDA667067A9921FE6d294";
    var dodoApiData = "0xf87dc1b70000000000000000000000000f423838d2e4ce4314d30f8ad42dc41cecde06c5000000000000000000000000ce7afae63edd2719cd9f46f8afa80eb490ede6a80000000000000000000000000000000000000000000000008ac7230489e800000000000000000000000000000000000000000000000000000d36b9023c7130aa00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000619f4d530000000000000000000000000000000000000000000000000000000000000001000000000000000000000000ba76f249c40101427ec9d9823c251172f3e53548";
    var signature = "0x8e668bd71dfdba198d5958add64630d4b02fc4a02cc878111b176f2ec979b1f60c20cce7bc34a064334b6f77a8a507a18118a6d5b70b640db5b05589467911661b";
    var expiration = 1638692023;
    var saltOrSolt = 984669687182;

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
    var signature = "0x5604ad96b6f635b77fff522b851422ce76f26258639cd8c16d0f5c6697a2bfd16a9cabd94fc698fd00abcff1435cb3420d1517aef6875d62fce0bf8706fc1bf11b";
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
    var signatureByMM = "0x89b2130093f2ad4d805a002b7a72ba83b164bd476b4f095d4a0370908ad562d019cedd2bfb4a260591764dbf96f1f0304cb911c5e62c9c18f3952cb13639ef0e1b";
    var signatureByUser = "0xa0aed55c97c2393af7f9712f784760a9fadb942ae9073a026aa1a890753b890000e71b47297f5d517724903ec8aba5e244525b508260b378981af4f6fe195e6e1c";
    var expiration = 1638691567;
    var saltOrSolt = 58136626056;

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

