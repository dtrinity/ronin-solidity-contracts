# Remove non-dUSD/API3 tests

## Description
For the Ronin fork that simplifies the system to only include dUSD (dSTABLE) and API3 (oracle provider), remove all test files for other products to streamline the testing suite.

## Tasks

### Test Directories to Remove Completely:
- [ ] `test/dloop/` - dLOOP leveraged yield farming product (16 files)
  - [ ] `test/dloop/DLoopCoreMock/` (13 files)
  - [ ] `test/dloop/DLoopDepositorMock/` (2 files) 
  - [ ] `test/dloop/DLoopRedeemerMock/` (2 files)
  - [ ] `test/dloop/ZeroShareVulnerability.ts`

- [ ] `test/dpool/` - dPOOL liquidity pool product (4 files)
  - [ ] `test/dpool/Curve-integration.ts`
  - [ ] `test/dpool/DPoolVaultLP.Event.test.ts`
  - [ ] `test/dpool/ZeroShareVulnerability.ts`
  - [ ] `test/dpool/fixture.ts`

- [ ] `test/dstake/` - dSTAKE staking product (10 files)
  - [ ] `test/dstake/DStakeCollateralVault.ts`
  - [ ] `test/dstake/DStakeRewardManagerDLend.ts`
  - [ ] `test/dstake/DStakeRouterDLend.ts`
  - [ ] `test/dstake/DStakeToken.ts`
  - [ ] `test/dstake/WrappedDLendConversionAdapter.ts`
  - [ ] `test/dstake/ZeroShareVulnerability.ts`
  - [ ] `test/dstake/dLEND-integration.ts`
  - [ ] `test/dstake/dLEND-yield.ts`
  - [ ] `test/dstake/fixture.ts`
  - [ ] `test/dstake/withdraw-surplus-rounding.test.ts`

- [ ] `test/pendle/` - Pendle integration tests (3 files)
  - [ ] `test/pendle/PendleSwapPOC.ts`
  - [ ] `test/pendle/fixture.ts`
  - [ ] `test/pendle/sdk.ts`

- [ ] `test/reward_claimable/` - Reward claiming functionality (1 file)
  - [ ] `test/reward_claimable/RewardClaimable.ts`

- [ ] `test/vesting/` - Vesting NFT functionality (2 files)
  - [ ] `test/vesting/ERC20VestingNFT.tokenURI.ts`
  - [ ] `test/vesting/ERC20VestingNFT.ts`

- [ ] `test/dlend/` - dLEND lending protocol tests (7 files)
  - [ ] `test/dlend/AaveOracle.ts`
  - [ ] `test/dlend/AaveProtocolDataProvider.ts`
  - [ ] `test/dlend/Pool.ts`
  - [ ] `test/dlend/StaticAToken.MetaSigMalleability.ts`
  - [ ] `test/dlend/StaticAToken.ts`
  - [ ] `test/dlend/UiPoolDataProviderV3.ts`
  - [ ] `test/dlend/fixtures.ts`

- [ ] `test/mock/` - Mock contract tests (2 files)
  - [ ] `test/mock/SimpleDEXMock.ts`
  - [ ] `test/mock/TestERC20FlashMintable.ts`

### Individual Test Files to Remove:
- [ ] `test/oracle_aggregator/RedstoneChainlinkWrapper.ts` - Redstone oracle tests (non-API3)
- [ ] `test/oracle_aggregator/RedstoneChainlinkWrapperWithThresholding.ts` - Redstone oracle tests
- [ ] `test/oracle_aggregator/RedstoneChainlinkCompositeWrapperWithThresholding.ts` - Redstone oracle tests
- [ ] `test/oracle_aggregator/ChainlinkCompositeAggregator.ts` - Chainlink tests (non-API3)
- [ ] `test/common/WithdrawalFee.test.ts` - Withdrawal fee tests

## Notes
**Files/Directories to KEEP:**
- `test/dstable/` - dUSD stablecoin tests (9 files) - KEEP
- `test/oracle_aggregator/API3*.ts` - API3 oracle wrapper tests (3 files) - KEEP
- `test/oracle_aggregator/OracleAggregator.ts` - Core oracle aggregator - KEEP
- `test/oracle_aggregator/fixtures.ts` - Oracle test fixtures - KEEP

**Total files to remove:** ~50 test files across 8 directories and 5 individual files

This cleanup will leave only the essential tests for dUSD stablecoin functionality and API3 oracle integration, significantly simplifying the test suite for the Ronin fork.

---
Created: 2025-08-02T18:02:16.542Z
