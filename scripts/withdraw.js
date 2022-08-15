const {getNamedAccounts, ethers} = require("hardhat")

async function main () {
  const ONE_ETH = ethers.utils.parseEther("1");
  const {deployer} = await getNamedAccounts();
  const fundMe     = await ethers.getContract("FundMe", deployer);
  const transactionResponse = await fundMe.cheaperWithdraw();
  await transactionResponse.wait(1);//on attend 1 block histoire d'être sur que notre transaction à été faite
  console.log((await ethers.provider.getBalance(fundMe.address)).toString())
}

main()
  .then(() => {process.exit(0);})
  .catch((error) => {
    console.log(error);
    process.exit(1);
  })
