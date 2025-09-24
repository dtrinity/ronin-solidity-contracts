import { HardhatRuntimeEnvironment } from "hardhat/types";

import { getConfig as getLocalhostConfig } from "./networks/localhost";
import { getConfig as getRoninMainNetConfig } from "./networks/ronin_mainnet";
import { getConfig as getRoninTestNetConfig } from "./networks/ronin_testnet";
import { Config } from "./types";

/**
 * Get the configuration for the network
 *
 * @param hre - Hardhat Runtime Environment
 * @returns The configuration for the network
 */
export async function getConfig(hre: HardhatRuntimeEnvironment): Promise<Config> {
  switch (hre.network.name) {
    case "ronin_testnet":
      return getRoninTestNetConfig(hre);
    case "ronin_mainnet":
      return getRoninMainNetConfig(hre);
    case "hardhat":
    case "localhost":
      return getLocalhostConfig(hre);
    default:
      throw new Error(`Unknown network: ${hre.network.name}`);
  }
}
