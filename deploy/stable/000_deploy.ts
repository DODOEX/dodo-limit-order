import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { STABLE_CONFIG as config } from "../../config/stable-config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await main();

  async function main() {
    // await deploySETTLEXLimitOrder();
    // await deploySETTLEXLimitOrderBot();
    // await setupSETTLEXLimitOrder();
    await setupSETTLEXLimitOrderBot();
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

  async function deploySETTLEXLimitOrder() {
    await deployContract("SETTLEXLimitOrder", "SETTLEXLimitOrder", []);
  }

  async function deploySETTLEXLimitOrderBot() {
    await deployContract("SETTLEXLimitOrderBot", "SETTLEXLimitOrderBot", []);
  }

  async function setupSETTLEXLimitOrder() {
    const contractAddress = config.SETTLEXLimitOrder;
    const SETTLEXLimitOrder = await ethers.getContractAt("SETTLEXLimitOrder", contractAddress);
    console.log("SETTLEXLimitOrder.init()...");
    await SETTLEXLimitOrder.init(deployer, config.SETTLEXApproveProxy, config.FeeReceiver);
    console.log("SETTLEXLimitOrder.addWhiteList()...");
    await SETTLEXLimitOrder.addWhiteList(config.SETTLEXLimitOrderBot);
  }

  async function setupSETTLEXLimitOrderBot() {
    const contractAddress = config.SETTLEXLimitOrderBot;
    const SETTLEXLimitOrderBot = await ethers.getContractAt("SETTLEXLimitOrderBot", contractAddress);
    console.log("SETTLEXLimitOrderBot.init()...");
    await SETTLEXLimitOrderBot.init(
      deployer,
      config.SETTLEXLimitOrder,
      config.FeeReceiver,
      config.SETTLEXApprove
    );
    console.log("SETTLEXLimitOrderBot.addAdminList()...");
    await SETTLEXLimitOrderBot.addAdminList(config.Admin);
  }
};

export default func;
