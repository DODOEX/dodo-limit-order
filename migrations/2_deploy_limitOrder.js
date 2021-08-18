const fs = require("fs");
const { deploySwitch } = require('../truffle-config.js')
const file = fs.createWriteStream("../deploy-detail.txt", { 'flags': 'a' });
let logger = new console.Console(file, file);
const { GetConfig } = require("../configAdapter.js")

const DODOLimitOrder = artifacts.require("DODOLimitOrder");
const DODOLimitOrderBot = artifacts.require("DODOLimitOrderBot");

module.exports = async (deployer, network, accounts) => {
    let CONFIG = GetConfig(network, accounts)
    if (CONFIG == null) return;

    let DODOApproveAddress = CONFIG.DODOApprove;
    if (DODOApproveAddress == null) return;

    let DODOLimitOrderAddress = CONFIG.DODOLimitOrder;
    let DODOLimitOrderBotAddress = CONFIG.DODOLimitOrderBot;

    //Account
    let multiSigAddress = CONFIG.multiSigAddress;

    if (deploySwitch.DEPLOY_LIMIT_ORDER) {
        logger.log("====================================================");
        logger.log("network type: " + network);
        logger.log("Deploy time: " + new Date().toLocaleString());
        logger.log("Deploy type: limitOrder");
        logger.log("multiSigAddress: ", multiSigAddress)

        if (DODOLimitOrderAddress == "") {
            await deployer.deploy(DODOLimitOrder);
            DODOLimitOrderAddress = DODOLimitOrder.address;
            logger.log("DODOLimitOrder Address: ", DODOLimitOrderAddress);
        }

        if (DODOLimitOrderBotAddress == "") {
            await deployer.deploy(DODOLimitOrderBot);
            DODOLimitOrderBotAddress = DODOLimitOrderBot.address;
            logger.log("DODOLimitOrderBot Address: ", DODOLimitOrderBotAddress);
        }


        if (network == 'rinkeby') {
            var tx;
            const DODOLimitOrderBotInstance = await DODOLimitOrderBot.at(DODOLimitOrderBotAddress);
            tx = await DODOLimitOrderBotInstance.init(multiSigAddress, DODOLimitOrderAddress, multiSigAddress, DODOApproveAddress);
            logger.log("DODOLimitOrderBot Init tx: ", tx.tx);
        }
    }
};
