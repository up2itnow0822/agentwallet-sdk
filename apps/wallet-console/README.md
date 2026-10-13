# AgentWallet vault console

Browser-only owner/operator console for AgentVault v1. Connect an injected external wallet; no private-key input, custody service, signatures in storage or automatic signing.

```sh
npm ci --ignore-scripts
npm run dev
npm run build
npm run test:unit
npm test
```

`npm test` runs Playwright with a pinned npm-packaged Chromium fallback on Linux x64. Root dependencies are required for the actual local-EVM fixture compiler. On other platforms, install the matching Playwright Chromium (`npx playwright install chromium`) or set `PLAYWRIGHT_EXECUTABLE_PATH`.

## Real workflows

- Base Sepolia owner deployment with generated deterministic AgentVault creation code, a separate operator, official fixed protocol addresses, reviewed creation calldata, external signing, receipt checks and a downloadable public manifest.
- Manifest verification against the wallet chain, vault runtime hash and `securityVersion() == 1`; live owner/operator role checks. Base, Ethereum, Arbitrum and OP Sepolia only. Mainnet is gated.
- Native/ERC20 payments through the guarded vault; queue requests distinguished from completed transfers.
- Exact-input trades, live vault-call simulation quote, owner pair floor, bounded deadline and reviewed minimum received.
- Aave supply and withdrawal returning to the vault; actual principal and configured aToken balances, no fabricated yield.
- CCTP V2 source burns and public recovery records; original-receipt inspection, strict Circle sandbox attestation binding, explicit destination runtime/transmitter manifest, owner-approved mint through destination vault `ownerExecute`, replay/receipt/credit checks.
- Owner budgets, operators, payment recipients, pair floors, bridge recipients and pause controls.
- Complete queued calldata/amount/expiry/policy version inspection, owner approval/cancellation, session activity, fixed explorer links and security/help.
- Read-only isolated demo, responsive layouts, keyboard forms, focused dialogs and dark/light modes.

## Manifests

Import a public JSON object containing `chainId`, `vault`, `runtimeCodeHash`, `securityVersion: 1`, and `assets`. Each token requires `address`, `symbol` and `decimals`; `aToken` is optional. The UI checks decimals against the chain. Expected code hashes must come from independently trusted deployment evidence: providing a hash does not make a deployment audited.

Destination recovery additionally requires `messageTransmitterCodeHash`. Its destination chain/vault must match the original burn domain/recipient; the transmitter must be the official testnet address with that expected runtime hash and correct local domain. Switch the external wallet to the destination network after fetching an attestation. An unresolved submitted hash remains unresolved until its actual receipt is inspected; never repeat the burn to recover.

Official references checked for the deployment presets:

- [Uniswap Base deployments](https://developers.uniswap.org/docs/protocols/v3/deployments/v3-base-deployments)
- [Aave DAO Base Sepolia address book](https://github.com/aave-dao/aave-address-book/blob/main/src/AaveV3BaseSepolia.sol)
- [Circle CCTP contract addresses](https://developers.circle.com/cctp/references/contract-addresses)
- [Circle native USDC addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)

Aave Base Sepolia USDC (`A-USDC`) differs from Circle Base Sepolia USDC (`C-USDC`). They must not be treated as interchangeable.

## Verification boundary

Browser regression tests execute actual AgentVault Solidity in a local VM with disposable signers and local mock protocols, including payments, queue status, mined revert, roles, network/hash gates, quotes/trades, staking, deployment, CCTP receiving and malformed attestation rejection. This proves local implementation behavior. Independently audited deployed contracts, funded live-testnet settlement and mainnet release authorization remain external prerequisites. Circle API accessibility also depends on the user's browser and service availability.
