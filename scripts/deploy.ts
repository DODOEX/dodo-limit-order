import { ethers } from "hardhat";

async function main() {
  const accounts = await ethers.getSigners()
  // use local accounts for testing
  const multisigner = accounts[1].address
  const insurance = accounts[2].address
  const dodoApprove = accounts[3].address
  const dodoApproveProxy = accounts[4].address
  const RfqOrderBot = await ethers.getContractFactory("DODORfqOrderBot");
  const bot = await RfqOrderBot.deploy(multisigner, insurance, dodoApprove, dodoApproveProxy);

  await bot.deployed();

  console.log("RFQ bot deployed to:", bot.address);

  console.log(`owner is ${await bot.owner()}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
