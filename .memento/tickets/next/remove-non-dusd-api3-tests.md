# Remove non-dUSD/API3 tests

## Description
For the Ronin fork that simplifies the system to only include dUSD (dSTABLE) and API3 (oracle provider), remove all test files for other products to streamline the testing suite.

## Tasks

### Test Directories to Remove Completely:
- [x] `test/dloop/` - dLOOP leveraged yield farming product (16 files)
  - [x] `test/dloop/DLoopCoreMock/` (13 files)
  - [x] `test/dloop/DLoopDepositorMock/` (2 files) 
  - [x] `test/dloop/DLoopRedeemerMock/` (2 files)
  - [x] `test/dloop/ZeroShareVulnerability.ts`

- [x] `test/dpool/` - dPOOL liquidity pool product (4 files)
  - [x] `test/dpool/Curve-integration.ts`
  - [x] `test/dpool/DPoolVaultLP.Event.test.ts`
  - [x] `test/dpool/ZeroShareVulnerability.ts`
  - [x] `test/dpool/fixture.ts`

- [x] `test/dstake/` - dSTAKE staking product (10 files)
  - [x] `test/dstake/DStakeCollateralVault.ts`
  - [x] `test/dstake/DStakeRewardManagerDLend.ts`
  - [x] `test/dstake/DStakeRouterDLend.ts`
  - [x] `test/dstake/DStakeToken.ts`
  - [x] `test/dstake/WrappedDLendConversionAdapter.ts`
  - [x] `test/dstake/ZeroShareVulnerability.ts`
  - [x] `test/dstake/dLEND-integration.ts`
  - [x] `test/dstake/dLEND-yield.ts`
  - [x] `test/dstake/fixture.ts`
  - [x] `test/dstake/withdraw-surplus-rounding.test.ts`

- [x] `test/pendle/` - Pendle integration tests (3 files)
  - [x] `test/pendle/PendleSwapPOC.ts`
  - [x] `test/pendle/fixture.ts`
  - [x] `test/pendle/sdk.ts`

- [x] `test/reward_claimable/` - Reward claiming functionality (1 file)
  - [x] `test/reward_claimable/RewardClaimable.ts`

- [x] `test/vesting/` - Vesting NFT functionality (2 files)
  - [x] `test/vesting/ERC20VestingNFT.tokenURI.ts`
  - [x] `test/vesting/ERC20VestingNFT.ts`

- [x] `test/dlend/` - dLEND lending protocol tests (7 files)
  - [x] `test/dlend/AaveOracle.ts`
  - [x] `test/dlend/AaveProtocolDataProvider.ts`
  - [x] `test/dlend/Pool.ts`
  - [x] `test/dlend/StaticAToken.MetaSigMalleability.ts`
  - [x] `test/dlend/StaticAToken.ts`
  - [x] `test/dlend/UiPoolDataProviderV3.ts`
  - [x] `test/dlend/fixtures.ts`

- [x] `test/mock/` - Mock contract tests (2 files)
  - [x] `test/mock/SimpleDEXMock.ts`
  - [x] `test/mock/TestERC20FlashMintable.ts`

### Individual Test Files to Remove:
- [x] `test/oracle_aggregator/RedstoneChainlinkWrapper.ts` - Redstone oracle tests (non-API3)
- [x] `test/oracle_aggregator/RedstoneChainlinkWrapperWithThresholding.ts` - Redstone oracle tests
- [x] `test/oracle_aggregator/RedstoneChainlinkCompositeWrapperWithThresholding.ts` - Redstone oracle tests
- [x] `test/oracle_aggregator/ChainlinkCompositeAggregator.ts` - Chainlink tests (non-API3)
- [x] `test/common/WithdrawalFee.test.ts` - Withdrawal fee tests

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
