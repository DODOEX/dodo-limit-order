import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {SEPOLIA_CONFIG as networkConfig} from '../../config/sepolia-config';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const needVerify = true;

  const owner = networkConfig.Owner;
  const insurance = networkConfig.Insurance;
  const dodoApprove = networkConfig.DODOApprove;
  const dodoApproveProxy = networkConfig.DODOApproveProxy;

  const {deployer} = await getNamedAccounts();

  const deployResult = await deploy('DODOGaslessTrading', {
    from: deployer,
    args: [owner, insurance, dodoApprove, dodoApproveProxy],
    log: true,
  });

  if (needVerify) {
    const deployedAddress = deployResult.address;
    await hre.run("verify:verify", {
      address: deployedAddress,
      constructorArguments: [owner, insurance, dodoApprove, dodoApproveProxy],
    });
  }
};
export default func;
func.tags = ['GaslessTrading', 'GaslessTrading_deploy'];