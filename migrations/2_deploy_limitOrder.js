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
    let DODOApproveProxyAddress = CONFIG.DODOApproveProxy;
    if (DODOApproveAddress == null || DODOApproveProxyAddress == null) return;

    let DODOLimitOrderAddress = CONFIG.DODOLimitOrder;
    let DODOLimitOrderBotAddress = CONFIG.DODOLimitOrderBot;

    let owner = CONFIG.Owner;
    let feeReceiver = CONFIG.FeeReceiver;
    let limitBotSender = CONFIG.LimitBotSender;
    let rfqSender = CONFIG.RfqSender;

    if (deploySwitch.DEPLOY_LIMIT_ORDER) {
        logger.log("====================================================");
        logger.log("network type: " + network);
        logger.log("Deploy time: " + new Date().toLocaleString());
        logger.log("Deploy type: limitOrder");

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


        if (CONFIG.DODOLimitOrderBot == "") {
            var tx;
            const DODOLimitOrderBotInstance = await DODOLimitOrderBot.at(DODOLimitOrderBotAddress);
            tx = await DODOLimitOrderBotInstance.init(owner, DODOLimitOrderAddress, feeReceiver, DODOApproveAddress);
            logger.log("DODOLimitOrderBot Init tx: ", tx.tx);

            tx = await DODOLimitOrderBotInstance.addAdminList(limitBotSender);
            logger.log("DODOLimitOrderBot AddAdminList tx: ", tx.tx);

            const DODOLimitOrderInstance = await DODOLimitOrder.at(DODOLimitOrderAddress);
            tx = await DODOLimitOrderInstance.init(owner, DODOApproveProxyAddress, feeReceiver);
            logger.log("DODOLimitOrder Init tx: ", tx.tx);

            tx = await DODOLimitOrderInstance.addWhiteList(DODOLimitOrderBotAddress);
            logger.log("DODOLimitOrder AddWhiteList tx: ", tx.tx);

            if (rfqSender != "") {
                tx = await DODOLimitOrderInstance.addAdminList(rfqSender);
                logger.log("DODOLimitOrder AddAdminList tx: ", tx.tx);
            }
        }
    }
};
