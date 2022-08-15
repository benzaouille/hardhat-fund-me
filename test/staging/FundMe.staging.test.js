const {getNamedAccounts, ethers, network} = require("hardhat");
const {assert, expect} = require("chai");
const {developmentChains} = require("../../helper-hardhat-config.js");

developmentChains.includes(network.name) ? describe.skip :
describe("testing FundMe SM on test network", function () {
  let fundMe;
  beforeEach("send ETH to the FundMe SM", async function () {
    const {deployer} = await getNamedAccounts();
    //inutile de deployer parceque dans les test staging les contract sont deja deployé
    //on interargit directement avec eux viex des script
    //(vu que l'ont travail sur un reseaux type rinkeby mainnet... pas besoin de mocks)
    //on va retrouver le contract et on va pouvoir utiliser les fonctions onlyOwner
    //car on lui passe le bon deployer (celui avec le quel le contract a été déployé)
    fundMe = await ethers.getContract("FundMe", deployer);
    const ONE_ETH = ethers.utils.parseEther("1"); //regarder FundMe.test.js
  })

  it("withdraw all the ETH from the contrat", async function () {
    const transactionResponse = await fundMe.cheaperWithdraw();
    const transactionReceipt = await transactionResponse.wait(1);

    await expect(fundMe.getFunders(0)).to.be.reverted;
  })
})
