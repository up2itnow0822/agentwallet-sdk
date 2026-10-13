# Threat model

The asset boundary is a non-upgradeable AgentVault. An immutable external owner configures budgets, recipients, protocols, price floors and bridge destinations. Operators are replaceable gas signers. A compromised operator can perform only the operations and economic exposure explicitly permitted on-chain. Budgeted spending is still spending: a bad agent can waste its entire granted limit or choose a poor trade above the minimum price floor.

## Threats addressed

Unauthorized callers, arbitrary operator calldata, budget bypass, stale/replayed queued approvals, reentrancy, transfer-tax/extra-debit tokens, lingering allowances and failed swap side effects are enforced by the contract and adversarial local-EVM tests. SDK checks reject chain/code substitution, unsupported operations, failed receipts and false queued settlement. RPC responses remain a trusted evidence source; contract guards also execute independently on-chain.

HTTP resources and registry metadata may be adversarial. Node network retrieval rejects private/reserved/transition addresses, credential URLs, unexpected schemes/ports, oversized content, unsafe redirects and excessive total execution time. Validated DNS answers are pinned to the connection while hostname TLS checks remain. Agent runtimes receive explicit origin/recipient/token spending permissions, not arbitrary network payment authority.

Payment requests may be forged, repeated or concurrent. Exact bigint limits and persistent reservations charge unknown outcomes across restarts. A compatible merchant verifies a resource-bound EIP-712 signature, fresh confirmed exact calldata/transfer evidence and the pinned chain/vault, then durably consumes the challenge and transaction. In-process SpendingPolicy is supplemental; the host controls its independent owner-authorization verifier and authoritative shared accounting.

Identity claims may be self-signed fiction. The custom credential authenticates all body/proof fields but does not establish economic claims by itself. Trust verification requires expected issuer, verifier challenge, owner binding, pinned vault code and independent same-block balances/principal. Applications consume trust challenges atomically before authorizing actions.

Protocol responses may be stale, mismatched or malformed. The vault uses fixed protocol addresses and exact temporary allowances. Swaps enforce owner floors/deadlines; output stays in the vault. Bridges validate explicit source/destination environments, exact burn messages, official attestation provenance, Circle destination simulation/replay state and persist an intent before signing. Unknown submission outcomes require reconciliation, not automatic retry.

## Trusted parties and residual risk

The owner can use arbitrary recovery calls and transfer assets; operators are not protected from a malicious owner. Immutable owner loss has no administrative reset. Keep the owner outside agent runtimes and migrate while its key remains available. A multisignature owner requires separate integration validation.

The host must isolate signing credentials, durable state and policy configuration from untrusted agent code. Passing a capability object inside the same unsandboxed process is not process isolation. Filesystem users with permission to replace accounting state can invalidate local policy assumptions; directory permissions and no-follow checks reduce accidental/cross-user exposure, not a fully compromised host. Crash locks fail closed and require inspected recovery.

Wallet extensions, dependency supply chains, RPC providers, TLS/DNS infrastructure, browser-origin integrity, configured protocols/token contracts and Circle are trusted external dependencies. Protocol upgrades, validator finality failures, censorship, oracle manipulation, MEV, pool insolvency, liquidity shortfall and normal market loss are not eliminated by SDK tests. Confirmations reduce reorg exposure; they do not remove it.

There is no custodial backend, lending guarantee, guaranteed yield or broad token support. HTTPS merchant delivery after payment is an application responsibility; a merchant can withhold service even after valid settlement. Test doubles verify interfaces and local guard behavior, not real production economics.

## Required evidence before mainnet

Complete funded testnet deployment/source verification and real transfer/swap/Aave/CCTP settlement, an independent contract/security audit, operational recovery exercises, signing isolation, maintained monitoring and explicit owner release approval. See release-readiness.md for the concrete checklist. No tested scope can guarantee freedom from future hacks.
