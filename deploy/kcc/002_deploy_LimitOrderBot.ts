import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const needVerify = false;

  const {deployer} = await getNamedAccounts();

  const deployResult = await deploy('DODOLimitOrderBot', {
    from: deployer,
    log: true,
  });
  if (needVerify) {
    const deployedAddress = deployResult.address;
    await hre.run("verify:verify", {
      address: deployedAddress,
    });
  }
};
export default func;
func.tags = ['LimitOrderBot', 'LimitOrderBot_deploy'];