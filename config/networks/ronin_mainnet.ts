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
  const dUSDDeployment = await _hre.deployments.getOrNull(DUSD_TOKEN_ID);

  // Token addresses
  const USDC_ADDRESS = "0x0b7007c13325c48911f73a2dad5fa5dcbf808adc";

  // Safe wallet on Ronin mainnet
  const governanceSafeMultisig = "0x8fe3Bea6660709dA8a6dc0533B66DDc051c088Bf";

  return {
    tokenAddresses: {
      dUSD: emptyStringIfUndefined(dUSDDeployment?.address),
    },
    walletAddresses: {
      governanceMultisig: governanceSafeMultisig,
    },
    dStables: {
      dUSD: {
        collaterals: [USDC_ADDRESS],
        initialFeeReceiver: governanceSafeMultisig,
        initialRedemptionFeeBps: 0.4 * ONE_PERCENT_BPS,
        collateralRedemptionFees: {},
      },
    },
    oracleAggregators: {
      USD: {
        baseCurrency: ZeroAddress, // USD
        hardDStablePeg: ORACLE_AGGREGATOR_BASE_CURRENCY_UNIT,
        priceDecimals: ORACLE_AGGREGATOR_PRICE_DECIMALS,
        api3OracleAssets: {
          plainApi3OracleWrappers: {},
          api3OracleWrappersWithThresholding: {
            [USDC_ADDRESS]: {
              proxy: "0xf061d556F5136263c4d66d9fFCADE8Ab43a3a704", // Add API3 USDC/USD
              lowerThreshold: ORACLE_AGGREGATOR_BASE_CURRENCY_UNIT,
              fixedPrice: ORACLE_AGGREGATOR_BASE_CURRENCY_UNIT,
            },
          },
          compositeApi3OracleWrappersWithThresholding: {},
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
