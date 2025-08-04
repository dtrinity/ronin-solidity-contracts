/**
 * Check if the network is local
 *
 * @param network - The network name
 * @returns True if the network is local, false otherwise
 */
export function isLocalNetwork(network: string): boolean {
  return network === "localhost" || network === "hardhat";
}

/**
 * Check if the network is saigon (Ronin testnet)
 *
 * @param network - The network name
 * @returns True if the network is saigon, false otherwise
 */
export function isSaigon(network: string): boolean {
  return network === "saigon";
}

/**
 * Check if the network is ronin mainnet
 *
 * @param network - The network name
 * @returns True if the network is ronin mainnet, false otherwise
 */
export function isMainnet(network: string): boolean {
  return network === "ronin";
}
