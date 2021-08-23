var Web3 = require('web3');
const { parseFixed } = require('@ethersproject/bignumber')
var infuraId = process.env.infuraId;

var dodoLimitOrderAbi = require('../build/contracts/DODOLimitOrder.json').abi;
var dodoLimitOrderBotAbi = require('../build/contracts/DODOLimitOrderBot.json').abi;

//rinkeby
var web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/" + infuraId));
var dodoLimitOrderAddress = "0x108DC7Ce5011a2a6D56E215434C19Cc74cE069Cf";
var dodoLimitOrderBotAddress = "0x60c45cBA5f2dD81A4Aa590b29FD2D6123d095345";
var dodoLimitOrderInstance = new web3.eth.Contract(dodoLimitOrderAbi, dodoLimitOrderAddress);
var dodoLimitOrderBotInstance = new web3.eth.Contract(dodoLimitOrderBotAbi, dodoLimitOrderBotAddress);
var makerToken = "0x0f423838d2e4ce4314d30f8ad42dc41cecde06c5"; //LOABC
var takerToken = "0xce7afae63edd2719cd9f46f8afa80eb490ede6a8"; //LODEF
var makerAmount = "10";
var takerAmount = "1";
var maker = "0xbC7814de9e42945C9fFd89D2BFff1a45e07Bdb10";
var taker = dodoLimitOrderBotAddress;
var feeReceiver = "0x0000000000000000000000000000000000000000";
var dodoProxy = "0xba001E96AF87bF9d8D0BDA667067A9921FE6d294";
var dodoApiData = "";
var signature = "";
var expiration = 1630594593;
var salt = "1346135643555";

makeData()

async function makeData() {
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
    var limitOrder = {
        makerToken: makerToken,
        takerToken: takerToken,
        makerAmount: parseFixed(makerAmount, 18).toString(),
        takerAmount: parseFixed(takerAmount, 18).toString(),
        takerTokenFeeAmount: '0',
        maker: maker,
        taker: taker,
        feeRecipient: feeReceiver,
        expiration: expiration,
        salt: salt
    }

    var fillLimitOrderData = dodoLimitOrderInstance.methods.fillLimitOrder(
        limitOrder,
        signature,
        parseFixed('0.3', 18).toString(),//all filled
        "0",
        dodoLimitOrderSwapData
    ).encodeABI();


    //step three: 构造最上层DODOLimitOrderBot
    var data = dodoLimitOrderBotInstance.methods.fillDODOLimitOrder(
        fillLimitOrderData,
        takerToken,
        "0"
    ).encodeABI();

    console.log("data:", data)
}
