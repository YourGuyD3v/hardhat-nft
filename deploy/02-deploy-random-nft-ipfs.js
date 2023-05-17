const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")

const imagesLocation = "./images/randomNft/"

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "cuteness",
            value: 100,
        }
    ]
}

let tokenUris = [
    "ipfs://QmQs4yASJakykKzcUYiJoQEFptCuufghNA3S5J2CkD47tp",
    "ipfs://QmXry9jwWVKfbt6V87Gzd97WJ5LGAmtyWY7znSQXCRysv9",
    "ipfs://QmX5V7Xc31vMfM8tYgrNefix1WCFmiMqpLzjDtk6PgTQd2"
      ]

const FUND_AMOUNT = "1000000000000000000000"

module.exports = async ({getNamedAccounts, deployments}) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    chainId = network.config.chainId

    if (process.env.UPLOAD_TO_PINATA == "true"){
        tokenUris = await handleTokenUris()
    }

    let vrfCoordinatorAddress, subcriptionId

    if (chainId == 31337) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorAddress = vrfCoordinatorV2Mock.address
        const tx = await vrfCoordinatorV2Mock.createSubscription()
        const txReciept = await tx.wait(1)
        subcriptionId = await txReciept.events[0].args.subId
        await vrfCoordinatorV2Mock.fundSubscription(subcriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorAddress = networkConfig[chainId].vrfCordinatorV2
        subcriptionId = networkConfig[chainId].subscriptionId
    }
    // console.log(`1. ${networkConfig[chainId].vrfCordinatorV2}
    //     2. ${networkConfig[chainId].subcriptionId}
    //     3. ${networkConfig[chainId]["keyHash"]}
    //     4. ${networkConfig[chainId]["callbackGasLimit"]}
    //     5. ${networkConfig[chainId]["mintFee"]}
    //     6. ${tokenUris},`
    //     )

    log("------------------------------------------------------")

    const arguments = [
        vrfCoordinatorAddress,
        subcriptionId,
        networkConfig[chainId]["keyHash"],
        networkConfig[chainId]["callbackGasLimit"],
        networkConfig[chainId]["mintFee"],
        tokenUris,
    ]

    const randomNft = await deploy("RandomNFT", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })

    log("------------------------------------------------------")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(randomNft.address, arguments)
        log("Verified!!")
    }

    async function handleTokenUris() {
        tokenUris = []
        const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
        for (imageUploadResponseIndex in imageUploadResponses) {
        let tokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        console.log(`Uploading ${tokenUriMetadata.name}...`)
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
        }
        console.log("Token Uris uploaded! they are:")
        console.log(tokenUris)
        return tokenUris
    }
}

module.exports.tags = ["all", "randomipfs", "main"]