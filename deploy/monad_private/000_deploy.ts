import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { MONAD_PRIVATE_MAINNET_CONFIG as config } from "../../config/monad-private-mainnet-config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await main();

  async function main() {
    // await deploySIGMAXLimitOrder();
    // await deploySIGMAXLimitOrderBot();
    // await setupSIGMAXLimitOrder();
    // await setupSIGMAXLimitOrderBot();
  }

  async function deployContract(name: string, contract: string, args: any[]) {
    if (!config[name as keyof typeof config] || config[name as keyof typeof config] == "") {
      console.log("Deploying contract:", name);
      const deployResult = await deploy(contract, {
        from: deployer,
        args: args,
        log: true,
      });
      await verifyContract(deployResult.address, args);
      return deployResult.address;
    } else {
      console.log("Fetch previous deployed address for", name, config[name as keyof typeof config]);
      return config[name as keyof typeof config];
    }
  }

  async function verifyContract(address: string, args?: any[]) {
    if (typeof args == "undefined") {
      args = [];
    }
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: args,
      });
    } catch (e) {
      if (e instanceof Error) {
        if (e.message != "Contract source code already verified") {
          throw e;
        }
        console.log(e.message);
      }
    }
  }

  async function deploySIGMAXLimitOrder() {
    await deployContract("SIGMAXLimitOrder", "SIGMAXLimitOrder", []);
  }

  async function deploySIGMAXLimitOrderBot() {
    await deployContract("SIGMAXLimitOrderBot", "SIGMAXLimitOrderBot", []);
  }

  async function setupSIGMAXLimitOrder() {
    const contractAddress = config.SIGMAXLimitOrder;
    const SIGMAXLimitOrder = await ethers.getContractAt("SIGMAXLimitOrder", contractAddress);
    console.log("SIGMAXLimitOrder.init()...");
    await SIGMAXLimitOrder.init(deployer, config.SIGMAXApproveProxy, config.FeeReceiver);
    console.log("SIGMAXLimitOrder.addWhiteList()...");
    await SIGMAXLimitOrder.addWhiteList(config.SIGMAXLimitOrderBot);
  }

  async function setupSIGMAXLimitOrderBot() {
    const contractAddress = config.SIGMAXLimitOrderBot;
    const SIGMAXLimitOrderBot = await ethers.getContractAt("SIGMAXLimitOrderBot", contractAddress);
    console.log("SIGMAXLimitOrderBot.init()...");
    await SIGMAXLimitOrderBot.init(
      deployer,
      config.SIGMAXLimitOrder,
      config.FeeReceiver,
      config.SIGMAXApprove
    );
    console.log("SIGMAXLimitOrderBot.addAdminList()...");
    await SIGMAXLimitOrderBot.addAdminList(config.Admin);
  }
};

export default func;
