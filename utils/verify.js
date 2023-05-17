const { run } = require("hardhat")

const verify = async (contractAddress, args) => {
    console.log("Verifying, Please wait...")
    try{

    } catch (e) {
        if (e.message.toLowerCase().includes("Already verified!")) {
            console.log("Already verified!")
        } else {
            console.log(e)
        }
    } 
    await run("verify:verify", {
        address: contractAddress,
        constructorArguments: args
    })
}

module.exports = { verify }