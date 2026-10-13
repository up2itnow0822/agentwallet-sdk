# Secure Wallet Implementation Plan

> For agentic workers: implement independently owned tasks under the active @goal; use test-first cycles and follow the full DOX chain. Root integrates and conducts independent review.

Goal: repair all reviewed findings and produce a functional, verifiable agent vault SDK and wallet console release candidate.
Architecture: owner-controlled AgentVault is the asset boundary; SDK modules share strict guarded execution; a browser console connects an external wallet. Durable spending decisions and trusted identity evidence supplement on-chain limits.
Tech stack: TypeScript, viem, Solidity/OpenZeppelin, Node tests with a real local EVM, React/Vite browser console.
Spec: docs/superpowers/specs/2026-10-12-secure-wallet-design.md

## Global constraints
No mainnet writes, registry publish or production deployment. No secrets persisted or exposed. Every autonomous asset operation calls AgentVault. No ts-nocheck, fake verified facts or silent compatibility fallback. Local and external release gates remain distinct.

## Review focus
Concurrent/restarted budgets; untrusted origins and DNS/redirect changes; wrong-account/chain writes; failed protocol submissions and recovery; replayed/stale/altered signatures and approvals. Test these in their owning tasks.

## Tasks
1. Contracts: write failing actual-EVM tests, implement AgentVault per contracts/AGENTS.md, compile and export ABI, prove caps/roles/rollback/exact allowances and complete queued calldata. Own contracts/, scripts/contracts/, src/contracts/ and tests/contracts/.
2. Payments/policy: write failing regression tests for S01/S05/S11; implement durable atomic reservations, strict bigint validation and immutable authenticated drafts; secure and accurately label x402 flows. Own src/x402/, src/policy/ and src/__tests__/payment*.test.ts.
3. Identity/network/trust: write failing regressions for S02/S03/S09/S10; implement strict signed credentials, wallet-bound proof, independently observed economic data, actual staking accounting and SSRF-safe resources. Own src/identity/, src/verify/, src/staking/ and identity/trust/staking source tests.
4. Protocols/plugin: write failing swap/bridge/runtime tests for S04/S06/S07/O01; route swaps/bridging through executeVaultOperation, current CCTP interfaces/addresses/finality, dedicated destination clients and durable burn recovery, scoped runtime wallets. Own src/swap/, src/bridge/, src/plugins/ and protocol/plugin tests.
5. Console: browser-test-first validation/confirmation behavior; implement responsive accessible real-wallet UI and clearly separated demonstration mode; production writes use generated vault ABI and verified manifests. Own apps/wallet-console/.
6. Root: own src/index.ts, src/types.ts, src/abi.ts, src/wallet/, package/build/CI/dependencies, docs and integration verification. Run fresh baseline, guard core execution and all exports, remove tracked vendors/generated files, pin secure dependencies and ensure full audits pass.
7. Integrate: run strict SDK build/tests, actual-EVM contract suite, UI build/browser tests, packed artifact/import/export smoke tests, secret scan and independent whole-branch review. Fix every actionable finding and update readiness/GOAL/DOX evidence. Prepare a reviewable branch/PR; publish/deploy only after user-authorized external release gates.

For every implementation task: add a specific failing test, run and record expected failure, implement only its required behavior, run targeted tests and the aggregate suite after integration. Root performs a final current-tree verification before any completion claim.
