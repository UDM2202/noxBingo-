require("@nomicfoundation/hardhat-toolbox");

const PK = process.env.PRIVATE_KEY || "";

module.exports = {
  solidity: { version: "0.8.20", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    amoy: {
      url: "https://polygon-amoy-bor-rpc.publicnode.com",
      chainId: 80002,
      accounts: [PK],
      timeout: 60000,
    },
  },
};
