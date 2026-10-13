# Documentation contract
## Purpose
Keep architecture, SDK migration, security decisions and release evidence understandable and honest.
## Ownership
docs/; root owns GOAL.md and root README/SECURITY/CONTRIBUTING.
## Local Contracts
Document exact functional support, command names, dependencies, account roles, side effects and release gates. Distinguish confirmed local behavior from verified live-chain behavior. No unsupported chain count, fabricated test count, independent-audit or unhackable marketing.
## Work Guidance
User's autonomous @goal instruction controls execution; reversible implementation proceeds without extra design approval checkpoints. Record any departure from legacy APIs and give working replacement examples. Preserve threat boundaries and external blockers.
## Verification
Examples must compile or be checked by package smoke tests. Map each previous security finding to a regression test and implementation. Release readiness requires fresh evidence rather than statements.
## Child DOX Index
- security/AGENTS.md: threat model, finding-to-test mapping, review evidence and external release gates.
