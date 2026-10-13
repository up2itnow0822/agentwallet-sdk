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

## Fresh review of the release candidate

The initial candidate was frozen as local commit cf3572d5 and published with the same tree as a73b8f4a41413c2bb6fb8666306201eb895e08a2 in PR #9. Eleven review lenses completed; a separate validation pass retained all thirteen actionable findings below. These are fresh-context in-process reviews, not an independent human security audit. Existing green tests and hosted CI did not cover every reproduced failure.

| ID | Finding | Repair and regression coverage |
| --- | --- | --- |
| R01 | Inspected approval details could belong to a different vault | Chain/vault binding, session invalidation, fresh request reads and actual-EVM two-vault/deferred-inspection browser cases |
| R02 | Lost broadcast responses permitted another payment or burn | Durable pre-broadcast public intent, exact hashless recovery and per-review spent intent identity; intents.spec.ts actual-EVM payment/burn/creation/receiving, storage/reload/lock and cross-tab cases |
| R03 | Replacement receipts falsely finalized bridge recovery | Original receipt hash binding across burn/mint/recovery/resume, consumed CCTP nonce and persisted terminal-state revalidation; protocol.bridge.recovery/testnet suites |
| R04 | Merchant confirmation depth exceeded the client's wait | Required signed/stored depth, separate mining/proof deadlines, conservative window checks before spending, exact original-transaction confirmation and proof-only in-session retry; payment.confirmation.test.ts |
| R05 | A late deployment draft retained a previous owner | Captured owner/provider/session, stale-result rejection and final live account checks; deferred and silent account-change actual-EVM browser cases |
| R06 | Post-settlement errors lost the payment hash | X402SubmittedPaymentError and trusted local response receipt provenance through both fetch wrappers; payment.recovery.test.ts covers persistence/signing/transfer/delivery failures and forged/copied headers |
| R07 | The documented payment configuration could not construct | Explicit service budgets and trusted absolute 0700 directory; packed-document runtime construction, strict TypeScript consumer checks and a red/green tarball check for every linked release guide |
| R08 | Reverse Tab escaped review dialogs | Shared background-inert focus containment, no-tabbable behavior, busy close protection and opener restoration; browser cases for App, deployment and bridge recovery |
| R09 | Late swap quotes overwrote a different trade | Form/input/session binding and stale-result rejection; deferred quote browser cases |
| R10 | Closing setup lost unresolved deployment context | Durable original deployment intent/hash and reopening/reload recovery; intents.spec.ts creation/remount/reload and cross-tab recovery cases |
| R11 | Snapshot loading serialized fifty queue RPCs | Bounded parallel same-block reads with stable ordering and fail-closed loading; transactions.spec.ts checks fifty reads, original ID order, one block, maximum five active calls and whole-load rejection |
| R12 | Wallet events and queued decisions lacked browser coverage | Injected-provider event emitter, deferred account/network/disconnect/late-injection cases, plus actual-EVM owner approval/cancellation, balances, replay prevention and operator rejection |
| R13 | Read-only mint recovery demanded more gas funds | Separate signing readiness from receipt reconciliation; successful/reverted recoverMint and resume cases with an empty gas signer |
| R14 | Mutable response fields and reflected construction could forge locally verified clone metadata | Frozen JavaScript private state, authoritative WeakMap receipt reads and a module-private construction token; six public-wrapper field-mutation/constructor/unbranded-clone regressions |
| R15 | Delayed form prechecks crossed into a different vault/session | Early generation capture and original prepared chain/vault/signer binding; context.spec.ts deferred two-vault trade/bridge/input regressions and pre-journal vault/signer/chain mismatch checks |
| R16 | Wallet events left confirmed receipts permanently submitted in Activity | Public receipt completion independent of view invalidation and explicit receipt revalidation; context.spec.ts post-broadcast account/disconnect completion, terminal recheck and fresh review regressions |
| R17 | Concurrent receipt checks could overwrite proven terminal evidence from a stale unknown snapshot | Latest-entry immutable identity/hash/status/receipt-detail checks inside the journal commit lock; intents.spec.ts real mined payment with conflicting controlled receipts preserves the original confirmed id/hash and exact recipient credit |
| R18 | Another tab's recovery re-enabled the original hashless payment or creation review | Durable claim callback supplies a copied original intent before signing; all three dialogs retain consumed review identity through recovery. intents.spec.ts cross-tab payment/creation cases were observed making two actual writes, now remain at one; receiving retains one burn and one mint |
| R19 | A full recovery transaction hash overflowed the mobile viewport | Scoped hash-link wrapping preserves the full hash, explorer URL and input. console.spec.ts observed width 623 on a 390-pixel screen before repair, now fits 390 and 1440; independent production-preview screenshots confirm no horizontal overflow |

R03/R13 repairs passed a fresh read-only adversarial review and all 46 bridge tests. The first ten new bridge regressions were observed failing before their repairs; the fixtures now model original transaction hashes and actual nonce-state transitions. Final integrated verification passes all 220 SDK cases, 12 actual local-EVM contract cases, 6 UI unit and 84 browser cases; the repaired code revision also passes both hosted verify checks, including all 85 browser cases after the responsive regression.

R14 was discovered by the subsequent repair review, reproduced and fixed before publishing the repaired revision. The seven payment test files now pass 85 cases; the full SDK suite passes 220. A fresh adversarial recheck verified its closure, including reflected construction, same-description authority symbols, prototype-only forgery and repeated clones. Fresh bridge, payment and final console source reviews find no current actionable issue. Integrated browser verification passes all 84 local cycle-5 cases and all 85 hosted cycle-6 cases. These are local in-process reviews, not an independent external audit.

Fresh review results and final verification totals are recorded in release-readiness.md after integration. All claimed original and fresh repairs require their current tests to remain green.
