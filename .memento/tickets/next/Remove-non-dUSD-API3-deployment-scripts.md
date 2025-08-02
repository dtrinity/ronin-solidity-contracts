# Remove-non-dUSD-API3-deployment-scripts

## Description
Simplify Ronin deployment by removing all deployment scripts for products other than dUSD (a dSTABLE) and API3 (oracle provider). This includes removing deployment scripts for dS ecosystem, dLend, dStake, dPool, dLoop, vesting, and other non-essential products.

## Tasks

### Remove Complete Product Ecosystems
- [ ] Delete entire `/deploy/01_ds_ecosystem/` directory (13 files) - dS token and related infrastructure
- [ ] Delete entire `/deploy/03_dlend/` directory (14 files) - Aave-based lending protocol
- [ ] Delete entire `/deploy/08_dstake/` directory (5 files) - Staking infrastructure
- [ ] Delete entire `/deploy/11_dpool/` directory (3 files) - Pool vaults and peripheries
- [ ] Delete entire `/deploy/12_dloop/` directory (6 files) - Leveraged loop products

### Remove Specific Feature Deployment Scripts
- [ ] Delete `/deploy/05_dlend_odos_adapters/01_add_odos_swap_adapters.ts` - Odos swap adapters
- [ ] Delete `/deploy/06_dlend_wstkscusd_reserve/` directory (3 files) - Specific reserve tokens
- [ ] Delete `/deploy/07_dlend_static_wrappers/` directory (2 files) - Static aToken wrappers
- [ ] Delete `/deploy/09_redeemer_with_fees/01_deploy_redeemer_with_fees.ts` - Fee-based redeemer
- [ ] Delete `/deploy/10_vesting_dstake/01_deploy_vesting_nft.ts` - Vesting NFT contracts
- [ ] Delete `/deploy/13_dlend_weth_sceth_wstksceth_reserves/` directory (3 files) - ETH-based reserves
- [ ] Delete `/deploy/14_dlend_wOS_PTaUSDC_PTwstkscusd/` directory (5 files) - Pendle PT tokens

### Remove Non-dUSD dSTABLE Scripts from dUSD Ecosystem
- [ ] Remove Redstone oracle setup from `/deploy/02_dusd_ecosystem/02_setup_usd_redstone_oracle_wrappers.ts`
- [ ] Remove Redstone aggregator pointing from `/deploy/02_dusd_ecosystem/06_point_usd_aggregator_to_redstone_wrappers.ts`

### Remove Shell Scripts for Non-Essential Products
- [ ] Delete `/scripts/dloop/` directory (5 shell scripts) - dLoop deployment automation
- [ ] Delete `/scripts/dlend/deploy-n-override-incentives-controller.ts` - dLend specific script
- [ ] Delete `/scripts/dlend/remove-reserve.ts` - dLend reserve management

### Clean Up Role Assignment Scripts
- [ ] Remove dS-related sections from `/deploy/04_assign_roles_to_multisig/01_transfer_dstable_roles_to_multisig.ts`
- [ ] Delete `/deploy/04_assign_roles_to_multisig/03_transfer_dlend_roles_to_multisig.ts` - dLend role transfers

## Notes
**Keep for Ronin:**
- `/deploy/02_dusd_ecosystem/` (except Redstone parts) - Core dUSD deployment
- API3 oracle wrapper scripts in dUSD ecosystem
- Basic multisig role transfers for dUSD and oracle components only
- `/deploy-mocks/` directory - Needed for testing

**Products Being Removed:**
- **dS**: Alternative stablecoin pegged to S token
- **dLend**: Aave-based lending protocol 
- **dStake**: Staking infrastructure for earning rewards
- **dPool**: Curve-based pool vaults
- **dLoop**: Leveraged loop investment products
- **Vesting**: NFT-based vesting contracts
- **Static Wrappers**: Wrapped aToken contracts
- **Fee-based Redeemers**: Alternative redemption mechanisms

This cleanup will significantly reduce deployment complexity and focus Ronin on the core dUSD stablecoin with API3 oracle infrastructure.

---
Created: 2025-08-02T18:01:45.819Z
