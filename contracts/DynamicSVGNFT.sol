// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";

contract DynamicSVGNFT is ERC721 {

    uint256 private s_tokenCounters;
    string private i_lowImageUrl;
    string private i_highImageUrl;
    string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";
    AggregatorV3Interface internal immutable i_priceFeed;
    mapping( uint256 => int256 ) public s_tokenIdToHighValue;

    event createdNFT(uint256 indexed tokenId, int256 highValue);

    constructor(address priceFeedAddress,
    string memory lowSvg, string memory highSvg) ERC721("Dynamic SVG NFT", "DSN") {
        s_tokenCounters = 0;
        i_lowImageUrl = svgToImageUrl(lowSvg);
        i_highImageUrl = svgToImageUrl(highSvg);
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function svgToImageUrl(string memory svg) public pure returns (string memory) {
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string( abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded ));
    }

    function mintNFT(int256 highValue) public {
        s_tokenIdToHighValue[s_tokenCounters] = highValue;
        s_tokenCounters += s_tokenCounters; 
        _safeMint(msg.sender, s_tokenCounters);
        emit createdNFT(s_tokenCounters, highValue);
          
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI Query for nonexistent token");

        ( , int price , , , ) = i_priceFeed.latestRoundData();
        string memory imageURI = i_lowImageUrl;
        if ( price >= s_tokenIdToHighValue[tokenId] ) {
            imageURI = i_highImageUrl;
        }

        return (string(abi.encodePacked( _baseURI(), Base64.encode(bytes(abi.encodePacked('{"name":"', name(), '", "description": "An NFT that changes based on the Chainlink Feed", ',
     '"attributes": [{"trait_type:" "coolness", "value": 100}], "image":"',
     imageURI,'"}'
          )
       )
     )
        )
        )
        );
    }
}