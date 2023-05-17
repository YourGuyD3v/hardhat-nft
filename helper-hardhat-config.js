const { ethers } = require("hardhat")

networkConfig = {
    31337: {
        name: "hardhat",
        mintFee: ethers.utils.parseEther("0.1"), // 0.1 Eth
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // 30 gwei
        subscriptionId: "1402",
        callbackGasLimit: "50000", // 500,000 GAS
        interval: "30",
    },

    11155111: {
        name: "sepolia",
        vrfCordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        mintFee: ethers.utils.parseEther("0.1"), // 0.1 Eth
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // 30 gwei
        subscriptionId: "1402",
        callbackGasLimit: "50000", // 500.000 Gas
        interval: "30",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306"
    }
}

const DECIMALS = "18"
const INITIAL_PRICE = "200000000000000000000"
const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_PRICE
}