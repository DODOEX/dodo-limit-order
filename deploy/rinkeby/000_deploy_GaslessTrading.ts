import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {RINKEBY_CONFIG as networkConfig} from '../../config/rinkeby-config';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const owner = networkConfig.Owner;
  const insurance = networkConfig.Insurance;
  const dodoApprove = networkConfig.DODOApprove;
  const dodoApproveProxy = networkConfig.DODOApproveProxy;

  const {deployer} = await getNamedAccounts();

  await deploy('DODOGaslessTrading', {
    from: deployer,
    args: [owner, insurance, dodoApprove, dodoApproveProxy],
    log: true,
  });
};
export default func;
func.tags = ['GaslessTrading', 'GaslessTrading_deploy'];