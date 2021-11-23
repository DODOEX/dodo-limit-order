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
    var dodoApiData = "0xf87dc1b7000000000000000000000000ce7afae63edd2719cd9f46f8afa80eb490ede6a80000000000000000000000000f423838d2e4ce4314d30f8ad42dc41cecde06c50000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000837d0d63fe6d1f1400000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000619d0e330000000000000000000000000000000000000000000000000000000000000001000000000000000000000000ba76f249c40101427ec9d9823c251172f3e53548";
    var signature = "0xdcc5a13ed9a74198f10c8cf6c0c548f7cd0d29160f97c5f91dff7d4f80a973df799918a63462342ea922ad9dadcb006a5d43a684d4a11db727487319ac69cf251b";
    var expiration = 1638544313;
    var saltOrSolt = 1283598123731;
    
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
        maker: maker,
        taker: taker,
        expiration: expiration,
        saltOrSolt: saltOrSolt
    }

    var fillLimitOrderData = dodoLimitOrderInstance.methods.fillLimitOrder(
        limitOrder,
        signature,
        parseFixed('1', 18).toString(),//all filled
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


async function makeRFQData() {
    var makerToken = "0xce7afae63edd2719cd9f46f8afa80eb490ede6a8"; //LODEF
    var takerToken = "0x0f423838d2e4ce4314d30f8ad42dc41cecde06c5"; //LOABC
    var makerAmount = "1";
    var takerAmount = "10";
    var maker = "0x7e83d9d94837eE82F0cc18a691da6f42F03F1d86";
    var taker = "0xbC7814de9e42945C9fFd89D2BFff1a45e07Bdb10";
    var signature = "0x01faed0170a4131734ce86561da4460702d0e07b55404b7eb111c45253f9c58e7474a40a4999848c868dc39650b639660bda7905e151078dd84419efa97a875b1b";
    var expiration = "1638543769";
    var saltOrSolt = "1572582376302";

    var rfqOrder = {
        makerToken: makerToken,
        takerToken: takerToken,
        makerAmount: parseFixed(makerAmount, 18).toString(),
        takerAmount: parseFixed(takerAmount, 18).toString(),
        maker: maker,
        taker: taker,
        expiration: expiration,
        saltOrSolt: saltOrSolt
    };

    console.log("rfqOrder:", rfqOrder)

    try {
        var data = dodoLimitOrderInstance.methods.fillRFQ(
            rfqOrder,
            signature,
            parseFixed(takerAmount, 18).toString(),//all filled
            "0",
            "0x0000000000000000000000000000000000000000"
        ).encodeABI();

        console.log("data:", data)
    } catch(e) {
        console.log("e:",e)
    }

}