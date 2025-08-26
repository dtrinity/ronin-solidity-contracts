/**
 * Check if network name is a mainnet network
 *
 * @param network Network name (e.g., "ronin_mainnet", "ronin_testnet")
 * @returns True if the network is mainnet, false otherwise
 */
export function isMainnetNetwork(network: string): boolean {
  return network.endsWith("_mainnet");
}