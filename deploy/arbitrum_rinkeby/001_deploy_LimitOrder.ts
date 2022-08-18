import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const {deployer} = await getNamedAccounts();

  const deployResult = await deploy('DODOLimitOrder', {
    from: deployer,
    log: true,
  });
  // const deployedAddress = deployResult.address;
  // await hre.run("verify:verify", {
  //   address: deployedAddress,
  // });
};
export default func;
func.tags = ['LimitOrder', 'LimitOrder_deploy'];