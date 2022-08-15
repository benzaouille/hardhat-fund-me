const {deployments, ethers, getNamedAccounts} = require("hardhat")
const {assert, expect} = require("chai");
const {developmentChains} = require("../../helper-hardhat-config.js");

!developmentChains.includes(network.name) ? describe.skip :
describe("FundMe unit test", function () {
    //Starting with deploying the fundM & mock contrat because we are on local network
    let fundMe;
    let mock;
    let deployer;
    const ONE_ETH = ethers.utils.parseEther("1"); //1ETH = 1 ether.. c'est mieux que de l'écrire en wei -> 1000000000000000000000
      beforeEach("deploying the contract", async function() {
      deployer = (await getNamedAccounts()).deployer;
      await deployments.fixture(["all"]);
      fundMe = await ethers.getContract("FundMe", deployer);
      mock = await ethers.getContract("MockV3Aggregator", deployer);
      //what is the difference bettwen deployments.get & ethers.getContract ?
    })

    describe("constructor test", function () {
      it("check if priceFeed is on the good address", async function (){
        //test of the constructor
        const response = await fundMe.getPriceFeed()
        assert.equal(response, mock.address);
      })
    })

    describe("fund function test", function () {
      beforeEach("fund the contract with the fund function", async function () {
        await fundMe.fund({value : ONE_ETH});
      })

      it("testing the require condition", async function () {
        await expect(fundMe.fund()).to.be.revertedWith("did not send the requiere amount of USD !");
      })
      it("testing the funders data", async function () {
        const response = await fundMe.getFunders(0);
        assert.equal(response, deployer);
      })
      it("testing the address to amount data", async function () {
        const address2Wei = await fundMe.getAdresseToAmountWei(deployer);
        assert.equal(address2Wei.toString(), ONE_ETH);
      })
    })

    describe("test the withdrawal function", function() {
      let provider;
      beforeEach("fund the contract with the fund function", async function () {
        provider = ethers.provider;
        await fundMe.fund({value : ONE_ETH});
      })

      it("check if the amount withdraw is totally (less gas) send to deployer", async function () {
        const ethInContractBeforeWithdraw = await provider.getBalance(fundMe.address);
        const ethInDeployerBeforeWithdraw = await provider.getBalance(deployer);

        const transactionResponse = await fundMe.withdraw();
        const transactionReceipt  = await transactionResponse.wait(1);
        const {gasUsed, effectiveGasPrice} = transactionReceipt;
        const gasCost = gasUsed.mul(effectiveGasPrice); //on utilise .mul parce que ce sont des BigNumber

        const ethInContractAfterWithdraw = await provider.getBalance(fundMe.address);
        const ethInDeployerAfterWithdraw = await provider.getBalance(deployer);

        assert.equal(ethInContractAfterWithdraw.toString(), "0");
        assert.equal((ethInDeployerBeforeWithdraw.add(ethInContractBeforeWithdraw)).toString(), (ethInDeployerAfterWithdraw.add(gasCost)).toString());
      })

      it("Testing the withdraw function with many funders", async function () {
        const accounts = await ethers.getSigners();
        for(let i = 0; i < 6 ; i++){
          const account = accounts[i];
          const fundMeConnectedSigner_i = await fundMe.connect(account); //parce que avant cette boucle c'est deployer qui est connecté seulement
          await fundMeConnectedSigner_i.fund({value : ONE_ETH});
        }

        //withdraw algo
        const transactionResponse = await fundMe.withdraw();
        const transactionReceipt  = await transactionResponse.wait(1);
        const {gasUsed, effectiveGasPrice} = transactionReceipt;
        const gasCost = gasUsed.mul(effectiveGasPrice);

        await expect(fundMe.getFunders(0)).to.be.reverted;

        for(let i = 0; i < 6 ; i++){
          assert.equal(await fundMe.getAdresseToAmountWei(accounts[i].address), 0);
        }
      })
    })

    //if we execute the test like that cheaper Withdrawal function will cost more than just cheaper because
    //the gaz reporter will check the first call to withdraw and the first one only have one funder compared to the one below
    //comment "check if the amount withdraw is totally (less gas) send to deployer" to see the difference
    describe("cheaper Withdrawal (optimization)", function () {
      //the contract will have 6 ETH
      beforeEach("fund the contract with many signer", async function () {
        const accounts = await ethers.getSigners();
        for(let i = 0 ; i < 6 ; i++){
          const accountConnectContract = await fundMe.connect(accounts[i]);
          const transactionResponse = await accountConnectContract.fund({value : ONE_ETH});
          const transactionReceipt  = transactionResponse.wait(1); //waiting one block
        }
      })

      it("cheaper withdrawal function test", async function() {
        const transactionResponse = await fundMe.cheaperWithdraw();
        const transactionReceipt  = await transactionResponse.wait(1);

        await expect(fundMe.getFunders(0)).to.be.reverted;
      })
    })
})

/*
Question : pk faire le wait(1) car de toute maniere avant on utilise un await !
question a propos du fixture et de ethers.getContract...
*/
