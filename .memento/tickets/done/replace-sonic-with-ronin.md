# replace-sonic-with-ronin

## Description
We forked this repo from Sonic. Now we must set it up for Ronin

Ronin network info:
```
    ronin: { // Mainnet
      chainId: 2020,
      url: "https://api.roninchain.com/rpc",
    },
    saigon: { // Testnet
      chainId: 2021,
      url: "https://saigon-testnet.roninchain.com/rpc",
    },
```

## Tasks
- [ ] Find all instances of Sonic, `sonic_testnet` and `sonic_mainnet` to replace with Ronin values
- [ ] `make lint`
- [ ] `make test` <- get all tests passing
- [ ] Do a final search for references to Sonic
- [ ] Open a PR

## Notes


---
Created: 2025-08-04T09:07:32.082Z
