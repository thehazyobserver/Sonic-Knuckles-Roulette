require("@nomiclabs/hardhat-waffle");

const fs = require('fs')
const PRIVATE_KEY = fs.readFileSync(".secret").toString().trim();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000
      }
    }
  },
  mocha: {
    timeout: 144000
  },
  paths: {
    artifacts: "./src/backend/artifacts",
    sources: "./src/backend/contracts",
    cache: "./src/backend/cache",
    tests: "./src/backend/test"
  },
  defaultNetwork: "localhost",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545"
    },
    fantom: {
      url: `https://rpcapi.fantom.network`,
      chainId: 250,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    mainnet: {
      url: 'https://eth.llamarpc.com'
    },
    forkedMainnet: {

      url: "https://eth.llamarpc.com", // Replace with your Infura project ID
      blockNumber: 18866870, // Replace with the desired block number to fork from

  },
    hardhat: {
    },
  },
};