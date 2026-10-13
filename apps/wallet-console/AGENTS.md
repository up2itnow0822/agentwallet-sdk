# Wallet console contract

## Purpose

An accessible browser-only interface for the owner to deploy, understand, configure and use guarded AgentVault testnet wallets.

## Ownership

`apps/wallet-console/` only. Root owns the SDK, contracts, generated ABI/bytecode, repository dependencies, CI, integration and shipping. Local UI package/lock/config/tests are owned here. Do not commit, deploy to a live network, publish or edit sibling ownership paths.

## Local Contracts

- React/strict TypeScript/Vite. Connect an injected EIP-1193 wallet only. Never collect private keys, seed phrases or signatures. No backend custody or automatic transactions.
- Overview starts disconnected and displays no synthetic balances. Explicit labelled demo mode is isolated and cannot sign. Demo assets are examples, never live finance.
- Every production write uses generated `src/contracts/AgentVaultAbi.ts`, or the generated creation bytecode for the explicit owner deployment wizard. Bounded payments/trades/Aave/CCTP burns call `agent*`; configuration and approvals call owner methods; destination CCTP receiving calls the destination vault's `ownerExecute` with exactly constructed `receiveMessage` calldata.
- Explicit manifest chain/address/runtime hash/version verification and signer role checks precede execution. Only Base/Ethereum/Arbitrum/OP Sepolia are supported. Mainnet manifests remain rejected; a self-asserted audit flag cannot unlock them.
- Every transaction has a human-readable review, complete calldata, estimated fee, external-wallet signing, simulation and successful receipt checks with two confirmations. Wallet account/network changes invalidate the session review. Owners can call bounded operations; operators cannot call owner methods.
- Positive financial amounts use decimal-string-to-bigint parsing with strict precision; no rounding, exponent notation or negative/zero amounts. Quote generation simulates the exact bounded vault swap, applies ceiling for owner pair floor and suggests at most 0.5% slippage. Aave supply/withdraw beneficiaries stay in the vault; actual configured aToken balance and principal are separate, with no assumed APY.
- Source bridge records persist only whitelisted public hashes, addresses, chains, amounts and statuses. Attestations stay in memory. Destination recovery binds original source calldata and the single official MessageSent event, fetches Circle's fixed sandbox HTTPS origin with no credentials/redirects and bounded time/bytes, validates immutable message fields, verifies an explicit destination vault/transmitter hash/domain/owner, checks replay nonce, and confirms consumed nonce and vault credit. Unknown submissions retain their hashes and require receipt inspection before any retry; a confirmed revert permits a newly reviewed attempt.
- Browser manifests may contain only public deployment evidence. Code-hash matching is not an independent audit. Protocol and deployment risks remain visible; never make blanket security or live-settlement claims.

## Work Guidance

Keep dependencies pinned and small. `vite.config.ts` deduplicates browser-safe SDK viem imports. Do not import Node SDK modules (`bridge/client`, file stores, DNS helpers, keys) into the console. `recovery.ts` imports only browser-safe `bridge/message`, `bridge/types` and `bridge/abis`.

Use responsive light/dark styles, labelled keyboard forms, focus-contained review dialogs, a skip link, loading/empty/error states and fixed official explorer origins. Disable unavailable actions with nearby prerequisites. No dead buttons or silent financial fallback. Deployment uses official Base Sepolia protocol addresses and verifies deployed owner/operator/version/protocol configuration before producing the public manifest. Circle test USDC and Aave test USDC are distinct assets.

## Verification

Run from this directory: `npm run build`, `npm run test:unit`, `npm test`, `npm audit --omit=dev`, `npm audit`. `npm test` selects the locked packaged Chromium fallback on Linux x64 without needing browser CDN downloads or an environment variable; an explicit `PLAYWRIGHT_EXECUTABLE_PATH` can override it. Tests use disposable local-only VM credentials in test utilities, not production hooks.

Browser tests execute real Solidity in EthereumJS VM behind a test EIP-1193 provider. Protocol fixtures are clearly local mocks: these tests establish UI/contract flow, never a live Circle attestation, testnet settlement, independent audit or deployed protocol proof. Root's verification owns fresh aggregate evidence and screenshots. New behavioral changes need observed failing regression coverage before fixes. Tests and render inspection must be performed on a settled tree: editing UI files while Playwright runs triggers Vite HMR and can invalidate evidence.

## Child DOX Index

None.
