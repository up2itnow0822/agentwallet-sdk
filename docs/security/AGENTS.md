# Security and release evidence
## Purpose
Explain the threat boundary, previous findings, tested repairs and remaining public release gates.
## Ownership
Root owns this directory and GOAL.md. Domain agents supply verified implementation evidence.
## Local Contracts
Every repaired finding maps to current code and a named regression. Distinguish mocked RPC, actual local EVM, live chain and independent audit evidence. A release gate stays open until its evidence exists; a passing SDK flag never counts as an audit.
## Work Guidance
Record concrete blockers without inventing a guarantee of zero future vulnerabilities. Keep incident and recovery actions usable. Reviewer artifacts are project-backed audit records and remain read-only to code reviewers except their designated JSON output.
## Verification
Check commands and file paths against the current tree; record final verification after all edits. remediation.md maps both the original findings and the release-candidate/repair-review findings R01–R19 to coverage; incomplete verification must remain explicit. ci-evaluation.md records the user's ten-cycle bound, concrete evaluated candidates and current-head checks/feedback evidence. Failed local integration gates or newly retained actionable repair-review findings consume a cycle; focused regressions/polls/transport retries do not. No secrets, production keys or exploit transactions in reports.
## Child DOX Index
None.
