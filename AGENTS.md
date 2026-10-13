# Agent Wallet project contract

## Purpose
Build a non-custodial agent wallet SDK, guarded on-chain execution, and browser wallet console. The owner retains authority; agents receive bounded operator permissions.

## Ownership
The root owns release policy, package/dependency configuration, CI, GOAL.md, cross-module interfaces and final verification. Read this file and every applicable child before editing; re-read the current chain for each new work scope.

## Local Contracts
- Follow the user's DOX hierarchy. Update the closest owning AGENTS.md whenever meaningful behavior, interfaces or workflow changes.
- This work implements the user's autonomous @goal request on security/release-hardening. Make reversible implementation decisions without additional checkpoints. No registry publish, mainnet financial transaction, production deploy, merge, or force push is authorized by this branch work.
- Never claim an unhackable system, an independent contract audit, live-chain verification or feature support without evidence. Record remaining release gates in GOAL.md and docs/security/release-readiness.md.
- No private keys in UI, source, output, persistent browser storage, logs or test artifacts. Test credentials must be clearly disposable.
- Funded account and gas signer are distinct. All autonomous asset operations must go through the guarded vault. Never fall back to direct funded-EOA execution on error.
- New major version may intentionally reject legacy unsafe APIs; document migration instead of retaining insecure behavior.
- Strict TypeScript; no ts-nocheck, untyped public arguments or disabled security checks to make tests pass.
- Write meaningful failing regression tests before fixing behavior; verify the tests become green. Do not add production-only test hooks.
- Independent agents own disjoint paths. Do not commit or change another agent's files. Root integrates and commits the whole tree.

## Work Guidance
Use current primary protocol documentation. Default to deny for spending, origins, recipients, chains, schemes, invalid input, unsafe URLs and unsupported functionality. Describe unsupported or unverified capabilities honestly. Keep dependencies small, pinned and audited. The console must be keyboard accessible, responsive, informative and explicit about signing/fees/transaction status.

## Verification
Baseline: npm test (17 unique source tests, duplicated to 34 by the old configuration); TypeScript. Required release verification evolves with implementation: strict typecheck, source-only regression suite, real local-EVM contract adversarial tests, UI build/browser flow, packed npm artifact smoke test, full and production npm audits, secret scan, and fresh independent review. Live testnet and independent deployed-contract audit are separate release gates.
CI uses frozen installs without lifecycle scripts, pinned action revisions, read-only repository permissions and a single strict npm run verify gate. No check may swallow a failing command. tmp is explicitly overridden to its audited patched 0.2.7 release.

## Child DOX Index
- src/AGENTS.md: SDK and integration contracts.
- contracts/AGENTS.md: guarded vault contracts and EVM tests.
- apps/wallet-console/AGENTS.md: browser-only user interface.
- docs/AGENTS.md: design, migration, security evidence and release instructions.
- scripts/AGENTS.md: clean builds, isolated packed-consumer verification and source secret scans.
