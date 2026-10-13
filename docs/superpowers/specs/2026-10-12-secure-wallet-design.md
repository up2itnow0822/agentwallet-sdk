# Secure agent wallet v5 design

The owner needs a non-custodial account for safe bounded AI-agent payments, trading and protocol use, with an understandable wallet console. The user authorized autonomous repair of every reviewed finding plus UI. This is architectural work; design choices are recorded here under the user's @goal authority, with no additional reversible-work checkpoints.

## Architecture
AgentVault enforces token/native budgets, recipient and protocol restrictions, exact allowances, immutable owner/operator separation, atomic swap behavior, swap floor/deadline and pause/queue controls on-chain. No arbitrary operator calldata or direct EOA capital fallback. Agents use gas-only signing identities; the owner uses an external wallet for policy and approval.

Typed SDK AgentWallet describes vault address, chain, public/wallet clients and pinned expected runtime code hash. executeVaultOperation(wallet, operation, args) verifies deployed bytecode/version/chain, simulates, submits and checks receipt; consumers get {txHash,receipt}. src/contracts/AgentVaultAbi.ts is generated from the contract. Legacy core helpers remain where their semantics can be safe; otherwise throw an actionable migration error.

Budget tracking reserves a request before awaiting network/signature operations, durably stores per-wallet/per-chain/per-token records, locks concurrent clients/processes, and preserves charge for uncertain submitted transactions. Services are approved HTTPS origins with exact permitted payment recipients/assets/networks. Redirects, unknown schemes, unsupported standard payloads and unsafe financial amounts fail closed. Standard x402 exact authorization must be compatible with the guarded account; a custom tx-hash settlement is explicitly labelled, and must not masquerade as standard exact x402.

Identity uses strict fully signed proof options, key formats, expiry and expected issuer/recipient checks. Economic trust verification is asynchronous and checks wallet binding and observed on-chain stake at a specified chain/block through trusted evidence providers; signature-only verification is separately named. No AI-only or fabricated age/reputation claims. URI resolution pins DNS-approved public addresses to HTTPS and bounds redirects/time/bytes.

Swap, AAVE and CCTP adapters call the vault, use current primary protocol interfaces, confirm receipts and produce resumable bridge records. Four EVM bridge chains are supported only where configured deployments and dedicated destination clients exist. No hardcoded protocol fee collector. Staking reads actual aToken balances and vault-tracked principal without assumed APY.

Wallet console connects injected owner wallets, defaults to Base Sepolia, validates a verified vault manifest and never persists secrets. It offers overview, payments, trade, staking, bridge/recovery, operator/budget management, complete pending approval detail, activity and security/help. Preview is disconnected; demonstration balances are clearly labelled. Real writes require explicit confirmation and safe chain/code/role checks; mainnet is gated by verified deployment/release evidence.

## Security and verification
Use bigint amounts, bounded calldata/time/windows, scoped approvals, no unrestricted agent owner functions, replay-safe pending approvals and wallet bindings, durable non-rollbackable budget submissions. Restore strict TypeScript, correct exports/examples, remove tracked node_modules/dist, rebuild reproducibly and pack/test the artifact. CI fails on errors and npm audits must have no known unresolved vulnerabilities. Regression tests recreate every reviewed failure; actual local-EVM tests exercise unauthorized actions, malicious protocols/tokens, reentrancy, caps, queue records and rollback. Browser tests cover signing confirmations, roles, malformed input and failed receipts. A fresh independent review is mandatory.

## Release truthfulness
Local verification is not an independent contract audit or live-chain settlement proof. Those are recorded external release gates, along with explicit authorization for funded transactions or publishing. No claim of an unhackable system is permitted. The deprecated package remains unapproved for mainnet until all gates are evidenced.
