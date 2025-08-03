import { ZeroAddress } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { isMainnet, isSonicTestnet } from "../typescript/hardhat/deploy";
import { getTokenContractForSymbol } from "../typescript/token/utils";

// Define the oracle feed structure
export interface OracleFeedConfig {
  name: string; // Name of the oracle feed (e.g., "USDC/USD")
  symbol: string; // Token symbol
  price: string; // Default price
}

// Define oracle providers
export type OracleProvider = "API3"; // Only API3 now

// Export the feeds array for API3 oracles
export const api3Feeds: OracleFeedConfig[] = [
  // USD price feeds
  { name: "dUSD_USD", symbol: "dUSD", price: "1" },
  { name: "frxUSD_USD", symbol: "frxUSD", price: "1" },
  { name: "USDC_USD", symbol: "USDC", price: "1" },
  { name: "USDS_USD", symbol: "USDS", price: "1" },
  { name: "wS_USD", symbol: "wS", price: "4.2" },
  { name: "scUSD_USD", symbol: "scUSD", price: "1" },

  // Vault feeds
  { name: "sfrxUSD_frxUSD", symbol: "sfrxUSD", price: "1.1" },
  { name: "sUSDS_USDS", symbol: "sUSDS", price: "1.1" },
  { name: "wstkscUSD_scUSD", symbol: "wstkscUSD", price: "1.15" },
  { name: "wOS_OS", symbol: "wOS", price: "1.1" },

  // S feeds
  { name: "stS_S", symbol: "stS", price: "1.1" },
  { name: "OS_S", symbol: "OS", price: "1.0" },
  { name: "wOS_S", symbol: "wOS", price: "1.1" },
];

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const signer = await hre.ethers.getSigner(deployer);

  if (isMainnet(hre.network.name)) {
    throw new Error("WARNING - should not deploy mock oracles on mainnet");
  }

  // Deploy a mock API3 server V1 (this would be the actual API3 server on mainnet)
  const mockAPI3ServerV1 = await hre.deployments.deploy("MockAPI3ServerV1", {
    from: deployer,
    args: [],
    autoMine: true,
    log: false,
  });

  // Track deployed mock oracles
  const mockOracleNameToAddress: Record<string, string> = {};
  const mockOracleNameToProvider: Record<string, OracleProvider> = {};

  // Deploy individual MockAPI3OracleAlwaysAlive instances for each feed
  for (const feed of api3Feeds) {
    const mockOracleName = `MockAPI3OracleAlwaysAlive_${feed.name}`;
    const mockOracle = await hre.deployments.deploy(mockOracleName, {
      from: deployer,
      args: [mockAPI3ServerV1.address],
      contract: "MockAPI3OracleAlwaysAlive",
      autoMine: true,
      log: false,
    });

    // Get the deployed mock oracle contract
    const mockOracleContract = await hre.ethers.getContractAt(
      "MockAPI3OracleAlwaysAlive",
      mockOracle.address,
      signer
    );

    // Convert price to int224 format expected by API3 (18 decimals)
    const priceInWei = hre.ethers.parseUnits(feed.price, 18);
    // Convert to int224 (API3 format)
    const priceAsInt224 = priceInWei > BigInt(2**223 - 1) ? BigInt(2**223 - 1) : priceInWei;
    await mockOracleContract.setMock(priceAsInt224);

    // Store the deployment for config
    mockOracleNameToAddress[feed.name] = mockOracle.address;
    mockOracleNameToProvider[feed.name] = "API3";

    console.log(
      `Deployed ${mockOracleName} at ${mockOracle.address} with price ${feed.price}`
    );
  }

  // Store the mock oracle deployments in JSON files for the config to use
  await hre.deployments.save("MockOracleNameToAddress", {
    address: ZeroAddress,
    abi: [],
    linkedData: mockOracleNameToAddress,
  });

  await hre.deployments.save("MockOracleNameToProvider", {
    address: ZeroAddress,
    abi: [],
    linkedData: mockOracleNameToProvider,
  });

  console.log(`🔮 ${__filename.split("/").slice(-2).join("/")}: ✅`);
  return true;
};

func.tags = ["local-setup", "oracle"];
func.dependencies = ["tokens"];
func.id = "local_oracle_setup";

export default func;
