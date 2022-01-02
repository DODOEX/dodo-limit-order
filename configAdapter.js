const { RINKEBY_CONFIG } = require("./config/rinkeby-config");
const { BSC_CONFIG } = require("./config/bsc-config");
const { POLYGON_CONFIG } = require("./config/polygon-config");
const { AVAX_CONFIG } = require("./config/avax-config");
const { ARB_CONFIG } = require("./config/arb-config");
const { HECO_CONFIG } = require("./config/heco-config");
const { OEC_CONFIG } = require("./config/okchain-config");
const { MOONRIVER_CONFIG } = require("./config/moonriver-config");
const { AURORA_CONFIG } = require("./config/aurora-config");
const { BOBA_CONFIG } = require("./config/boba-config");
const { ETH_CONFIG } = require("./config/eth-config");

exports.GetConfig = function (network, accounts) {
    var CONFIG = {}
    switch (network) {
        case "live":
            CONFIG = ETH_CONFIG
            break;
        case "bsclive":
            CONFIG = BSC_CONFIG
            break;
        case "polygon":
            CONFIG = POLYGON_CONFIG
            break;
        case "avax":
            CONFIG = AVAX_CONFIG
            break;
        case "arb":
            CONFIG = ARB_CONFIG
            break;
        case "heco":
            CONFIG = HECO_CONFIG
            break;
        case "okchain":
            CONFIG = OEC_CONFIG
            break;
        case "moonriver":
            CONFIG = MOONRIVER_CONFIG
            break;
        case "aurora":
            CONFIG = AURORA_CONFIG
            break;
        case "boba":
            CONFIG = BOBA_CONFIG
            break;
        //testnet
        case "rinkeby":
            CONFIG = RINKEBY_CONFIG
            break;
    }
    return CONFIG
}
