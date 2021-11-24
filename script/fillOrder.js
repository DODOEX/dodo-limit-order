var Web3 = require('web3');
const { parseFixed } = require('@ethersproject/bignumber')
var infuraId = process.env.infuraId;

var dodoLimitOrderAbi = require('../build/contracts/DODOLimitOrder.json').abi;
var dodoLimitOrderBotAbi = require('../build/contracts/DODOLimitOrderBot.json').abi;

//rinkeby
var web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/" + infuraId));
var dodoLimitOrderAddress = "0x2093bC118E6B4aBFB0B3f61E2d01e9100c93B713";
var dodoLimitOrderBotAddress = "0xFff90AA817D06801d8B8A9B8B0E295C7708AeD30";
var dodoLimitOrderInstance = new web3.eth.Contract(dodoLimitOrderAbi, dodoLimitOrderAddress);
var dodoLimitOrderBotInstance = new web3.eth.Contract(dodoLimitOrderBotAbi, dodoLimitOrderBotAddress);

makeData()
// makeRFQData();


async function makeData() {
    var makerToken = "0x0f423838d2e4ce4314d30f8ad42dc41cecde06c5"; //LOABC
    var takerToken = "0xce7afae63edd2719cd9f46f8afa80eb490ede6a8"; //LODEF
    var makerAmount = "10";
    var takerAmount = "1";
    var maker = "0xbC7814de9e42945C9fFd89D2BFff1a45e07Bdb10";
    var taker = dodoLimitOrderBotAddress;
    var dodoProxy = "0xba001E96AF87bF9d8D0BDA667067A9921FE6d294";
    var dodoApiData = "0xf87dc1b70000000000000000000000000f423838d2e4ce4314d30f8ad42dc41cecde06c5000000000000000000000000ce7afae63edd2719cd9f46f8afa80eb490ede6a80000000000000000000000000000000000000000000000008ac7230489e800000000000000000000000000000000000000000000000000000d376626f626f19d00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000619d97ae0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000ba76f249c40101427ec9d9823c251172f3e53548";
    var signature = "0xeb4079eb2c728f0907f4c567bcf5f587abfdc276df5988d1b64862222e33b0be7e820890888ac3687cddd06cb32dab5353010733bb22247609c7d16ccf60dd621b";
    var expiration = 1638579989;
    var saltOrSolt = 363880468936;

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


async function makeRFQData() {
    var makerToken = "0xce7afae63edd2719cd9f46f8afa80eb490ede6a8"; //LODEF
    var takerToken = "0x0f423838d2e4ce4314d30f8ad42dc41cecde06c5"; //LOABC
    var makerAmount = "1";
    var takerAmount = "10";
    var maker = "0x7e83d9d94837eE82F0cc18a691da6f42F03F1d86";
    var taker = "0x0000000000000000000000000000000000000000";
    var signature = "0x48714508bef5cc8ba80723937900e7a584327fbc4ed61076d82571d4442c39d05c53541d7b33fedafb7ab7dcbbd2460e1d8d619b880fb719aa33f5826022eb521c";
    var expiration = 1638579123;
    var saltOrSolt = 1499822599887;

    var rfqOrder = [
        makerToken,
        takerToken,
        parseFixed(makerAmount, 18).toString(),
        parseFixed(takerAmount, 18).toString(),
        maker,
        taker,
        expiration,
        saltOrSolt
    ]

    console.log("rfqOrder:", rfqOrder)

    var data = dodoLimitOrderInstance.methods.fillRFQ(
        rfqOrder,
        signature,
        parseFixed(takerAmount, 18).toString(),//all filled
        "0",
        "0xbC7814de9e42945C9fFd89D2BFff1a45e07Bdb10"
    ).encodeABI();

    console.log("data:", data)

}


