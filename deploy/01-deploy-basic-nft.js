const { network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({getNamedAccounts, deployments}) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    arguments = []
    const basicNFT = await deploy("BasicNFT", {
        from: deployer,
        args: arguments,
        log: true
    })
    log(`Deployed at ${basicNFT.address}`)
    log("--------------------------------------")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(basicNFT.address, arguments)
        log("Verified!!")
    }
}

module.exports.tags = ["all", "basicnft"]