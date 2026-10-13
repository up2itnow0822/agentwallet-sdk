# Spending policy contract

## Purpose
Provide supplemental in-process spending decisions with immutable authenticated drafts.

## Ownership
Own SpendingPolicy and payment.policy regressions. Root owns SDK types/exports and on-chain authorization. Read root and src contracts before edits.

## Local Contracts
SpendingPolicy accepts strict SpendingPolicyConfig with an explicit merchantAllowlist, rollingCap:{maxAmount:bigint,windowMs:positive safe integer}, optional positive bigint draftThreshold, bounded historyLimit and optional synchronous authorizeDraft verifier. PolicyPayment binds HTTPS merchant origin, exact same-origin resource, recipient, asset, eip155 network and positive uint256 bigint base-unit amount. Empty allowlists deny. Config, drafts, payments, logs and snapshots are immutable copies.

check(payment) reserves approved spending or pending draft capacity synchronously, before yielding its Promise. Pending drafts continue charging the rolling cap until rejected or consumed, regardless of age. Drafts cannot bypass caps and bounded capacity denies. getPendingDrafts/getAllDrafts/getAuditLog return frozen data. Legacy approveDraft(id) is intentionally disabled: an agent-controlled mutable flag is not owner authorization.

consumeDraft(id,exactPayment,authorization) requires an independent owner verifier to authenticate the complete immutable draft (including ID and all economic/resource details). Reentrant, altered, invalid, unauthenticated or replayed consumption fails; a successful draft is consumed exactly once. rejectDraft only rejects pending drafts. Resolved draft history is bounded by capacity, with no automatic eviction/reuse of an ID. Approved spend history is bounded and capacity exhaustion denies. Audit history is bounded independently of charged spend records.

## Work Guidance
This policy is in-process supplemental decision support, not independently durable authorization or a standalone asset boundary. The owner must control configuration, merchant permissions and authorizeDraft; the agent must not receive authority to install a permissive verifier. Authorization proofs/signatures are supplied and verified externally; the SDK does not claim that a boolean callback authenticates a human. Agents execute assets only through AgentVault with externally owned on-chain permissions and limits. Multiple runtimes need the x402 durable accounting or an equivalent owner-controlled shared policy system. Invalid schema attempts are rejected without adding malformed payment data to the typed audit log.

## Verification
payment.policy.test.ts reproduces negative/nonfinite/non-bigint acceptance, mutable snapshots, unauthenticated approval and uncharged drafts; checks now deny invalid inputs, reserve drafts, bind owner-authorized details and consume once. No network or financial transaction is required.

## Child DOX Index
None.
