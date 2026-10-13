# Changelog

## [5.0.0-rc.1] - Unreleased

- Replace unsafe funded-EOA execution with a non-upgradeable owner/operator AgentVault, bounded protocol operations, exact temporary allowances and complete replay-safe approval queues.
- Add durable guarded HTTP payments and a compatible merchant verifier, SSRF-safe retrieval, authenticated custom credentials, independently checked trust and real Aave balance reads.
- Correct Router02/CCTP V2 integrations, persistent bridge recovery and runtime account isolation; remove SDK protocol fees and fabricated trust/yield claims.
- Add a responsive external-wallet testnet console with deployment, transaction review, permissions, trading and bridge recovery.
- Pin audited dependencies, remove tracked vendor/build output, verify the actual packed artifact and fail CI on every required check.
- This candidate breaks legacy APIs intentionally. See docs/migration.md and the open external audit/live-testnet gates in docs/security/release-readiness.md.

The entries below describe legacy release history and do not establish current security or support.

## [4.0.5] - 2026-03-23

> ⚠️ **DEPRECATED** — This package is no longer maintained. Use [agent-wallet-sdk](https://github.com/up2itnow0822/agent-wallet-sdk) instead.

### Added
- Initial release
