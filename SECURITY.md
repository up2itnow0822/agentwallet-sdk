# Security policy

Version 5.0.0-rc.1 is a testnet candidate. The legacy v4 funded-EOA and synthetic-trust interfaces are not safe deployment paths and are intentionally rejected. No mainnet deployment, registry publication or independent contract audit was performed by this repair work.

The vault is non-upgradeable. Its owner has ultimate authority, including ownerExecute; operator budgets do not constrain the owner. Keep the owner in an external wallet, preferably governed by a reviewed multisignature setup. The immutable owner cannot be rotated: loss or compromise requires owner-authorized migration to another verified vault while the key still works. Never grant AI runtimes the owner key or an owner signing API.

Approve standard token and protocol deployments only after independently checking their addresses and deployed code. Pin the exact vault runtime hash from a trusted deployment record. Runtime hashes include immutable deployment parameters and differ between deployments. A hash copied from untrusted RPC output without independent verification is not an audit. Trusted RPC, honest configuration, wallet software, host isolation and third-party protocols remain security dependencies.

If an operator or workflow is compromised, pause the vault, revoke that operator and inspect submitted hashes, approvals, allowances and bridge records using the owner wallet. Policy changes invalidate old queue entries. The owner can use recovery calls while operators are paused. Do not delete an uncertain budget reservation or bridge record to make a retry work; reconcile the chain first. A lock file left by a crash requires explicit operator reconciliation before manual removal.

Use unique verifier-issued challenges and consume them atomically in the application when trust evidence authorizes an action. Custom credential signatures authenticate claims; they do not independently prove wealth, reputation or AI status. The guarded payment merchant already durably consumes its challenges and payment transaction hashes.

Report suspected vulnerabilities privately to the repository maintainer, using GitHub private vulnerability reporting when enabled. Include the affected commit, minimal disposable reproduction, impact and suggested mitigation. Never include a seed phrase, production key or real-funds exploit demonstration. Public issues should omit exploitable details until coordinated remediation.

See [threat model](docs/security/threat-model.md), [remediation evidence](docs/security/remediation.md), and [release readiness](docs/security/release-readiness.md). A clean audit or test suite cannot guarantee freedom from future vulnerabilities.
