# Remove-non-dUSD-API3-configurations

## Description
Clean up Sonic-forked configuration files to simplify for Ronin deployment by keeping ONLY dUSD (dSTABLE) and API3 (oracle provider). Remove ALL other products, lending markets, vaults, and oracle providers.

## Tasks

### Complete File/Directory Deletions:
- [x] **DELETE ENTIRE config/dlend/ directory** - No lending functionality in Ronin
  - [x] config/dlend/reserves-params.ts
  - [x] config/dlend/interest-rate-strategies.ts  
  - [x] config/dlend/types.ts

### Network Configuration Cleanup:

- [x] **config/networks/localhost.ts:**
  - [x] Remove dS (second dSTABLE) from dStables configuration 
  - [x] Remove ALL oracle configurations except API3 for dUSD/USD 
  - [x] Remove ALL dLend configurations completely 
  - [x] Remove ALL dLoop vault configurations 
  - [x] Remove ALL dStake configurations 
  - [x] Remove ALL dPool configurations 
  - [x] Remove vesting configuration 
  - [x] Remove all mock tokens except those needed for dUSD testing

- [x] **config/networks/sonic_mainnet.ts:**
  - [x] Remove dS (second dSTABLE) from dStables configuration 
  - [x] Remove ALL non-API3 oracle configurations (Redstone, Chainlink) 
  - [x] Remove ALL dLend configurations completely 
  - [x] Remove ALL dLoop configurations 
  - [x] Remove ALL dStake configurations 
  - [x] Remove ALL Pendle configurations 

- [x] **config/networks/sonic_testnet.ts:**
  - [x] Remove dS (second dSTABLE) from dStables configuration 
  - [x] Remove ALL non-API3 oracle configurations 
  - [x] Remove ALL dLend configurations completely 
  - [x] Remove ALL dLoop configurations 
  - [x] Remove vesting configuration 

### Type Definition Cleanup:
- [x] **config/types.ts:**
  - [x] Remove dS from DStables interface - keep only dUSD
  - [x] Remove ALL dLend interface definitions and types
  - [x] Remove ALL dLoop interface definitions and types
  - [x] Remove ALL dStake interface definitions and types
  - [x] Remove ALL dPool interface definitions and types
  - [x] Remove ALL vesting interface definitions and types
  - [x] Remove ALL Pendle interface definitions and types
  - [x] Simplify OracleAggregatorConfig to include ONLY API3 oracle assets
  - [x] Remove all non-dUSD token configurations

## What Should Remain After Cleanup:
- **dUSD (dSTABLE)** - The single stablecoin product
- **API3 Oracle** - Only oracle provider for dUSD/USD price feeds  
- **Basic multisig configurations** - For dUSD governance only
- **Essential network parameters** - RPC endpoints, chain IDs, etc.

## Products/Features Being Completely Removed:
- dS (alternative stablecoin)
- ALL lending functionality (dLend)
- ALL vault products (dStake, dPool, dLoop)
- ALL vesting/rewards systems
- ALL Pendle integrations
- ALL non-API3 oracle providers (Redstone, Chainlink)
- ALL collateral assets except those essential for dUSD

---
Created: 2025-08-02T18:02:12.895Z
Updated: 2025-08-02T19:30:00.000Z
Status: COMPLETED