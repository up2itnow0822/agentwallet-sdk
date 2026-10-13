# SDK work contract
## Purpose
Provide typed, validated wallet operations and truthful identity, payments and protocol APIs.
## Ownership
SDK implementation and source tests; root owns package/CI and shared wallet execution/types/ABI.
## Local Contracts
Public asset-changing modules accept AgentWallet from src/types.ts and invoke executeVaultOperation(wallet, operation, args) from src/wallet/execution.ts. Operation returns {txHash, receipt}. Allowed operations: agentExecute, agentTransferToken, agentSwap, agentSupply, agentWithdraw, agentBridge. No direct signer capital transactions. Imports use .js suffix. Native token is zero address. APIs are version 5 with intentional safe migration. Node agent SDK targets Node >=22; console imports only browser-safe ABI/viem modules.
## Work Guidance
Use bigint base units and immutable snapshots. Budget reservations must survive restarts/shared clients and remain charged while a submission's outcome is unknown. Identity signatures are separate from independently checked economic facts. Untrusted registration/network resources require pinned public-address HTTPS retrieval, bounded redirects/size/time. Agent keys must not authorize owner changes.
## Verification
Regression tests belong in src/__tests__ with distinct domain prefixes. Test negative, malformed, stale, concurrent, redirected and replayed inputs; no mainnet writes. Root runs the aggregate suite and strict compiler after integration.
## Child DOX Index
- wallet/AGENTS.md: pinned guarded execution and owner operations.
- contracts/AGENTS.md: deterministic browser-safe vault ABI and bytecode exports.
- x402/AGENTS.md: custom guarded HTTP payment settlement and durable service budgets.
- policy/AGENTS.md: strict immutable spending decisions/drafts.
- identity/AGENTS.md: signed credential envelopes, registry and public-address pinned resources.
- verify/AGENTS.md: independently observed chain/owner-bound trust evidence.
- staking/AGENTS.md: confirmed AAVE vault positions.
- swap/AGENTS.md: guarded Router02 quotes and trades.
- bridge/AGENTS.md: resumable CCTP burns, attestations and minting.
- plugins/AGENTS.md: isolated runtime capability facade.
