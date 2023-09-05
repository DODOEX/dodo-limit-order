import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { POLYGON_CONFIG as config } from "../../config/polygon-config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await main();

  async function main() {
    await deployLimitOrder();
    await deployLimitOrderBot();
    await setupLimitOrder();
    await setupLimitOrderBot();
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

  async function deployLimitOrder() {
    await deployContract("DODOLimitOrder", "DODOLimitOrder", []);
  }

  async function deployLimitOrderBot() {
    await deployContract("DODOLimitOrderBot", "DODOLimitOrderBot", []);
  }

  async function setupLimitOrder() {
    const contractAddress = config.DODOLimitOrder;
    const DODOLimitOrder = await ethers.getContractAt("DODOLimitOrder", contractAddress);
    console.log("DODOLimitOrder.init()...");
    await DODOLimitOrder.init(deployer, config.DODOApproveProxy, config.FeeReceiver);
    console.log("DODOLimitOrder.addWhiteList()...");
    await DODOLimitOrder.addWhiteList(config.DODOLimitOrderBot);
  }

  async function setupLimitOrderBot() {
    const contractAddress = config.DODOLimitOrderBot;
    const DODOLimitOrderBot = await ethers.getContractAt("DODOLimitOrderBot", contractAddress);
    console.log("DODOLimitOrderBot.init()...");
    await DODOLimitOrderBot.init(
      deployer,
      config.DODOLimitOrder,
      config.FeeReceiver,
      config.DODOApprove
    );
    console.log("DODOLimitOrderBot.addAdminList()...");
    await DODOLimitOrderBot.addAdminList(config.Admin);
  }
};

export default func;
