// This is a Solidity smart contract that creates a random NFT (non-fungible token) using Chainlink's VRF (Verifiable Random Function) and the ERC721 standard. The contract allows users to request a random NFT by calling the `requestNft()` function, which generates a random number using Chainlink's VRF and mints a new NFT with a unique token ID. The breed of the NFT is determined by the random number generated, which is mapped to a specific breed using a chance array. The contract also includes a `tokenURI()` function that returns the metadata for a given token ID. The SPDX-License-Identifier comment at the top of the contract specifies the license under which the contract is released.
// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NotEnoughEthSent();
error RandomIpfsNft__tranferFailed();

contract RandomNFT is VRFConsumerBaseV2, ERC721URIStorage,  Ownable {

    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BERNARD 
    }

VRFCoordinatorV2Interface private immutable i_vrfCoordinatorV2;
bytes32 private immutable i_keyHash;
uint64 private immutable i_subscriptionId;
uint32 private immutable i_callbackGasLimit;
uint32 private constant NUM_WORDS = 1;
uint16 private constant REQUEST_CONFIRMATIONS = 3;

mapping (uint256 => address) s_requestIdToSender;

uint256 public s_tokenCounter;
uint256 internal constant MAX_CHANCE_VALUE = 100;
string[] internal s_dogTokenUris;
uint256 internal immutable i_mintFee;

event NftRequested(uint256 indexed requestId, address indexed requester);
event NftMinter(Breed dogBreed, address minter);

    constructor(address vrfCoordinatorV2,
     uint64 subscriptionId,
                bytes32 keyHash,
                uint16 callbackGasLimit,
                uint256 mintFee,
                string[3] memory dogTokenUris
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random Ipfs Nft", "RIN"){
        i_vrfCoordinatorV2 = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_keyHash = keyHash;
        i_callbackGasLimit = callbackGasLimit;
        s_dogTokenUris = dogTokenUris;
        i_mintFee = mintFee;
    }

    function requestNft() public  payable returns (uint256 requestId){
         if (msg.value < i_mintFee){
            revert RandomIpfsNft__NotEnoughEthSent();
        }
         requestId = i_vrfCoordinatorV2.requestRandomWords(
            i_keyHash,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

   // This function is called by Chainlink's VRF Coordinator contract when a random number is generated and returned to the smart contract. It takes in the requestId and an array of randomWords as parameters. It then retrieves the address of the user who requested the NFT using the requestId, mints a new NFT with a unique token ID, and assigns it to the user. The breed of the NFT is determined by taking the first element of the randomWords array and calculating its modulus with the MAX_CHANCE_VALUE constant. This moddedRng value is then used to determine the breed of the NFT using a chance array.
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address dogOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        Breed dogBreed = getBreedFromModdedRng(moddedRng);
        s_tokenCounter += s_tokenCounter;
        _safeMint(dogOwner, newTokenId);
        _setTokenURI(newTokenId, s_dogTokenUris[uint256(dogBreed)]);
        emit NftMinter(dogBreed, dogOwner);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) { revert RandomIpfsNft__tranferFailed(); }
    }

    function getBreedFromModdedRng(uint256 moddedRng) public pure returns (Breed) {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (moddedRng >= cumulativeSum && moddedRng < cumulativeSum + chanceArray[i]) {
                return Breed(i);
            }
            cumulativeSum = chanceArray[i];
        }
        revert RandomIpfsNft__RangeOutOfBounds(); 
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 20, MAX_CHANCE_VALUE];
    }

        function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getDogTokenUris(uint256 index) public view returns (string memory) {
        return s_dogTokenUris[index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}