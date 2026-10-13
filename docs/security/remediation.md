# Review findings and repair evidence

Original reviewed commit: fb520855b2077efc810b0cf73c12d37b448c1f3c. This branch replaces unsafe v4 execution with the explicit v5 vault design. The archived review is not rewritten to erase its findings.

| Finding | Repair | Regression evidence |
| --- | --- | --- |
| S01 concurrent/restarted HTTP budgets | Atomic durable reservations by vault/chain/asset; charge before submission and preserve unknown outcomes | payment.budget.test.ts, payment.client.test.ts; real multi-process race, restart/corruption cases |
| S02 SSRF and unsafe resource retrieval | Public-address HTTPS DNS pinning; bounded total time, bytes, redirects and strict URL/DNS checks | identity.fetch/network/security tests and payment.transport.test.ts |
| S03 self-signed fabricated trust | Independent owner binding, expected issuer/challenge, pinned vault, chain/block and real balances/principal | trust.chain/security tests; signature-only API distinguished |
| S04 funded EOA execution bypass | All source capital uses AgentVault; bounded operation whitelist, pinned chain/code and no fallback | core.security.test.ts, protocol/staking tests, actual-EVM authorization tests |
| S05 negative/NaN policy amounts | Positive uint256 bigints, strict limits/periods and deny-empty permissions | payment.policy/budget/client tests |
| S06 runtime singleton contamination | WeakMap-scoped immutable capabilities, configuration-drift rejection and active non-owner operator checks | plugin.runtime.test.ts |
| S07 non-atomic swap fee/unlimited approvals | Atomic guarded swap; SDK fee zero; exact approvals cleared and output held in vault | protocol.swap.test.ts, actual-EVM failed-swap/allowance/malicious-router tests |
| S08 false execution/hidden queued calldata | Confirmed successful receipts; queued status/error; complete pending calldata and single-use owner approval | core.security.test.ts and actual-EVM queue contents/replay/expiry tests |
| S09 fake staking gate/synthetic balances | Real Aave vault operations and same-block principal/aToken reads; no DID gate or invented APY | staking.vault/test suites and actual-EVM protocol destination tests |
| S10 unsigned credential proof metadata | Custom fully signed envelope; controller/issuer/purpose/time/method validation | identity.did/security tests and proof-field tampering |
| S11 mutable policy/audit/drafts | Frozen copies, reserved draft capacity, independently verified exact approval and one-use consumption | payment.policy.test.ts |
| O01 obsolete CCTP integration | Current V2 void-return ABI, domain/address mapping, full nonce, official modified attestations, dedicated destination signer and durable recovery | protocol.bridge/testnet/recovery tests |
| D01 vulnerable dependency versions | Exact audited versions and patched compiler helper override; remove tracked vendors and compiled test duplicates | full/production npm audits for SDK and console; packed-consumer verification |

Source tests involving RPC use controlled viem fixtures unless specifically labeled actual EVM. Payment merchant tests use real cryptographic signatures but synthetic controlled chain evidence. Contract tests deploy and execute real bytecode with adversarial protocol/token contracts on EthereumJS VM. Console transaction tests include an EIP-1193 adapter to that actual local EVM. None of these count as a funded live-chain settlement or independent audit.

Fresh review results and final verification totals are recorded in release-readiness.md after integration. All claimed original repairs require their current tests to remain green.
