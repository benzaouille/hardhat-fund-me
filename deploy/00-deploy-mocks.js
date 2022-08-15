const {networkConfig, developmentChains, DECIMAL, INITIAL_ANSWER} = require("../helper-hardhat-config.js");

module.exports = async (hre) => {
  const { getNamedAccounts, deployments } = hre;
  const {deploy, log} = deployments;
  const {deployer} = await getNamedAccounts();
  const chainId = hre.network.config.chainId;

  const mocks = await deploy('MockV3Aggregator', {
    from : deployer,
    args : [DECIMAL, INITIAL_ANSWER],
    log : true,
  });
}


module.exports.tags = ['all', 'mocks']
