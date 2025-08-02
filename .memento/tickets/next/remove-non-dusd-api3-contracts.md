# Remove non-dUSD/API3 contracts

## Description
Simplify the forked sonic-solidity-contracts repository for Ronin by removing all products except dUSD (dSTABLE) and API3 oracle functionality. This involves removing entire product directories and non-API3 oracle integrations.

## Tasks

### Remove entire product directories:
- [x] Remove dLEND (Aave v3 fork): `/contracts/dlend/`
- [x] Remove dSTAKE (yield vault system): `/contracts/vaults/dstake/`
- [x] Remove dPOOL (Curve LP vaults): `/contracts/vaults/dpool/`
- [x] Remove dLOOP (leveraged vaults): `/contracts/vaults/dloop/`
- [x] Remove Pendle integration: `/contracts/pendle/`
- [x] Remove Odos integration: `/contracts/odos/`
- [x] Remove aToken wrapper vaults: `/contracts/vaults/atoken_wrapper/`
- [x] Remove rewards claimable vaults: `/contracts/vaults/rewards_claimable/`
- [x] Remove vesting vaults: `/contracts/vaults/vesting/`

### Remove non-API3 oracle integrations:
- [x] Remove Chainlink oracle wrapper: `/contracts/oracle_aggregator/wrapper/RedstoneChainlinkWrapper.sol`
- [x] Remove Chainlink composite wrapper: `/contracts/oracle_aggregator/wrapper/RedstoneChainlinkCompositeWrapperWithThresholding.sol`
- [x] Remove Chainlink decimal converter: `/contracts/oracle_aggregator/chainlink/ChainlinkDecimalConverter.sol`
- [x] Remove Chainlink composite aggregator: `/contracts/oracle_aggregator/chainlink/ChainlinkCompositeAggregator.sol`
- [x] Remove Chainlink interfaces: `/contracts/oracle_aggregator/interface/chainlink/`
- [x] Remove HardPegOracleWrapper: `/contracts/oracle_aggregator/wrapper/HardPegOracleWrapper.sol`
- [x] Remove ThresholdingUtils: `/contracts/oracle_aggregator/wrapper/ThresholdingUtils.sol`

### Remove related test contracts:
- [x] Remove Pendle test contracts: `/contracts/testing/pendle/`
- [x] Remove mock oracle contracts (except API3): `/contracts/testing/oracle/MockChainlinkAggregatorV3.sol`, `/contracts/testing/oracle/MockRedstoneChainlinkOracleAlwaysAlive.sol`
- [x] Remove dSTAKE test contracts: `/contracts/testing/dstake/`
- [x] Remove Odos mock: `/contracts/mocks/MockOdosSwapper.sol`
- [x] Remove Curve mocks: `/contracts/mocks/MockCurveStableSwapNG.sol`
- [x] Remove adapter mocks: `/contracts/mocks/MockAdapterPositiveSlippage.sol`, `/contracts/mocks/MockAdapterSmallDepositRevert.sol`
- [x] Remove ERC4626 mock: `/contracts/mocks/MockERC4626Simple.sol`

## Notes
Keep contracts related to:
- dUSD (dSTABLE): `/contracts/dstable/` directory
- API3 oracle integration: `/contracts/oracle_aggregator/interface/api3/`, `/contracts/oracle_aggregator/wrapper/API3*.sol`
- Common utilities: `/contracts/common/` directory
- Core oracle aggregator: `/contracts/oracle_aggregator/OracleAggregator.sol`
- API3 test mocks: `/contracts/testing/oracle/MockAPI3*.sol`

Total files to remove: ~100+ contract files across multiple directories.

---
Created: 2025-08-02T18:01:48.379Z
