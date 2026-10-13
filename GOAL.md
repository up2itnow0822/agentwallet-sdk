# Active goal — secure agent wallet release

Status: active
User request: Repair every finding in the agentwallet-sdk review and deliver a public-release-ready crypto project with usable transaction, storage and trading features plus an informational UI.

## Verifiable completion condition
- [ ] All S01–S11, O01 and D01 findings repaired with meaningful passing regression tests and migration documentation.
- [ ] Every autonomous asset operation uses an on-chain guarded vault; owner/operator controls and failure rollback pass real local-EVM adversarial tests. (derived)
- [ ] Strict TypeScript, source-only tests, package exports, reproducible build, packed-artifact smoke test, dependency audits and honest failing CI pass. (derived)
- [ ] User-friendly responsive wallet console exposes real wallet/RPC operations and accurate errors, balances, permissions and receipts; browser tests pass.
- [ ] All features have correct protocol integration, recovery state and documented limits; unsafe or unsupported deployments fail closed.
- [ ] Independent code review has no unresolved actionable findings; DOX documentation and release guidance are current. (derived)
- [ ] Verified funded testnet deployment, source/bytecode match and protocol settlement evidence, followed by an independent contract audit and explicit release authorization before mainnet/registry publication. (external release gate)

## Assumptions and authority
Target is the linked agentwallet-sdk repository, not the separately maintained replacement. A secure major-version migration may break unsafe APIs. Browser wallet connects an external owner wallet; agents never receive owner credentials. Secure vault defaults deny; meaningful market risk persists within explicitly granted budgets. Zero vulnerabilities forever is not verifiable and is replaced by no known unresolved findings in the tested scope plus independently checked deployments. User's @goal authorizes autonomous reversible development and delegation; public deployment, registry publication and financial transactions remain gated.

## Decisions
Use an isolated git worktree security/release-hardening. Add AgentVault rather than claim absent legacy contracts are secure. Add browser-only wallet-console and no custodial backend. Keep default protocol fees zero; remove hardcoded collector and synthetic yield. Default to Base Sepolia and document mainnet release gates. Use strict typed SDK APIs and durable budget reservations.

## Last evaluation
Original findings have current implementations and regression coverage on security/release-hardening from fb520855. SDK source suite passed 146 unique cases before two additional receipt/deployment regressions, which now also pass. Actual local-EVM vault suite passes 12 adversarial cases; the actual npm tarball installs and imports all 10 typed/runtime entrypoints; full SDK audit is zero. Console includes real local-EVM transaction tests and is finishing destination bridge recovery coverage. No live chain or independent audit evidence exists yet. Aggregate final verification and independent review remain in progress.

## Blockers
No independent contract audit or verified live testnet deployment supplied. These do not block local implementation. They block claiming final public mainnet release readiness; no financial actions will be attempted without explicit authorization.

## Next actions
Freeze integrated tree, run independent whole-branch reviewers, reproduce and repair every actionable finding, run the complete current-tree verification, record evidence and prepare the reviewable GitHub branch/draft PR. Keep external public release gates explicitly blocked until their real evidence and authorization exist.
