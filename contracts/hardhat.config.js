require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    nexus: {
      url: "https://testnet3.rpc.nexus.xyz",
      chainId: 3940,
      accounts: process.env.NEXUS_PRIVATE_KEY ? [process.env.NEXUS_PRIVATE_KEY] : [],
      timeout: 60000, // 60 seconds
      httpHeaders: {
        "User-Agent": "hardhat"
      }
    },
  },
};