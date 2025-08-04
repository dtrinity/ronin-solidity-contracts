import { ZeroAddress } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ONE_PERCENT_BPS } from "../../typescript/common/bps_constants";
import { DUSD_TOKEN_ID } from "../../typescript/deploy-ids";
import {
  ORACLE_AGGREGATOR_BASE_CURRENCY_UNIT,
  ORACLE_AGGREGATOR_PRICE_DECIMALS,
} from "../../typescript/oracle_aggregator/constants";
import { Config } from "../types";

/**
 * Get the configuration for the network
 *
 * @param _hre - Hardhat Runtime Environment
 * @returns The configuration for the network
 */
export async function getConfig(
  _hre: HardhatRuntimeEnvironment
): Promise<Config> {
  // Token info will only be populated after their deployment
  const dUSDDeployment = await _hre.deployments.getOrNull(DUSD_TOKEN_ID);
  const USDCDeployment = await _hre.deployments.getOrNull("USDC");
  const USDSDeployment = await _hre.deployments.getOrNull("USDS");
  const sUSDSDeployment = await _hre.deployments.getOrNull("sUSDS");
  const frxUSDDeployment = await _hre.deployments.getOrNull("frxUSD");
  const sfrxUSDDeployment = await _hre.deployments.getOrNull("sfrxUSD");

  // Get mock oracle deployments
  const mockOracleNameToAddress: Record<string, string> = {};

  // REFACTOR: Load addresses directly using getOrNull
  const mockOracleAddressesDeployment = await _hre.deployments.getOrNull(
    "MockOracleNameToAddress"
  );

  if (mockOracleAddressesDeployment?.linkedData) {
    Object.assign(
      mockOracleNameToAddress,
      mockOracleAddressesDeployment.linkedData
    );
  } else {
    console.warn(
      "WARN: MockOracleNameToAddress deployment not found or has no linkedData. Oracle addresses might be incomplete."
    );
  }

  // Get the named accounts
  const { deployer } = await _hre.getNamedAccounts();

  return {
    MOCK_ONLY: {
      tokens: {
        USDC: {
          name: "USD Coin",
          address: USDCDeployment?.address,
          decimals: 6,
          initialSupply: 1e6,
        },
        USDS: {
          name: "USDS Stablecoin",
          address: USDSDeployment?.address,
          decimals: 18,
          initialSupply: 1e6,
        },
        sUSDS: {
          name: "Savings USDS",
          address: sUSDSDeployment?.address,
          decimals: 18,
          initialSupply: 1e6,
        },
        frxUSD: {
          name: "Frax USD",
          address: frxUSDDeployment?.address,
          decimals: 18,
          initialSupply: 1e6,
        },
        sfrxUSD: {
          name: "Staked Frax USD",
          address: sfrxUSDDeployment?.address,
          decimals: 18,
          initialSupply: 1e6,
        },
      },
    },
    tokenAddresses: {
      dUSD: emptyStringIfUndefined(dUSDDeployment?.address),
    },
    walletAddresses: {
      governanceMultisig: deployer,
    },
    dStables: {
      dUSD: {
        collaterals: [
          USDCDeployment?.address || ZeroAddress,
          USDSDeployment?.address || ZeroAddress,
          sUSDSDeployment?.address || ZeroAddress,
          frxUSDDeployment?.address || ZeroAddress,
          sfrxUSDDeployment?.address || ZeroAddress,
        ],
        initialFeeReceiver: deployer,
        initialRedemptionFeeBps: 0.4 * ONE_PERCENT_BPS, // Default for stablecoins
        collateralRedemptionFees: {
          // Stablecoins: 0.4%
          [USDCDeployment?.address || ZeroAddress]: 0.4 * ONE_PERCENT_BPS,
          [USDSDeployment?.address || ZeroAddress]: 0.4 * ONE_PERCENT_BPS,
          [frxUSDDeployment?.address || ZeroAddress]: 0.4 * ONE_PERCENT_BPS,
          // Yield bearing stablecoins: 0.5%
          [sUSDSDeployment?.address || ZeroAddress]: 0.5 * ONE_PERCENT_BPS,
          [sfrxUSDDeployment?.address || ZeroAddress]: 0.5 * ONE_PERCENT_BPS,
        },
      },
    },
    oracleAggregators: {
      USD: {
        hardDStablePeg: 1n * ORACLE_AGGREGATOR_BASE_CURRENCY_UNIT,
        priceDecimals: ORACLE_AGGREGATOR_PRICE_DECIMALS,
        baseCurrency: ZeroAddress,
        api3OracleAssets: {
          plainApi3OracleWrappers: {
            [dUSDDeployment?.address || ""]:
              mockOracleNameToAddress["dUSD_USD"],
            [USDCDeployment?.address || ""]:
              mockOracleNameToAddress["USDC_USD"],
            [USDSDeployment?.address || ""]:
              mockOracleNameToAddress["USDS_USD"],
            [frxUSDDeployment?.address || ""]:
              mockOracleNameToAddress["frxUSD_USD"],
          },
          api3OracleWrappersWithThresholding: {},
          compositeApi3OracleWrappersWithThresholding: {
            // Yield-bearing tokens need composite feeds: underlying * yield_rate
            [sUSDSDeployment?.address || ""]: {
              feedAsset: sUSDSDeployment?.address || "",
              proxy1: mockOracleNameToAddress["USDS_USD"], // USDS/USD
              proxy2: mockOracleNameToAddress["sUSDS_USDS"], // sUSDS/USDS rate
              lowerThresholdInBase1: 0n,
              fixedPriceInBase1: 0n,
              lowerThresholdInBase2: 0n,
              fixedPriceInBase2: 0n,
            },
            [sfrxUSDDeployment?.address || ""]: {
              feedAsset: sfrxUSDDeployment?.address || "",
              proxy1: mockOracleNameToAddress["frxUSD_USD"], // frxUSD/USD
              proxy2: mockOracleNameToAddress["sfrxUSD_frxUSD"], // sfrxUSD/frxUSD rate
              lowerThresholdInBase1: 0n,
              fixedPriceInBase1: 0n,
              lowerThresholdInBase2: 0n,
              fixedPriceInBase2: 0n,
            },
          },
        },
      },
    },
  };
}

/**
 * Return an empty string if the value is undefined
 *
 * @param value - The value to check
 * @returns An empty string if the value is undefined, otherwise the value itself
 */
function emptyStringIfUndefined(value: string | undefined): string {
  return value || "";
}
