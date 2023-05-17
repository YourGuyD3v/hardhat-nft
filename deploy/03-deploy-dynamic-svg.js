const { network, ethers } = require("hardhat")
const {  developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")


module.exports = async ({getNamedAccounts, deployments}) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let ethUsdPriceFeed, ethUsdPriceFeedAddress
    
    if (developmentChains.includes(network.name)) {
        ethUsdPriceFeed = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdPriceFeed.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }

    const lowSVG = fs.readFileSync("./images/dynamicNFT/frown.svg", { encoding: "utf8" })
    const highSVG = fs.readFileSync("./images/dynamicNFT/happy.svg", { encoding: "utf8" })

    log("-------------------------------------------------------------")
    const arguments = [
        ethUsdPriceFeedAddress,
        lowSVG,
        highSVG
    ]

    const dynamicSVGNFT = await deploy("DynamicSVGNFT", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1 
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(dynamicSVGNFT.address, arguments)
        log("Verified!!")
    }
}

module.exports.tags = [ "all", "dynamicsvg", "main" ]