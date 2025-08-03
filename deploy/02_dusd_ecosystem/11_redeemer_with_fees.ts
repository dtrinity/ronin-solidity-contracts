import { isAddress } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { getConfig } from "../../config/config";
import { ZERO_BYTES_32 } from "../../typescript/common/constants";
import { isMainnet } from "../../typescript/hardhat/deploy";
import {
  DUSD_COLLATERAL_VAULT_CONTRACT_ID,
  DUSD_REDEEMER_WITH_FEES_CONTRACT_ID,
  DUSD_TOKEN_ID,
  USD_ORACLE_AGGREGATOR_ID,
} from "../../typescript/deploy-ids";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;
  const config = await getConfig(hre);
  // Collect instructions for any manual actions required when the deployer lacks permissions.
  const manualActions: string[] = [];

  // Check all required configuration values at the top
  const dUSDConfig = config.dStables.dUSD;

  const missingConfigs: string[] = [];

  // Check dUSD configuration
  if (
    !dUSDConfig?.initialFeeReceiver ||
    !isAddress(dUSDConfig.initialFeeReceiver)
  ) {
    missingConfigs.push("dStables.dUSD.initialFeeReceiver");
  }

  if (dUSDConfig?.initialRedemptionFeeBps === undefined) {
    missingConfigs.push("dStables.dUSD.initialRedemptionFeeBps");
  }

  // If any required config values are missing, skip deployment
  if (missingConfigs.length > 0) {
    console.log(
      `⚠️  Skipping RedeemerWithFees deployment - missing configuration values: ${missingConfigs.join(", ")}`
    );
    console.log(
      `☯️  ${__filename.split("/").slice(-2).join("/")}: ⏭️  (skipped)`
    );
    return true;
  }

  // Deploy RedeemerWithFees for dUSD
  const dUSDToken = await get(DUSD_TOKEN_ID);
  const dUSDCollateralVaultDeployment = await get(
    DUSD_COLLATERAL_VAULT_CONTRACT_ID
  );
  const usdOracleAggregator = await get(USD_ORACLE_AGGREGATOR_ID);

  const dUSDRedeemerWithFeesDeployment = await deploy(
    DUSD_REDEEMER_WITH_FEES_CONTRACT_ID,
    {
      from: deployer,
      contract: "RedeemerWithFees",
      args: [
        dUSDCollateralVaultDeployment.address,
        dUSDToken.address,
        usdOracleAggregator.address,
        dUSDConfig.initialFeeReceiver,
        dUSDConfig.initialRedemptionFeeBps,
      ],
    }
  );

  const dUSDCollateralVaultContract = await hre.ethers.getContractAt(
    "CollateralVault",
    dUSDCollateralVaultDeployment.address,
    await hre.ethers.getSigner(deployer)
  );
  const dUSDWithdrawerRole =
    await dUSDCollateralVaultContract.COLLATERAL_WITHDRAWER_ROLE();
  const dUSDHasRole = await dUSDCollateralVaultContract.hasRole(
    dUSDWithdrawerRole,
    dUSDRedeemerWithFeesDeployment.address
  );
  const dUSDDeployerIsAdmin = await dUSDCollateralVaultContract.hasRole(
    await dUSDCollateralVaultContract.DEFAULT_ADMIN_ROLE(),
    deployer
  );

  if (!dUSDHasRole) {
    if (dUSDDeployerIsAdmin) {
      console.log("Granting role for dUSD RedeemerWithFees.");
      await dUSDCollateralVaultContract.grantRole(
        dUSDWithdrawerRole,
        dUSDRedeemerWithFeesDeployment.address
      );
      console.log("Role granted for dUSD RedeemerWithFees.");
    } else {
      manualActions.push(
        `CollateralVault (${dUSDCollateralVaultDeployment.address}).grantRole(COLLATERAL_WITHDRAWER_ROLE, ${dUSDRedeemerWithFeesDeployment.address})`
      );
    }
  }

  // Transfer admin roles to governance multisig (mainnet only)
  if (isMainnet(hre.network.name)) {
    const governanceAddress = config.walletAddresses.governanceMultisig;
    const DEFAULT_ADMIN_ROLE = ZERO_BYTES_32;
    const deployerSigner = await hre.ethers.getSigner(deployer);

    console.log(
      `\n🔄 Transferring RedeemerWithFees admin roles to ${governanceAddress}...`
    );

    // Transfer dUSD RedeemerWithFees admin role
    try {
      const dUSDRedeemerContract = await hre.ethers.getContractAt(
        "RedeemerWithFees",
        dUSDRedeemerWithFeesDeployment.address,
        deployerSigner
      );

      if (
        !(await dUSDRedeemerContract.hasRole(
          DEFAULT_ADMIN_ROLE,
          governanceAddress
        ))
      ) {
        await dUSDRedeemerContract.grantRole(
          DEFAULT_ADMIN_ROLE,
          governanceAddress
        );
        console.log(
          `  ➕ Granted DEFAULT_ADMIN_ROLE to ${governanceAddress} for dUSD RedeemerWithFees`
        );
      }

      if (await dUSDRedeemerContract.hasRole(DEFAULT_ADMIN_ROLE, deployer)) {
        await dUSDRedeemerContract.revokeRole(DEFAULT_ADMIN_ROLE, deployer);
        console.log(
          `  ➖ Revoked DEFAULT_ADMIN_ROLE from deployer for dUSD RedeemerWithFees`
        );
      }
    } catch (error) {
      console.error(
        `  ❌ Failed to transfer dUSD RedeemerWithFees admin role: ${error}`
      );
      manualActions.push(
        `dUSD_RedeemerWithFees (${dUSDRedeemerWithFeesDeployment.address}).grantRole(DEFAULT_ADMIN_ROLE, ${governanceAddress})`
      );
      manualActions.push(
        `dUSD_RedeemerWithFees (${dUSDRedeemerWithFeesDeployment.address}).revokeRole(DEFAULT_ADMIN_ROLE, ${deployer})`
      );
    }

    console.log("  ✅ Completed RedeemerWithFees admin role transfers");
  } else {
    console.log(
      "\n📝 Note: Admin role transfer skipped for non-mainnet network"
    );
  }

  // After processing, print any manual steps that are required.
  if (manualActions.length > 0) {
    console.log(
      "\n⚠️  Manual actions required to finalize RedeemerWithFees deployment:"
    );
    manualActions.forEach((a: string) => console.log(`   - ${a}`));
  }

  console.log(`☯️  ${__filename.split("/").slice(-2).join("/")}: ✅`);

  return true;
};

func.id = "deploy_dusd_redeemer_with_fees";
func.tags = ["dusd-ecosystem", "redeemerWithFees"];
func.dependencies = [
  DUSD_TOKEN_ID,
  DUSD_COLLATERAL_VAULT_CONTRACT_ID,
  USD_ORACLE_AGGREGATOR_ID,
];

export default func;