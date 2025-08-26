import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { getConfig } from "../../config/config";
import {
  DUSD_COLLATERAL_VAULT_CONTRACT_ID,
  DUSD_REDEEMER_V2_CONTRACT_ID,
  DUSD_REDEEMER_WITH_FEES_CONTRACT_ID,
  DUSD_TOKEN_ID,
  USD_ORACLE_AGGREGATOR_ID,
} from "../../typescript/deploy-ids";
import { ensureDefaultAdminExistsAndRevokeFrom } from "../../typescript/hardhat/access_control";
import { GovernanceExecutor } from "../../typescript/hardhat/governance";
import { SafeTransactionData } from "../../typescript/safe/types";

const ZERO_BYTES_32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Build Safe transaction data for AccessControl.grantRole.
 *
 * @param contractAddress Contract address to call
 * @param role Role identifier (bytes32) to grant
 * @param grantee Address that should receive the role
 * @param contractInterface Interface used to encode the function call
 * @returns Safe transaction data for grantRole
 */
function createGrantRoleTransaction(
  contractAddress: string,
  role: string,
  grantee: string,
  contractInterface: any,
): SafeTransactionData {
  return {
    to: contractAddress,
    value: "0",
    data: contractInterface.encodeFunctionData("grantRole", [role, grantee]),
  };
}

/**
 * Build Safe transaction data for AccessControl.revokeRole.
 *
 * @param contractAddress Contract address to call
 * @param role Role identifier (bytes32) to revoke
 * @param account Account from which the role will be revoked
 * @param contractInterface Interface used to encode the function call
 * @returns Safe transaction data for revokeRole
 */
function createRevokeRoleTransaction(
  contractAddress: string,
  role: string,
  account: string,
  contractInterface: any,
): SafeTransactionData {
  return {
    to: contractAddress,
    value: "0",
    data: contractInterface.encodeFunctionData("revokeRole", [role, account]),
  };
}

/**
 * Migrate roles to governance multisig (always idempotent)
 *
 * @param hre HardhatRuntimeEnvironment
 * @param redeemerAddress Address of the RedeemerV2 contract
 * @param deployerAddress Address of the deployer
 * @param governanceMultisig Address of the governance multisig
 * @param executor Governance executor helper for direct/queued execution
 * @returns True if complete, false if pending governance
 */
async function migrateRedeemerRolesIdempotent(
  hre: HardhatRuntimeEnvironment,
  redeemerAddress: string,
  deployerAddress: string,
  governanceMultisig: string,
  executor: GovernanceExecutor,
): Promise<boolean> {
  const deployerSigner = await hre.ethers.getSigner(deployerAddress);
  const redeemer = await hre.ethers.getContractAt(
    "RedeemerV2",
    redeemerAddress,
    deployerSigner,
  );
  const DEFAULT_ADMIN_ROLE = ZERO_BYTES_32;
  const REDEMPTION_MANAGER_ROLE = await redeemer.REDEMPTION_MANAGER_ROLE();
  const PAUSER_ROLE = await redeemer.PAUSER_ROLE();

  const roles = [
    { name: "DEFAULT_ADMIN_ROLE", hash: DEFAULT_ADMIN_ROLE },
    { name: "REDEMPTION_MANAGER_ROLE", hash: REDEMPTION_MANAGER_ROLE },
    { name: "PAUSER_ROLE", hash: PAUSER_ROLE },
  ];

  let allComplete = true;

  for (const role of roles) {
    if (!(await redeemer.hasRole(role.hash, governanceMultisig))) {
      const complete = await executor.tryOrQueue(
        async () => {
          await redeemer.grantRole(role.hash, governanceMultisig);
          console.log(`    ➕ Granted ${role.name} to ${governanceMultisig}`);
        },
        () =>
          createGrantRoleTransaction(
            redeemerAddress,
            role.hash,
            governanceMultisig,
            redeemer.interface,
          ),
      );
      if (!complete) allComplete = false;
    } else {
      console.log(
        `    ✓ ${role.name} already granted to ${governanceMultisig}`,
      );
    }
  }

  // Revoke roles from deployer to mirror realistic governance
  for (const role of [REDEMPTION_MANAGER_ROLE, PAUSER_ROLE]) {
    if (await redeemer.hasRole(role, deployerAddress)) {
      const complete = await executor.tryOrQueue(
        async () => {
          await redeemer.revokeRole(role, deployerAddress);
          console.log(`    ➖ Revoked ${role} from deployer`);
        },
        () =>
          createRevokeRoleTransaction(
            redeemerAddress,
            role,
            deployerAddress,
            redeemer.interface,
          ),
      );
      if (!complete) allComplete = false;
    }
  }

  // Safely migrate DEFAULT_ADMIN_ROLE away from deployer
  try {
    await ensureDefaultAdminExistsAndRevokeFrom(
      hre,
      "RedeemerV2",
      redeemerAddress,
      governanceMultisig,
      deployerAddress,
      await hre.ethers.getSigner(deployerAddress),
      undefined,
      executor,
    );
  } catch {
    // In Safe mode, consider admin migration pending
    allComplete = false;
  }
  return allComplete;
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers } = hre;
  const { deployer } = await hre.getNamedAccounts();
  const config = await getConfig(hre);
  const deployerSigner = await ethers.getSigner(deployer);
  const executor = new GovernanceExecutor(
    hre,
    deployerSigner,
    config.safeConfig,
  );
  await executor.initialize();

  console.log(`\n=== Deploy RedeemerV2 for dUSD ===`);

  const { address: oracle } = await deployments.get(USD_ORACLE_AGGREGATOR_ID);
  const { address: vault } = await deployments.get(
    DUSD_COLLATERAL_VAULT_CONTRACT_ID,
  );

  const tokenAddress = (config as any).tokenAddresses.dUSD;
  const stableCfg = (config as any).dStables?.dUSD;
  const initialFeeReceiver = stableCfg?.initialFeeReceiver || deployer;
  const initialRedemptionFeeBps =
    stableCfg?.initialRedemptionFeeBps !== undefined
      ? stableCfg.initialRedemptionFeeBps
      : 0;

  const result = await deployments.deploy(DUSD_REDEEMER_V2_CONTRACT_ID, {
    from: deployer,
    args: [
      vault,
      tokenAddress,
      oracle,
      initialFeeReceiver,
      initialRedemptionFeeBps,
    ],
    contract: "RedeemerV2",
    autoMine: true,
    log: false,
  });

  if (result.newlyDeployed) {
    console.log(
      `  ✅ Deployed ${DUSD_REDEEMER_V2_CONTRACT_ID} at ${result.address}`,
    );
  } else {
    console.log(
      `  ✓ ${DUSD_REDEEMER_V2_CONTRACT_ID} already at ${result.address}`,
    );
  }

  // Grant vault withdraw permission to new redeemer and revoke from old redeemer
  let vaultRoleComplete = true;

  try {
    const vaultContract = await hre.ethers.getContractAt(
      "CollateralHolderVault",
      vault,
      await hre.ethers.getSigner(deployer),
    );
    const WITHDRAWER_ROLE = await vaultContract.COLLATERAL_WITHDRAWER_ROLE();

    if (!(await vaultContract.hasRole(WITHDRAWER_ROLE, result.address))) {
      const complete = await executor.tryOrQueue(
        async () => {
          await vaultContract.grantRole(WITHDRAWER_ROLE, result.address);
          console.log(
            `    ➕ Granted COLLATERAL_WITHDRAWER_ROLE to new redeemer ${result.address}`,
          );
        },
        () =>
          createGrantRoleTransaction(
            vault,
            WITHDRAWER_ROLE,
            result.address,
            vaultContract.interface,
          ),
      );
      if (!complete) vaultRoleComplete = false;
    }
    // Revoke role from any legacy redeemer deployments (only RedeemerWithFees exists on Ronin)
    const legacyRedeemerIds = [DUSD_REDEEMER_WITH_FEES_CONTRACT_ID];

    for (const legacyId of legacyRedeemerIds) {
      const legacyDeployment = await deployments.getOrNull(legacyId);

      if (
        legacyDeployment &&
        legacyDeployment.address.toLowerCase() !==
          result.address.toLowerCase() &&
        (await vaultContract.hasRole(WITHDRAWER_ROLE, legacyDeployment.address))
      ) {
        const complete = await executor.tryOrQueue(
          async () => {
            await vaultContract.revokeRole(
              WITHDRAWER_ROLE,
              legacyDeployment.address,
            );
            console.log(
              `    ➖ Revoked COLLATERAL_WITHDRAWER_ROLE from legacy ${legacyId} at ${legacyDeployment.address}`,
            );
          },
          () =>
            createRevokeRoleTransaction(
              vault,
              WITHDRAWER_ROLE,
              legacyDeployment.address,
              vaultContract.interface,
            ),
        );
        if (!complete) vaultRoleComplete = false;
      }
    }
  } catch (e) {
    console.log(
      `    ⚠️ Could not update vault withdrawer roles: ${(e as Error).message}`,
    );
    vaultRoleComplete = false;
  }

  // Post-deploy configuration no longer needed for fee receiver and default fee,
  // as they are provided via constructor.

  // Note: We intentionally do not modify roles on the legacy Redeemer contract to avoid unnecessary gas.

  // Migrate roles to governance multisig (idempotent)
  // In test mode, skip role migration to avoid breaking tests
  let rolesComplete = true;
  if (executor.useSafe) {
    rolesComplete = await migrateRedeemerRolesIdempotent(
      hre,
      result.address,
      deployer,
      config.walletAddresses.governanceMultisig,
      executor,
    );
  } else {
    console.log("  📄 Skipping role migration in test mode");
  }

  // Check if all operations completed
  if (!(vaultRoleComplete && rolesComplete)) {
    await executor.flush("Setup RedeemerV2: governance operations");
    console.log(
      "\n⏳ Some operations require governance signatures to complete.",
    );
    console.log(
      "   Re-run the script after the Safe batch is executed to finalize.",
    );
    console.log(
      `\n≻ ${__filename.split("/").slice(-2).join("/")}: pending governance ⏳`,
    );
    return false;
  }

  console.log(`\n≻ ${__filename.split("/").slice(-2).join("/")}: ✅`);
  return true;
};

func.id = "05_2_setup_redeemerv2";
func.tags = ["setup-issuerv2", "setup-redeemerv2"];
func.dependencies = [
  DUSD_COLLATERAL_VAULT_CONTRACT_ID,
  DUSD_TOKEN_ID,
  USD_ORACLE_AGGREGATOR_ID,
];

export default func;
