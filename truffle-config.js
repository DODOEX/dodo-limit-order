/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * trufflesuite.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

var HDWalletProvider = require("@truffle/hdwallet-provider");
var privKey = process.env.privKey;
var infuraId = process.env.infuraId;
//
// const fs = require('fs');
// const mnemonic = fs.readFileSync(".secret").toString().trim();
require("ts-node/register"); // eslint-disable-line
require("dotenv-flow").config(); // eslint-disable-line

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */
  deploySwitch: {
    DEPLOY_LIMIT_ORDER: true
  },

  networks: {
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache-cli, geth or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    //
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: 5777,
      gas: 1000000000,
      gasPrice: 1,
    },

    rinkeby: {
      networkCheckTimeout: 100000,
      provider: function () {
        return new HDWalletProvider(privKey, "https://rinkeby.infura.io/v3/" + infuraId);
      },
      gas: 10000000,
      gasPrice: 1500000000,
      network_id: 4,
      skipDryRun: true
    },

    live: {
      networkCheckTimeout: 100000,
      provider: function () {
        return new HDWalletProvider({
          privateKeys: [privKey],
          providerOrUrl: "https://mainnet.infura.io/v3/" + infuraId,
          chainId: 1
        });
        // return new HDWalletProvider(privKey, "https://mainnet.infura.io/v3/" + infuraId);
      },
      gas: 500000,
      gasPrice: 75000000000,
      network_id: 1,
      skipDryRun: true
    },

    bsclive: {
      provider: function () {
        return new HDWalletProvider(privKey, "https://bsc-dataseed1.binance.org");
      },
      network_id: 56,
      confirmations: 10,
      gasPrice: 5000000000,
      timeoutBlocks: 200,
      gasPrice: 6000000000,
      skipDryRun: true
    },

    heco: {
      provider: function () {
        return new HDWalletProvider({
          privateKeys: [privKey],
          providerOrUrl: 'https://http-mainnet.hecochain.com',
          chainId: 128
        });
      },
      gas: 2000000,
      gasPrice: 3000000000,
      network_id: 128
    },

    okchain: {
      provider: function () {
        return new HDWalletProvider({
          privateKeys: [privKey],
          providerOrUrl: 'https://exchainrpc.okex.org',
          chainId: 66
        });
      },
      gas: 2000000,
      gasPrice: 3000000000,
      network_id: 66
    },

    moonriver: {
      provider: function () {
        return new HDWalletProvider({
          privateKeys: [privKey],
          providerOrUrl: 'https://rpc.moonriver.moonbeam.network',
          chainId: 1285
        });
      },
      gas: 2000000,
      gasPrice: 3000000000,
      network_id: 1285,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },

    aurora: {
      provider: function () {
        return new HDWalletProvider({
          privateKeys: [privKey],
          providerOrUrl: 'https://mainnet.aurora.dev',
          chainId: 1313161554
        });
      },
      gas: 2000000,
      gasPrice: 0,
      network_id: 1313161554,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },

    boba: {
      provider: function () {
        return new HDWalletProvider({
          privateKeys: [privKey],
          providerOrUrl: 'https://mainnet.boba.network',
          chainId: 288
        });
      },
      gas: 2000000,
      gasPrice: 10000000000,
      network_id: 288,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },

    //TODO:
    arb: {
      provider: function () {
        // return new HDWalletProvider(privKey, "https://arb1.arbitrum.io/rpc")
        return new HDWalletProvider(
          {
            privateKeys: [privKey],
            providerOrUrl: 'https://arb1.arbitrum.io/rpc',
            chainId: 42161
          }
        );
      },
      network_id: 42161,
      gas: 1500000,
      gasPrice: 1200000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },

    avax: {
      provider: () => {
        return new HDWalletProvider(
          {
            privateKeys: [privKey],
            providerOrUrl: 'https://api.avax.network/ext/bc/C/rpc',
            chainId: 43114
          }
        );
      },
      network_id: '*',
      gas: 3000000,
      gasPrice: 225000000000,
    },

    polygon: {
      networkCheckTimeout: 1000000,
      provider: () => {
        return new HDWalletProvider(
          {
            privateKeys: [privKey],
            providerOrUrl: 'https://rpc-mainnet.matic.quiknode.pro',
            chainId: 137
          }
        )
      },
      network_id: 137,
      gas: 6000000,
      gasPrice: 30000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    timeout: false,
  },
  plugins: [
    "solidity-coverage"
  ],
  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.4", // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "istanbul"
      },
    },
  },
};
