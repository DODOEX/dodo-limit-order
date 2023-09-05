import * as dotenv from 'dotenv';
dotenv.config();
import { readFileSync } from 'fs';
import * as toml from 'toml';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import { HardhatUserConfig, subtask } from 'hardhat/config';
import { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } from 'hardhat/builtin-tasks/task-names';
import "hardhat-deploy"
import { ethers } from "ethers"

// default values here to avoid failures when running hardhat
const RINKEBY_RPC = process.env.RINKEBY_RPC || '1'.repeat(32);
const PRIVATE_KEY = process.env.PRIVATE_KEY || '1'.repeat(64);
const TRUFFLE_DASHBOARD_RPC = "http://localhost:24012/rpc";
const SOLC_DEFAULT = '0.8.4';

// try use forge config
let foundry: any;
try {
  foundry = toml.parse(readFileSync('./foundry.toml').toString());
  foundry.default.solc = foundry.default['solc-version']
    ? foundry.default['solc-version']
    : SOLC_DEFAULT;
} catch (error) {
  foundry = {
    default: {
      solc: SOLC_DEFAULT,
    }
  }
}

// prune forge style tests from hardhat paths
subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS)
  .setAction(async (_, __, runSuper) => {
    const paths = await runSuper();
    return paths.filter((p: string) => !p.endsWith('.t.sol'));
  });

const config: HardhatUserConfig = {
  paths: {
    cache: 'cache-hardhat',
    sources: './src',
    tests: './integration',
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: { chainId: 1337 },
    rinkeby: {
      url: RINKEBY_RPC,
      chainId: 4,
      accounts: [PRIVATE_KEY],
      deploy: ["./deploy/rinkeby/"],
    },
    arbitrum: {
      url: TRUFFLE_DASHBOARD_RPC,
      chainId: 42161,
      deploy: ["./deploy/arbitrum/"],
    },
    arbi_testnet: {
      url: TRUFFLE_DASHBOARD_RPC,
      chainId: 421611,
      deploy: ["./deploy/arbitrum_rinkeby/"],
    },
    polygon: {
      url: TRUFFLE_DASHBOARD_RPC,
      chainId: 137,
      deploy: ["./deploy/polygon/"],
    },
    bsc: {
      url: TRUFFLE_DASHBOARD_RPC,
      chainId: 56,
      deploy: ["./deploy/bsc/"],
    },
    eth: {
      url: TRUFFLE_DASHBOARD_RPC,
      chainId: 1,
      deploy: ["./deploy/eth/"],
    },
    goerli: {
      url: TRUFFLE_DASHBOARD_RPC,
      chainId: 5,
      deploy: ["./deploy/goerli/"],
    },
    kcc: {
      url: TRUFFLE_DASHBOARD_RPC,
      chainId: 321,
      deploy: ["./deploy/kcc/"],
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  solidity: {
    version: foundry.default?.solc || SOLC_DEFAULT,
    settings: {
      optimizer: {
        enabled: foundry.default?.optimizer || true,
        runs: foundry.default?.optimizer_runs || 200,
      },
    },
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 77,
    excludeContracts: ['src/test'],
    // API key for CoinMarketCap. https://pro.coinmarketcap.com/signup
    coinmarketcap: process.env.CMC_KEY ?? '',
  },
  etherscan: {
    // API key for Etherscan. https://etherscan.io/
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY ?? '',
      eth: process.env.ETHERSCAN_API_KEY ?? '',
      arbitrumOne: process.env.ARBITRUM_API_KEY ?? '',
      arbi_testnet: "9RSHRSVHJYZA631TN23NXDD14E3EY7I1VW",
      polygon: process.env.POLYGON_API_KEY ?? '',
      bsc: process.env.BSC_API_KEY ?? '',
      goerli: "TRGAKHZ7J913ZX5KAAU491FK5MMKH3P9EN",
      kcc: "9l0cX20NCc2EHAF3VjN6"
    },
    customChains: [
      {
        network: "arbi_testnet",
        chainId: 421611,
        urls: {
          apiURL: "https://api-testnet.arbiscan.io/api",
          browserURL: "https://testnet.arbiscan.io/"
        }
      },
      {
        network: "goerli",
        chainId: 5,
        urls: {
          apiURL: "https://api-goerli.etherscan.io/api",
          browserURL: "https://goerli.etherscan.io/"
        }
      },
      {
        network: "kcc",
        chainId: 321,
        urls: {
          apiURL: "https://api.explorer.kcc.io/vipapi",
          browserURL: "https://explorer.kcc.io/"
        }
      }
    ]
  },
};

export default config;
