const {run} = require("hardhat");

const verify = async (contractAdress, args) =>{
  try{
    await run("verify:verify",{
        address : contractAdress,
        constructorArguments : args,
      });
  }catch(e){
    if(e.message.toLowerCase().includes("already verified"))
    {
      console.log("contract already verify");
    }
    else
    {
      console.log(e);
    }
  }

}

module.exports = {verify};
