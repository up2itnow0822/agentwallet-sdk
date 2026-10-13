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

- Base Sepolia owner deployment with generated deterministic AgentVault creation code, a separate operator, official fixed protocol addresses, reviewed creation calldata, external signing, receipt checks and a downloadable public manifest. The immutable owner is captured in the review; wallet session changes invalidate delayed drafts and live account/network checks run again just before broadcasting.
- Manifest verification against the wallet chain, vault runtime hash and `securityVersion() == 1`; live owner/operator role checks. Wallets injected after page load can connect. Account, chain and disconnect events invalidate the verified session, including outstanding reviews and delayed reads. Base, Ethereum, Arbitrum and OP Sepolia only. Mainnet is gated.
- Async review prechecks and simulations belong to their original form, inputs, wallet session, deployment and signer. Editing inputs, replacing a manifest or changing wallets discards late results. Prepared writes retain that exact target and reject a different chain, vault, signer or provider before requesting signing.
- Native/ERC20 payments through the guarded vault; queue requests distinguished from completed transfers.
- Exact-input trades, live vault-call simulation quote, owner pair floor, bounded deadline and reviewed minimum received. Changing any trade input or leaving its form invalidates the quote, including delayed responses.
- Aave supply and withdrawal returning to the vault; actual principal and configured aToken balances, no fabricated yield.
- CCTP V2 source burns and public recovery records; original-receipt inspection, strict Circle sandbox attestation binding, explicit destination runtime/transmitter manifest, owner-approved mint through destination vault `ownerExecute`, replay/receipt/credit checks.
- Owner budgets, operators, payment recipients, pair floors, bridge recipients and pause controls.
- Complete queued calldata/amount/expiry/policy version inspection, owner approval/cancellation, session activity, fixed explorer links and security/help. Inspected requests belong to their chain and vault; owner reviews re-read that contract's current request, and completed requests leave the pending list after refresh. The newest 50 requests load in groups of at most five, in order and at one snapshot block.
- Read-only isolated demo, responsive layouts, keyboard forms and dark/light modes. Review dialogs isolate the background, contain Tab and Shift+Tab through calldata summaries and enabled controls, retain focus while signing, and return focus when dismissed.

## Manifests

Import a public JSON object containing `chainId`, `vault`, `runtimeCodeHash`, `securityVersion: 1`, and `assets`. Each token requires `address`, `symbol` and `decimals`; `aToken` is optional. The UI checks decimals against the chain. Expected code hashes must come from independently trusted deployment evidence: providing a hash does not make a deployment audited.

Destination recovery additionally requires `messageTransmitterCodeHash`. Its destination chain/vault must match the original burn domain/recipient; the transmitter must be the official testnet address with that expected runtime hash and correct local domain. Switch the external wallet to the destination network after fetching an attestation. An unresolved submitted hash remains unresolved until its actual receipt is inspected; never repeat the burn to recover.

Official references checked for the deployment presets:

- [Uniswap Base deployments](https://developers.uniswap.org/docs/protocols/v3/deployments/v3-base-deployments)
- [Aave DAO Base Sepolia address book](https://github.com/aave-dao/aave-address-book/blob/main/src/AaveV3BaseSepolia.sol)
- [Circle CCTP contract addresses](https://developers.circle.com/cctp/references/contract-addresses)
- [Circle native USDC addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)

Aave Base Sepolia USDC (`A-USDC`) differs from Circle Base Sepolia USDC (`C-USDC`). They must not be treated as interchangeable.

## Wallet request recovery

Before requesting a wallet signature, the console durably records the reviewed public transaction identity: network, signer, destination, zero wallet value, wallet nonce and calldata digest. It records only whitelisted public recovery metadata. Raw calldata, creation data, private keys, signatures and Circle attestations are never persisted. A browser with working local storage and Web Locks is required for writes; an origin-wide lock serializes journal claims across concurrent tabs.

A missing wallet response may follow a transaction that already executed. That request stays unknown and blocks another write across closing a review, reopening setup, navigation and reload in the same browser profile. A direct numeric wallet rejection (`4001`) or a failure established before invoking the send call permits another explicit attempt. An error message containing rejection words does not establish rejection. Returned hashes are kept even when a UI callback or later hash-storage write fails.

The signing dialog captures its public intent id as soon as storage accepts the claim, before waiting for the wallet. A recovered receipt spends that original review even when another tab found the hash. Close it and prepare a fresh review for a distinct write; creating another vault requires reopening its setup. Concurrent reconciliation preserves the latest saved terminal identity/hash/status and rejects a contradictory late result.

Use **Wallet request recovery** with the original public transaction hash from your external wallet history and switch to its original network. Recovery compares the transaction's chain, signer, destination, value, nonce and calldata digest with the saved identity, then checks a matching receipt with two confirmations. Missing or unsupported receipt evidence keeps the request unknown. Destination receiving also requires the reviewed CCTP nonce consumption and expected vault credit at the receipt block. A successful creation receipt exposes its contract address for further deployment verification. Download recovery metadata exports the public identities and known hashes; it contains no signing material.

Recovery displays complete transaction hashes as official explorer links that wrap within mobile screens. Responsive regression tests use a valid saved public intent at mobile and desktop widths without connecting a wallet.

Receipt completion updates public Activity even if the wallet changes while the receipt is being read. Reconnect and verify to load the active vault again. Activity can recheck a known terminal receipt against its original public intent without another broadcast; an old view cannot keep an already-confirmed journal request in the unresolved-write gate.

## Verification boundary

Browser regression tests execute actual AgentVault Solidity in a local VM with disposable signers and local mock protocols, including payments, complete queued approval/cancellation, mined revert, roles, network/hash gates, quotes/trades, staking, deployment, CCTP receiving and malformed attestation rejection. Queued-payment checks inspect exact recipient, amount and calldata, require a separate owner signature, verify approval credits the recipient exactly once and cancellation credits nothing, and reject operator owner reviews. Test-only provider events and deferred RPC responses also exercise invalidation, late wallet injection and stale-result races; keyboard checks cover all three review dialogs, including busy and zero-tabbable states. Run browser tests on a settled source tree so Vite hot reload cannot affect evidence.

Journal regressions lose the provider response after real local mining for payment, burn, deployment and receiving, then prove unknown requests cannot be repeated and exact-hash recovery reconciles them. They cover remount/reload, rejected versus ambiguous errors, unavailable storage/locks, failed hash persistence, throwing callbacks, malformed receipt status and concurrent tab claims. Queue tests measure bounded parallel RPCs at one block, and delayed quote tests cover every input and navigation.

Contradictory concurrent receipts cannot replace a saved terminal result. Resolving an original hash in another tab cannot reuse its open payment, deployment or receiving review; tests attempt those same buttons and inspect the actual transaction count.

Context regressions defer trade/bridge prechecks across two compatible real vaults or changed financial inputs, reject prepared target/signer/chain mismatches before sending, and complete public receipt evidence across wallet events before explicitly rechecking it and opening new work.

This proves local implementation behavior. Independently audited deployed contracts, funded live-testnet settlement and mainnet release authorization remain external prerequisites. Circle API accessibility also depends on the user's browser and service availability.
