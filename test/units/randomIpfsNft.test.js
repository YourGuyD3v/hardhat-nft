const { network, ethers, deployments } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name) ? describe.skip 
: describe("Randon Nft unit test", function () {
    let randomNft, vrfCoordinatorV2Mock, deployer

    beforeEach(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        await deployments.fixture(["mocks", "randomipfs"])
        randomNft = await ethers.getContract("RandomNFT")
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
    })

    describe("constructor", function () {
        it("set starting values correctly", async () => {
            const dogTokenUri = await randomNft.getDogTokenUris(0)
            const mintFee = await randomNft.getMintFee()
            assert.equal(dogTokenUri, "ipfs://QmQs4yASJakykKzcUYiJoQEFptCuufghNA3S5J2CkD47tp")
            assert.equal(mintFee.toString(), networkConfig[chainId]["mintFee"])
        })

        describe("requestNft", function () {
            it("reverts when enough ETH not sent", async () => {
                await expect(randomNft.requestNft()).to.be.revertedWith("RandomIpfsNft__NotEnoughEthSent");
            })

            it("emits an event and kicks off a random word request", async () => {
                const fee = await randomNft.getMintFee()
                await expect(randomNft.requestNft({ value: fee.toString() })).to.emit(randomNft,
                    "NftRequested")
            })

            describe("fulfillRandomWords", function () {
                it("mints NFT after random number is returned", async () => {
                  await new Promise(async(reject, resolve) => {
                    randomNft.once("NftMinted", async () => {
                        try {
                            const tokenUri = await randomNft.getDogTokenUris("0")
                            const tokenCounter = await randomNft.getTokenCounter()
                            assert.equal(tokenUri.toString().includes("ipfs://QmQs4yASJakykKzcUYiJoQEFptCuufghNA3S5J2CkD47tp"), true)
                            assert.equal(tokenCounter.toString(), "0")
                            resolve()
                        } catch (e) {
                            console.log(e)
                            reject(e)
                        }

                        try {
                            const fee = await randomNft.getMintFee()
                            const response = await randomNft.requestNft({value: fee})
                            const responseReciept = await response.wait(1)
                            await vrfCoordinatorV2Mock.fulfillRandomWords(response.events[1].args.requestId, 
                                randomNft)

                        } catch {}
                    })
                  }) 
                })
            })

            describe("getBreedFromModdedRng", function () {
                it("should return pug if moddedRng < 10", async () => {
                    const expectedValue = await randomNft.getBreedFromModdedRng(7)
                    assert.equal(expectedValue, "0")
                })

                it("should return shiba-inu if moddedRng i between 10 - 30", async () => {
                    const expectedValue = await randomNft.getBreedFromModdedRng(27)
                    assert.equal(expectedValue, "1")
                })

                it("should return st-bernad if moddedRng i between 40 - 100", async () => {
                    const expectedValue = await randomNft.getBreedFromModdedRng(76)
                    assert.equal(expectedValue, "2")
                })

                it("should reverts if modded value is > 99", async () => {
                    await expect(randomNft.getBreedFromModdedRng(100)).to.be.revertedWith(
                        "RandomIpfsNft__RangeOutOfBounds"
                    )
                })

                describe("withdraw", function () {
                    it("only owner can withdraw", async () => {
                        const randomNftConnectedContract = await randomNft.connect(accounts[1])
                        await expect(randomNftConnectedContract.withdraw()).to.be.revertedWith("RandomIpfsNft__tranferFailed")
                    })
                })
            })
        })
    })
})