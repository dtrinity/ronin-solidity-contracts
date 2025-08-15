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

const ZERO_BYTES_32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Ensure the given `grantee` holds MINTER_ROLE on the specified dStable token.
 * Idempotent: grants the role only if it is not already present.
 *
 * @param hre Hardhat runtime environment
 * @param stableAddress Address of the ERC20StablecoinUpgradeable token
 * @param grantee Address that should be granted MINTER_ROLE
 * @param manualActions
 */
async function ensureMinterRole(
  hre: HardhatRuntimeEnvironment,
  stableAddress: string,
  grantee: string,
  manualActions?: string[],
): Promise<void> {
  const stable = await hre.ethers.getContractAt(
    "ERC20StablecoinUpgradeable",
    stableAddress,
  );
  const MINTER_ROLE = await stable.MINTER_ROLE();

  if (!(await stable.hasRole(MINTER_ROLE, grantee))) {
    try {
      await stable.grantRole(MINTER_ROLE, grantee);
      console.log(`    ➕ Granted MINTER_ROLE to ${grantee}`);
    } catch (e) {
      console.log(
        `    ⚠️ Could not grant MINTER_ROLE to ${grantee}: ${(e as Error).message}`,
      );
      manualActions?.push(
        `ERC20StablecoinUpgradeable (${stableAddress}).grantRole(MINTER_ROLE, ${grantee})`,
      );
    }
  } else {
    console.log(`    ✓ MINTER_ROLE already granted to ${grantee}`);
  }
}

/**
 * Migrate IssuerV2 roles to governance in a safe, idempotent sequence.
 * Grants roles to governance first, then revokes them from the deployer.
 *
 * @param hre Hardhat runtime environment
 * @param issuerName Logical name/id of the issuer deployment
 * @param issuerAddress Address of the IssuerV2 contract
 * @param deployerSigner Deployer signer currently holding roles
 * @param governanceMultisig Governance multisig address to receive roles
 * @param manualActions
 */
async function migrateIssuerRolesIdempotent(
  hre: HardhatRuntimeEnvironment,
  issuerName: string,
  issuerAddress: string,
  deployerSigner: Signer,
  governanceMultisig: string,
  manualActions?: string[],
): Promise<void> {
  const issuer = await hre.ethers.getContractAt(
    "IssuerV2",
    issuerAddress,
    deployerSigner,
  );

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

  for (const role of roles) {
    if (!(await issuer.hasRole(role.hash, governanceMultisig))) {
      try {
        await issuer.grantRole(role.hash, governanceMultisig);
        console.log(`    ➕ Granted ${role.name} to ${governanceMultisig}`);
      } catch (e) {
        console.log(
          `    ⚠️ Could not grant ${role.name} to ${governanceMultisig}: ${(e as Error).message}`,
        );
        manualActions?.push(
          `${issuerName} (${issuerAddress}).grantRole(${role.name}, ${governanceMultisig})`,
        );
      }
    } else {
      console.log(
        `    ✓ ${role.name} already granted to ${governanceMultisig}`,
      );
    }
  }

  // After ensuring governance has roles, revoke from deployer in a safe order
  const deployerAddress = await deployerSigner.getAddress();

  // Revoke roles from deployer to mirror realistic mainnet governance where deployer is not the governor
  for (const role of [AMO_MANAGER_ROLE, INCENTIVES_MANAGER_ROLE, PAUSER_ROLE]) {
    if (await issuer.hasRole(role, deployerAddress)) {
      try {
        await issuer.revokeRole(role, deployerAddress);
        console.log(`    ➖ Revoked ${role} from deployer`);
      } catch (e) {
        console.log(
          `    ⚠️ Could not revoke role ${role} from deployer: ${(e as Error).message}`,
        );
        const roleName =
          role === AMO_MANAGER_ROLE
            ? "AMO_MANAGER_ROLE"
            : role === INCENTIVES_MANAGER_ROLE
              ? "INCENTIVES_MANAGER_ROLE"
              : "PAUSER_ROLE";
        manualActions?.push(
          `${issuerName} (${issuerAddress}).revokeRole(${roleName}, ${deployerAddress})`,
        );
      }
    }
  }
  // Safely migrate DEFAULT_ADMIN_ROLE away from deployer
  await ensureDefaultAdminExistsAndRevokeFrom(
    hre,
    "IssuerV2",
    issuerAddress,
    governanceMultisig,
    deployerAddress,
    deployerSigner,
    manualActions,
  );
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, ethers } = hre;
  const { deployer } = await hre.getNamedAccounts();
  const deployerSigner = await ethers.getSigner(deployer);
  const config = await getConfig(hre);
  const manualActions: string[] = [];

  console.log(`\n=== Upgrading Issuer for dUSD ===`);

  const oldDeployment = await deployments.getOrNull(DUSD_ISSUER_CONTRACT_ID);

  if (!oldDeployment) {
    console.log(
      `  ⚠️ Old issuer ${DUSD_ISSUER_CONTRACT_ID} not found. Skipping dUSD.`,
    );
    return false;
  }

  // Resolve dependency addresses
  const { address: oracleAggregatorAddress } = await deployments.get(
    USD_ORACLE_AGGREGATOR_ID,
  );
  const { address: collateralVaultAddress } = await deployments.get(
    DUSD_COLLATERAL_VAULT_CONTRACT_ID,
  );
  const { address: amoManagerAddress } =
    await deployments.get(DUSD_AMO_MANAGER_ID);
  const tokenAddress = (config as any).tokenAddresses.dUSD;

  // Deploy new IssuerV2 if not already deployed
  const result = await deployments.deploy(DUSD_ISSUER_V2_CONTRACT_ID, {
    from: deployer,
    args: [
      collateralVaultAddress,
      tokenAddress,
      oracleAggregatorAddress,
      amoManagerAddress,
    ],
    contract: "IssuerV2",
    autoMine: true,
    log: false,
  });

  if (result.newlyDeployed) {
    console.log(
      `  ✅ Deployed ${DUSD_ISSUER_V2_CONTRACT_ID} at ${result.address}`,
    );
  } else {
    console.log(
      `  ✓ ${DUSD_ISSUER_V2_CONTRACT_ID} already deployed at ${result.address}`,
    );
  }

  const newIssuerAddress = result.address;

  // Note: Ronin doesn't have wstkscUSD, so we skip that section that was present in sonic

  // Grant MINTER_ROLE on the token to the new issuer (idempotent)
  await ensureMinterRole(hre, tokenAddress, newIssuerAddress, manualActions);

  // Revoke MINTER_ROLE from the old issuer, but only after the new issuer has it
  try {
    const stable = await hre.ethers.getContractAt(
      "ERC20StablecoinUpgradeable",
      tokenAddress,
    );
    const MINTER_ROLE = await stable.MINTER_ROLE();

    if (
      oldDeployment.address.toLowerCase() !== newIssuerAddress.toLowerCase() &&
      (await stable.hasRole(MINTER_ROLE, oldDeployment.address))
    ) {
      try {
        await stable.revokeRole(MINTER_ROLE, oldDeployment.address);
        console.log(
          `    ➖ Revoked MINTER_ROLE from old issuer ${oldDeployment.address}`,
        );
      } catch (e) {
        console.log(
          `    ⚠️ Could not revoke MINTER_ROLE from old issuer: ${(e as Error).message}`,
        );
        manualActions.push(
          `ERC20StablecoinUpgradeable (${tokenAddress}).revokeRole(MINTER_ROLE, ${oldDeployment.address})`,
        );
      }
    } else {
      console.log(
        `    ✓ Old issuer ${oldDeployment.address} does not have MINTER_ROLE or equals new issuer`,
      );
    }
  } catch (e) {
    console.log(
      `    ⚠️ Could not check/revoke MINTER_ROLE on old issuer: ${(e as Error).message}`,
    );
    manualActions.push(
      `ERC20StablecoinUpgradeable (${tokenAddress}).revokeRole(MINTER_ROLE, ${oldDeployment.address})`,
    );
  }

  // Migrate roles to governance multisig (always idempotent)
  await migrateIssuerRolesIdempotent(
    hre,
    DUSD_ISSUER_V2_CONTRACT_ID,
    newIssuerAddress,
    deployerSigner,
    config.walletAddresses.governanceMultisig,
    manualActions,
  );

  // Optional: keep old issuer operational until governance flips references
  console.log(
    `  ℹ️ New issuer ${DUSD_ISSUER_V2_CONTRACT_ID} deployed and permissioned. Ensure dApp/services reference ${newIssuerAddress}.`,
  );

  // Print manual actions, if any
  if (manualActions.length > 0) {
    console.log("\n⚠️  Manual actions required to finalize IssuerV2 setup:");
    manualActions.forEach((a: string) => console.log(`   - ${a}`));
  }

  console.log(`\n≻ ${__filename.split("/").slice(-2).join("/")}: ✅`);
  return true;
};

func.id = "05_1_setup_issuerv2";
func.tags = ["setup-issuerv2"];
func.dependencies = [
  DUSD_COLLATERAL_VAULT_CONTRACT_ID,
  DUSD_TOKEN_ID,
  USD_ORACLE_AGGREGATOR_ID,
  DUSD_AMO_MANAGER_ID,
];

export default func;
