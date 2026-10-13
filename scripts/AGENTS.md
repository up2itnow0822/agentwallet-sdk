# Release verification scripts
## Purpose
Build reproducible artifacts and fail release checks when source, packaging or secret handling is unsafe.
## Ownership
Root owns clean, package-smoke and source secret-scan scripts. Contract compiler/test scripts follow contracts/AGENTS.md.
## Local Contracts
Use argument arrays and no shell interpolation for child commands. Never run lifecycle scripts while installing or packing review inputs. Clean only generated dist and contract artifacts. Package smoke tests must install the actual tarball into a fresh consumer, require the linked contribution, migration, identity and security release guides, check runtime and TypeScript exports, construct the payment configuration read from the packed migration document with no signing or network calls, and typecheck every TypeScript example in that document, including receipt/proof-only recovery; no duplicated compiled tests may ship.
## Work Guidance
Fail loudly on missing files, commands or checks. Secret scans exclude clearly disposable test fixtures and generated public ABI/bytecode; never print a matched secret value. Audit both SDK and console lockfiles. No registry publish or deployment command belongs in verification.
## Verification
npm run build; npm run test:package; npm run test:secrets. CI invokes the same checks after frozen installs.
## Child DOX Index
None. Contract script behavior is indexed in contracts/AGENTS.md.
