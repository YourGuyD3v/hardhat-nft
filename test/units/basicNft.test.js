const { ethers, deployments, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert } = require("chai")

!developmentChains.includes(network.name) ? describe.skip
  : describe("Basic NFT unit test", function () {
    let basicNFT, deployer

    beforeEach(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        await deployments.fixture(["basicnft"])
        basicNFT = await ethers.getContract("BasicNFT")
    })

    describe("constructor", function () {
        it("Inetializing the NFT correctly", async () => {
            const name = await basicNFT.name()
            const symbol = await basicNFT.symbol()
            const tokenCounter = await basicNFT.getTokenCounter()
            assert.equal(name, "Dogie")
            assert.equal(symbol, "DOG")
            assert.equal(tokenCounter.toString(), "0")
        })
    })

    describe("Mint NFT", function () {
        beforeEach(async () => {
            const txRespones = await basicNFT.mintNFT()
            await txRespones.wait(1)
        })
    it("Allows users to mint an NFT, and updates appropriately", async () => {
        const tokenURI = await basicNFT.tokenURI(0)
        const tokenCounter = await basicNFT.getTokenCounter()
        assert.equal(tokenURI, await basicNFT.TOKEN_URI())
        assert.equal(tokenCounter.toString(), "1")
    })

    it("Show the correct balance and owner of an NFT", async () => {
        const deployerAddress = deployer.address
        const deployerBalance = await basicNFT.balanceOf(deployerAddress)
        const owner = await basicNFT.ownerOf("0")

        assert.equal(deployerBalance.toString(), "1")
        assert.equal(owner, deployerAddress)
    })
    })
})