//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

//on import l'ABI (la declaration des fonction de AggregatorV3) sinon les fonction comme latestRoundData()
//ne seront pas comprise par le compilo ...
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

//toutes les fonctions d'une librarie doivent être en mode : internal
//les libraries ne doivent pas contenir d'instance de quoi que ce soit (ni même des uint...)...
library PriceConverter {

    function gePrice(AggregatorV3Interface priceFeed) internal view returns(int256)
    {
        //les fonctions dans l'interface seront implémenté grâce à l'adresse 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        //qui est l'adresse du SM present dans le testNET RINKEBY
        (,int256 ETHPrice,,,) = priceFeed.latestRoundData();

        //je dois multiplier par 1e10 car ETHPrice est précis a 8 decimal seulement
        //pour le mettre a niveau avec les unité de wei pour la suite je dois lui ajouter 10 zéro
        //voir fonction decimals dans l'interface AggregatorV3Interface.sol
        return ETHPrice * 1e10;
    }

    function getConversionRate(uint256 amountETH, AggregatorV3Interface priceFeed) internal view returns(uint256)
    {
        int256 ETHPrice = gePrice(priceFeed);
        //ensolidity on ne travail pas avec des floatant pour ne pas perdre en precision c'est pourquoi on
        //garde que l'ont travail pricipalement avec des WEI dans les code...
        //ici on divise pas 1e18 pour passer amountETH de wei en eth
        //ex 1_000000000000000000 wei --> 1 eth
        return (uint256(ETHPrice) * amountETH) / 1e18;
    }
}
