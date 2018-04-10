const HDWalletProvider = require('truffle-hdwallet-provider');
const config = require('./config/env');

const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint, 0, 10);

const infuraProvider = network => providerWithMnemonic(
  config.get('mnemonic'),
  `https://${ network }.infura.io/${ config.get('key') }`
);

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
    },
    ropsten: {
      provider: infuraProvider('ropsten'),
      network_id: 3,
      gas: 2900000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  mocha: {
    useColors: true
  }
};
