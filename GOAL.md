# Active goal — secure agent wallet release

Status: active
User request: Repair every finding in the agentwallet-sdk review and deliver a public-release-ready crypto project with usable transaction, storage and trading features plus an informational UI.

## Verifiable completion condition
- [x] All S01–S11, O01 and D01 findings repaired with meaningful passing regression tests and migration documentation.
- [x] Every autonomous asset operation uses an on-chain guarded vault; owner/operator controls and failure rollback pass real local-EVM adversarial tests. (derived)
- [ ] Strict TypeScript, source-only tests, package exports, reproducible build, packed-artifact smoke test, dependency audits and honest failing CI pass. (derived)
- [x] User-friendly responsive wallet console exposes real wallet/RPC operations and accurate errors, balances, permissions and receipts; browser tests pass.
- [x] All features have correct protocol integration, recovery state and documented limits; unsafe or unsupported deployments fail closed.
- [x] Independent code review has no unresolved actionable findings; DOX documentation and release guidance are current. (derived)
- [ ] Verified funded testnet deployment, source/bytecode match and protocol settlement evidence, followed by an independent contract audit and explicit release authorization before mainnet/registry publication. (external release gate)

## Assumptions and authority
Target is the linked agentwallet-sdk repository, not the separately maintained replacement. A secure major-version migration may break unsafe APIs. Browser wallet connects an external owner wallet; agents never receive owner credentials. Secure vault defaults deny; meaningful market risk persists within explicitly granted budgets. Zero vulnerabilities forever is not verifiable and is replaced by no known unresolved findings in the tested scope plus independently checked deployments. User's @goal authorizes autonomous reversible development and delegation; public deployment, registry publication and financial transactions remain gated.

## Decisions
Use an isolated git worktree security/release-hardening. Add AgentVault rather than claim absent legacy contracts are secure. Add browser-only wallet-console and no custodial backend. Keep default protocol fees zero; remove hardcoded collector and synthetic yield. Default to Base Sepolia and document mainnet release gates. Use strict typed SDK APIs and durable budget reservations.

## Last evaluation
Draft PR #9 publishes the initial frozen tree as a73b8f4a41413c2bb6fb8666306201eb895e08a2. Its push and pull-request verify checks both passed on GitHub; there are no inline review threads or PR conversation comments. The only external bot review reports an expired trial, not a security approval. That revision passed 148 SDK, 12 actual local-EVM contract, 6 UI unit and 22 browser cases plus packed-consumer checks and all four dependency audits.

The settled cycle-5 candidate passes complete npm run verify: strict typing, 220 SDK tests in 23 unique files, 12 actual local-EVM contract cases, a clean build, 168 packed files/all 10 runtime and typed entrypoints, constructor-only payment documentation plus both compiled snippets, the source credential scan, strict console build, 6 UI unit and all 84 browser cases, and all four dependency audits reporting zero vulnerabilities. Fresh in-process bridge/payment/final-console reviews have no unresolved actionable finding; these do not count as an independent external contract/application audit. Original and R01–R19 repairs have named meaningful regression evidence in docs/security/remediation.md. The final cross-tab payment/creation regressions previously made two actual writes and now make one; contradictory stale receipt checks retain the original confirmed identity and exact recipient credit.

Final production-preview visual QA then found R19: a valid known transaction hash expands the recovery panel to 623 pixels on a 390-pixel viewport. Cycle 6 fixes only that anchor wrapping; its new measured browser case and independent production-preview visual QA pass at 390px mobile and 1440px desktop with the full hash and link retained. Its strict UI build passes and the published full gate will include 85 browser cases. The repaired candidate must pass its own published current-head hosted checks and inspected PR feedback before the bounded request is complete; initial-head checks cannot substitute.

## Blockers
No independent contract audit or verified live testnet deployment supplied. These do not block local implementation. They block claiming final public mainnet release readiness; no financial actions will be attempted without explicit authorization.

## Next actions
Publish the verified settled repairs to PR #9, inspect all current-head checks and feedback, and continue within the ten-cycle bound if any actionable issue remains. Keep external public release gates explicitly blocked until their real evidence and authorization exist.

## Bounded evaluation request — 2026-10-13
The user asks to rerun evaluation until all GitHub CI checks pass and all actionable review comments are resolved, or after ten cycles. Treat this as steering of the active repair goal. Maximum cycles: 10; five earlier candidates evaluated; cycle 6 repairs and visual checks pass, with published-head CI/feedback verification next. A cycle judges a concrete repaired candidate; a failed local integration gate also consumes a cycle without requiring publication of that failing candidate. Focused red/green regressions, polling, transport retries and stale-head cancelled runs are not separate cycles. No merge, force-push, mainnet transaction or registry publish is authorized. Record each meaningful cycle in docs/security/ci-evaluation.md and stop early only on real current-head checks plus fully inspected feedback, not an empty check list.
