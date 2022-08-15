const {networkConfig, developmentChains} = require("../helper-hardhat-config.js");
const {verify} = require("../utils/verify");

module.exports = async (hre) => {
  const { getNamedAccounts, deployments } = hre;
  const {deploy, log} = deployments;
  const {deployer} = await getNamedAccounts();
  const chainId = hre.network.config.chainId;

  let ethUsdPriceFeedAddress;
  //il faut voir si on deploy nos contracts dans une chain de devellopement type hardhat, localhost ou bien
  //si on deploi sur rinkeby, le mainnet ect ... parce que on utilise des function de chainlink seulement disponible sur
  //les chains rinkeby, mainnet, ropstein ...
  //si on deploy sur une chain de development type hardhat ou localhost on deploys un mock (contrat hardcodé lié à chainlink ..)
  if(developmentChains.includes(hre.network.name))
  {
    const ethUsdAggregator = await deployments.get('MockV3Aggregator');
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  }
  else
  {
      ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeedAddress"];
  }
  console.log("-----------------------------------------------------------------");
  const fundMe = await deploy('FundMe', {
    from : deployer,
    args : [ethUsdPriceFeedAddress],
    log : true,
    waitConfirmations : network.config.blockConfirmations || 1,
  });
  console.log("FundMe contracts is deployed");

  //the contract will be verify if we are on test or mainet network..
  if(!developmentChains.includes(hre.network.name) && process.env.ETHERSCAN_API_KEY)
  {
    //verify with the verify.js on utils
    await verify(fundMe.address, [ethUsdPriceFeedAddress]);
  }
  console.log("-----------------------------------------------------------------");
}


module.exports.tags = ['all', 'fundMe']
