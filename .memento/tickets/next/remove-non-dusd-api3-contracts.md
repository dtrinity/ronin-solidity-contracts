# Remove non-dUSD/API3 contracts

## Description
Simplify the forked sonic-solidity-contracts repository for Ronin by removing all products except dUSD (dSTABLE) and API3 oracle functionality. This involves removing entire product directories and non-API3 oracle integrations.

## Tasks

### Remove entire product directories:
- [ ] Remove dLEND (Aave v3 fork): `/contracts/dlend/`
- [ ] Remove dSTAKE (yield vault system): `/contracts/vaults/dstake/`
- [ ] Remove dPOOL (Curve LP vaults): `/contracts/vaults/dpool/`
- [ ] Remove dLOOP (leveraged vaults): `/contracts/vaults/dloop/`
- [ ] Remove Pendle integration: `/contracts/pendle/`
- [ ] Remove Odos integration: `/contracts/odos/`
- [ ] Remove aToken wrapper vaults: `/contracts/vaults/atoken_wrapper/`
- [ ] Remove rewards claimable vaults: `/contracts/vaults/rewards_claimable/`
- [ ] Remove vesting vaults: `/contracts/vaults/vesting/`

### Remove non-API3 oracle integrations:
- [ ] Remove Chainlink oracle wrapper: `/contracts/oracle_aggregator/wrapper/RedstoneChainlinkWrapper.sol`
- [ ] Remove Chainlink composite wrapper: `/contracts/oracle_aggregator/wrapper/RedstoneChainlinkCompositeWrapperWithThresholding.sol`
- [ ] Remove Chainlink decimal converter: `/contracts/oracle_aggregator/chainlink/ChainlinkDecimalConverter.sol`
- [ ] Remove Chainlink composite aggregator: `/contracts/oracle_aggregator/chainlink/ChainlinkCompositeAggregator.sol`
- [ ] Remove Chainlink interfaces: `/contracts/oracle_aggregator/interface/chainlink/`
- [ ] Remove HardPegOracleWrapper: `/contracts/oracle_aggregator/wrapper/HardPegOracleWrapper.sol`
- [ ] Remove ThresholdingUtils: `/contracts/oracle_aggregator/wrapper/ThresholdingUtils.sol`

### Remove related test contracts:
- [ ] Remove Pendle test contracts: `/contracts/testing/pendle/`
- [ ] Remove mock oracle contracts (except API3): `/contracts/testing/oracle/MockChainlinkAggregatorV3.sol`, `/contracts/testing/oracle/MockRedstoneChainlinkOracleAlwaysAlive.sol`
- [ ] Remove dSTAKE test contracts: `/contracts/testing/dstake/`
- [ ] Remove Odos mock: `/contracts/mocks/MockOdosSwapper.sol`
- [ ] Remove Curve mocks: `/contracts/mocks/MockCurveStableSwapNG.sol`
- [ ] Remove adapter mocks: `/contracts/mocks/MockAdapterPositiveSlippage.sol`, `/contracts/mocks/MockAdapterSmallDepositRevert.sol`
- [ ] Remove ERC4626 mock: `/contracts/mocks/MockERC4626Simple.sol`

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
