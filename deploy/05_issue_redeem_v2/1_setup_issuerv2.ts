import { Signer } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { getConfig } from "../../config/config";
import {
  DUSD_AMO_MANAGER_ID,
  DUSD_COLLATERAL_VAULT_CONTRACT_ID,
  DUSD_ISSUER_CONTRACT_ID,
  DUSD_ISSUER_V2_CONTRACT_ID,
  DUSD_TOKEN_ID,
  USD_ORACLE_AGGREGATOR_ID,
} from "../../typescript/deploy-ids";
import { ensureDefaultAdminExistsAndRevokeFrom } from "../../typescript/hardhat/access_control";
import { GovernanceExecutor } from "../../typescript/hardhat/governance";
import { SafeTransactionData } from "../../typescript/safe/types";

const ZERO_BYTES_32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Build Safe transaction data for AccessControl.grantRole.
 *
 * @param contractAddress Contract address to call
 * @param role Role identifier (bytes32) to grant
 * @param grantee Address that should receive the role
 * @param contractInterface Interface used to encode the function call
 * @returns Safe transaction data for grantRole
 */
function createGrantRoleTransaction(contractAddress: string, role: string, grantee: string, contractInterface: any): SafeTransactionData {
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
function createRevokeRoleTransaction(contractAddress: string, role: string, account: string, contractInterface: any): SafeTransactionData {
  return {
    to: contractAddress,
    value: "0",
    data: contractInterface.encodeFunctionData("revokeRole", [role, account]),
  };
}

/**
 * Ensure the given `grantee` holds MINTER_ROLE on the specified dUSD token.
 * Grants if missing, or queues a Safe transaction if in Safe mode.
 *
 * @param hre Hardhat runtime environment
 * @param stableAddress Address of the dUSD token (AccessControl-enabled)
 * @param grantee Address that should be granted MINTER_ROLE
 * @param executor Governance executor helper for direct/queued execution
 * @returns True if complete, false if pending governance
 */
async function ensureMinterRole(
  hre: HardhatRuntimeEnvironment,
  stableAddress: string,
  grantee: string,
  executor: GovernanceExecutor,
): Promise<boolean> {
  // Attach to an AccessControl-enabled token (dUSD)
  // Use the deployer signer who should have DEFAULT_ADMIN_ROLE
  const { deployer } = await hre.getNamedAccounts();
  const deployerSigner = await hre.ethers.getSigner(deployer);
  const stable = await hre.ethers.getContractAt("ERC20StablecoinUpgradeable", stableAddress, deployerSigner);
  const MINTER_ROLE = await stable.MINTER_ROLE();

  if (!(await stable.hasRole(MINTER_ROLE, grantee))) {
    const complete = await executor.tryOrQueue(
      async () => {
        await stable.grantRole(MINTER_ROLE, grantee);
        console.log(`    ➕ Granted MINTER_ROLE to ${grantee}`);
      },
      () => createGrantRoleTransaction(stableAddress, MINTER_ROLE, grantee, stable.interface),
    );
    return complete;
  } else {
    console.log(`    ✓ MINTER_ROLE already granted to ${grantee}`);
    return true;
  }
}

/**
 * Migrate IssuerV2 roles to governance in a safe, idempotent sequence.
 * Grants roles to governance first, then revokes them from the deployer.
 *
 * @param hre Hardhat runtime environment
 * @param issuerName Logical name/id used for logging
 * @param issuerAddress Address of the IssuerV2 contract
 * @param deployerSigner Deployer signer currently holding roles
 * @param governanceMultisig Governance multisig address to receive roles
 * @param executor Governance executor helper for direct/queued execution
 * @returns True if complete, false if pending governance
 */
async function migrateIssuerRolesIdempotent(
  hre: HardhatRuntimeEnvironment,
  issuerName: string,
  issuerAddress: string,
  deployerSigner: Signer,
  governanceMultisig: string,
  executor: GovernanceExecutor,
): Promise<boolean> {
  const issuer = await hre.ethers.getContractAt("IssuerV2", issuerAddress, deployerSigner);

  const DEFAULT_ADMIN_ROLE = ZERO_BYTES_32;
  const AMO_MANAGER_ROLE = await issuer.AMO_MANAGER_ROLE();
  const INCENTIVES_MANAGER_ROLE = await issuer.INCENTIVES_MANAGER_ROLE();
  const PAUSER_ROLE = await issuer.PAUSER_ROLE();

  const roles = [
    { name: "DEFAULT_ADMIN_ROLE", hash: DEFAULT_ADMIN_ROLE },
    { name: "AMO_MANAGER_ROLE", hash: AMO_MANAGER_ROLE },
    { name: "INCENTIVES_MANAGER_ROLE", hash: INCENTIVES_MANAGER_ROLE },
    { name: "PAUSER_ROLE", hash: PAUSER_ROLE },
  ];

  console.log(`  📄 Migrating roles for ${issuerName} at ${issuerAddress}`);

  let allComplete = true;

  for (const role of roles) {
    if (!(await issuer.hasRole(role.hash, governanceMultisig))) {
      const complete = await executor.tryOrQueue(
        async () => {
          await issuer.grantRole(role.hash, governanceMultisig);
          console.log(`    ➕ Granted ${role.name} to ${governanceMultisig}`);
        },
        () => createGrantRoleTransaction(issuerAddress, role.hash, governanceMultisig, issuer.interface),
      );
      if (!complete) allComplete = false;
    } else {
      console.log(`    ✓ ${role.name} already granted to ${governanceMultisig}`);
    }
  }

  // After ensuring governance has roles, revoke from deployer in a safe order
  const deployerAddress = await deployerSigner.getAddress();

  // Revoke roles from deployer to mirror realistic mainnet governance where deployer is not the governor
  // Only revoke if governance already has the role (following Sonic pattern)
  // Skip revocation if deployer and governance are the same address (common in test environments)
  const shouldRevokeFromDeployer = deployerAddress.toLowerCase() !== governanceMultisig.toLowerCase();

  if (shouldRevokeFromDeployer) {
    for (const role of [AMO_MANAGER_ROLE, INCENTIVES_MANAGER_ROLE, PAUSER_ROLE]) {
      const deployerHasRole = await issuer.hasRole(role, deployerAddress);
      const governanceHasRole = await issuer.hasRole(role, governanceMultisig);

      if (deployerHasRole && governanceHasRole) {
        const complete = await executor.tryOrQueue(
          async () => {
            await issuer.revokeRole(role, deployerAddress);
            console.log(`    ➖ Revoked ${role} from deployer`);
          },
          () => createRevokeRoleTransaction(issuerAddress, role, deployerAddress, issuer.interface),
        );
        if (!complete) allComplete = false;
      }
    }
  }

  // Safely migrate DEFAULT_ADMIN_ROLE away from deployer
  // Skip if deployer and governance are the same (would result in losing admin)
  if (shouldRevokeFromDeployer) {
    try {
      await ensureDefaultAdminExistsAndRevokeFrom(
        hre,
        "IssuerV2",
        issuerAddress,
        governanceMultisig,
        deployerAddress,
        deployerSigner,
        undefined,
        executor,
      );
    } catch {
      // In Safe mode, consider admin migration pending
      allComplete = false;
    }
  }
  return allComplete;
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers } = hre;
  const { deployer } = await hre.getNamedAccounts();
  const deployerSigner = await ethers.getSigner(deployer);
  const config = await getConfig(hre);
  const executor = new GovernanceExecutor(hre, deployerSigner, config.safeConfig);
  await executor.initialize();

  console.log(`\n=== Upgrading Issuer for dUSD ===`);

  const oldDeployment = await deployments.getOrNull(DUSD_ISSUER_CONTRACT_ID);

  if (!oldDeployment) {
    console.log(`  ⚠️ Old issuer ${DUSD_ISSUER_CONTRACT_ID} not found. Skipping dUSD.`);
    return false;
  }

  // Resolve dependency addresses
  const { address: oracleAggregatorAddress } = await deployments.get(USD_ORACLE_AGGREGATOR_ID);
  const { address: collateralVaultAddress } = await deployments.get(DUSD_COLLATERAL_VAULT_CONTRACT_ID);
  const { address: amoManagerAddress } = await deployments.get(DUSD_AMO_MANAGER_ID);
  const tokenAddress = (config as any).tokenAddresses.dUSD;

  // Deploy new IssuerV2 if not already deployed
  const result = await deployments.deploy(DUSD_ISSUER_V2_CONTRACT_ID, {
    from: deployer,
    args: [collateralVaultAddress, tokenAddress, oracleAggregatorAddress, amoManagerAddress],
    contract: "IssuerV2",
    autoMine: true,
    log: false,
  });

  if (result.newlyDeployed) {
    console.log(`  ✅ Deployed ${DUSD_ISSUER_V2_CONTRACT_ID} at ${result.address}`);
  } else {
    console.log(`  ✓ ${DUSD_ISSUER_V2_CONTRACT_ID} already deployed at ${result.address}`);
  }

  const newIssuerAddress = result.address;

  // Note: Ronin doesn't have wstkscUSD, so we skip that section that was present in sonic

  // Grant MINTER_ROLE on the token to the new issuer (idempotent)
  const minterComplete = await ensureMinterRole(hre, tokenAddress, newIssuerAddress, executor);

  // Revoke MINTER_ROLE from the old issuer, but only after the new issuer has it
  try {
    const stable = await hre.ethers.getContractAt("ERC20StablecoinUpgradeable", tokenAddress);
    const MINTER_ROLE = await stable.MINTER_ROLE();

    if (
      oldDeployment.address.toLowerCase() !== newIssuerAddress.toLowerCase() &&
      (await stable.hasRole(MINTER_ROLE, oldDeployment.address))
    ) {
      const complete = await executor.tryOrQueue(
        async () => {
          await stable.revokeRole(MINTER_ROLE, oldDeployment.address);
          console.log(`    ➖ Revoked MINTER_ROLE from old issuer ${oldDeployment.address}`);
        },
        () => createRevokeRoleTransaction(tokenAddress, MINTER_ROLE, oldDeployment.address, stable.interface),
      );

      if (!complete) {
        // pending governance
      }
    } else {
      console.log(`    ✓ Old issuer ${oldDeployment.address} does not have MINTER_ROLE or equals new issuer`);
    }
  } catch (e) {
    console.log(`    ⚠️ Could not check/revoke MINTER_ROLE on old issuer: ${(e as Error).message}`);
  }

  // Migrate roles to governance multisig (always idempotent)
  const rolesComplete = await migrateIssuerRolesIdempotent(
    hre,
    DUSD_ISSUER_V2_CONTRACT_ID,
    newIssuerAddress,
    deployerSigner,
    config.walletAddresses.governanceMultisig,
    executor,
  );

  // Optional: keep old issuer operational until governance flips references
  console.log(
    `  ℹ️ New issuer ${DUSD_ISSUER_V2_CONTRACT_ID} deployed and permissioned. Ensure dApp/services reference ${newIssuerAddress}.`,
  );

  // Print manual actions, if any
  if (!(minterComplete && rolesComplete)) {
    await executor.flush("Setup IssuerV2: governance operations");
    console.log("\n⏳ Some operations require governance signatures to complete.");
    console.log("   Re-run the script after the Safe batch is executed to finalize.");
    console.log(`\n≻ ${__filename.split("/").slice(-2).join("/")}: pending governance ⏳`);
    return false;
  }

  console.log(`\n≻ ${__filename.split("/").slice(-2).join("/")}: ✅`);
  return true;
};

func.id = "05_1_setup_issuerv2";
func.tags = ["setup-issuerv2"];
func.dependencies = [DUSD_COLLATERAL_VAULT_CONTRACT_ID, DUSD_TOKEN_ID, USD_ORACLE_AGGREGATOR_ID, DUSD_AMO_MANAGER_ID];

export default func;
