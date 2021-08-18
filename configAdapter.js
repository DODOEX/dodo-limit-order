const { RINKEBY_CONFIG } = require("./config/rinkeby-config");

exports.GetConfig = function (network, accounts) {
    var CONFIG = {}
    switch (network) {

        //testnet
        case "rinkeby":
            CONFIG = RINKEBY_CONFIG
            CONFIG.multiSigAddress = accounts[0]
            break;
    }
    return CONFIG
}
