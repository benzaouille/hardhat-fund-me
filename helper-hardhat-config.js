//Ce ficher va nous permettre d'acceder aux adresses des diffenrent réseaux des ethusd selon le network sur lequel on travail
const networkConfig = {
  4 : {
    name : "rinkeby",
    ethUsdPriceFeedAddress : "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
  },
  137 : {
    name : "polygon",
    ethUsdPriceFeedAddress : "...",
  },
}

const developmentChains = ["hardhat", "localhost"];

const DECIMAL = 8;
const INITIAL_ANSWER = 20000000000;

module.exports = {
  networkConfig,
  developmentChains,
  DECIMAL,
  INITIAL_ANSWER,
}
