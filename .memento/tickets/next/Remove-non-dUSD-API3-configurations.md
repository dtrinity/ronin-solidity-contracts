# Remove-non-dUSD-API3-configurations

## Description
Clean up Sonic-forked configuration files to simplify for Ronin deployment by keeping only dUSD (dSTABLE) and API3 (oracle provider), removing all other products and configurations.

## Tasks

### Network Configuration Files to Clean Up:

- [ ] **config/networks/localhost.ts:**
  - [ ] Remove dS (dSTABLE) from dStables configuration (lines 219-234)
  - [ ] Remove all oracle configurations except API3 for dUSD/USD (lines 236-403)
  - [ ] Remove all dLend reserves except dUSD (lines 404-423) 
  - [ ] Remove dLoop vault configurations except core dUSD vault (lines 427-470)
  - [ ] Remove dStake configurations for sdS (lines 510-545)
  - [ ] Remove dPool configurations (lines 556-578)
  - [ ] Remove vesting configuration (lines 547-555)
  - [ ] Remove all mock tokens except those needed for dUSD

- [ ] **config/networks/sonic_mainnet.ts:**
  - [ ] Remove dS (dSTABLE) from dStables configuration (lines 150-160)
  - [ ] Remove Redstone oracle configurations, keep only API3 (lines 221-349)
  - [ ] Remove all dLend reserves except dUSD (lines 363-376)
  - [ ] Remove dLoop configurations (lines 162-206)
  - [ ] Remove dStake configurations except sdUSD (lines 380-417)
  - [ ] Remove Pendle configurations (lines 110-128)
  - [ ] Remove chainlink composite aggregator configurations (lines 320-332)

- [ ] **config/networks/sonic_testnet.ts:**
  - [ ] Remove dS (dSTABLE) from dStables configuration (lines 175-190)
  - [ ] Remove all oracle configurations except API3 for dUSD (lines 236-401)
  - [ ] Remove all dLend reserves except dUSD (lines 414-421)
  - [ ] Remove dLoop configurations (lines 192-235)
  - [ ] Remove vesting configuration (lines 465-473)

- [ ] **config/dlend/reserves-params.ts:**
  - [ ] Remove all strategy exports except strategyDUSD (lines 34-131)
  - [ ] Keep only dUSD strategy configuration

- [ ] **config/types.ts:**
  - [ ] Remove dS from DStables interface and related types
  - [ ] Remove dLoop, dStake, dPool, vesting, and Pendle interface definitions
  - [ ] Simplify OracleAggregatorConfig to include only API3 oracle assets

## Notes

### Key Products Being Removed:
- dS (second dSTABLE)
- All lending reserves except dUSD
- dLoop (leveraged vault products)
- dStake (staking products) except basic dUSD staking
- dPool (liquidity pool products)  
- dBOOST (vesting products)
- Pendle PT token integrations
- All oracle providers except API3
- All collateral assets except those needed for dUSD

### Keep Only:
- dUSD (the main dSTABLE)
- API3 oracle provider for dUSD/USD price feeds
- Basic dUSD lending functionality
- Essential infrastructure configurations

### Files Analyzed:
- `/config/config.ts` - Main configuration entry point
- `/config/types.ts` - Type definitions for all products
- `/config/networks/localhost.ts` - Local development configuration
- `/config/networks/sonic_mainnet.ts` - Mainnet configuration  
- `/config/networks/sonic_testnet.ts` - Testnet configuration
- `/config/dlend/reserves-params.ts` - DLend reserve parameters
- `/config/dlend/interest-rate-strategies.ts` - Interest rate strategies
- `/config/dlend/types.ts` - DLend type definitions

---
Created: 2025-08-02T18:02:12.895Z
