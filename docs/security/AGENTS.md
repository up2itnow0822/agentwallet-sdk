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
Check commands and file paths against the current tree; record final verification after all edits. No secrets, production keys or exploit transactions in reports.
## Child DOX Index
None.
