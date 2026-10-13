# Release readiness

Current status: **testnet release candidate; public mainnet release blocked**. The goal is no known unresolved actionable defects in the reviewed and tested scope, not a promise of an unhackable project.

## Local gates

The authoritative command is npm run verify on Node 24 after frozen SDK and console installs. It must pass strict TypeScript, source-only regressions, actual local-EVM adversarial contract tests, clean deterministic SDK/contract build, actual packed-consumer runtime and declaration imports, source secret scan, console build/unit/browser flows and full/production dependency audits. The source secret scan is not a history-wide secret audit.

Cycle 5's settled candidate passed the complete command on 2026-10-13:

| Check | Evidence |
| --- | --- |
| SDK typing and regressions | Strict TypeScript; 220 cases in 23 unique source test files, including 85 payment and 46 bridge cases |
| On-chain controls | 12 adversarial cases executing real compiled Solidity on local EthereumJS VM |
| Reproducible artifact | Clean pinned compiler/SDK build; actual 168-file tarball, 10 runtime/typed entrypoints, constructor-only payment example and every migration TypeScript snippet |
| Source credential scan | 140 indexed paths; disposable test fixtures excluded, no matched credential values printed |
| Console | Strict production build, 6 UI unit and all 84 browser cases, including real local-EVM transactions and lost broadcast responses |
| Dependencies | SDK and console full/production audits: four checks, each zero reported vulnerabilities |
| Repair review | Fresh in-process bridge, payment and final console reviews: no unresolved actionable findings; R01–R19 traced in remediation.md |
| Final responsive recovery check | Cycle 6: observed red 390→623 horizontal overflow; measured regression and production-preview visual QA now fit 390px mobile/1440px desktop, preserving complete hash text and link |

GitHub runs the same command with frozen installs and read-only permissions. The only subsequent UI change wraps recovery links and adds the measured responsive regression; its strict build passes. The repaired revision must also pass the published current head's nonempty hosted checks and inspected PR feedback before the bounded evaluation stops. The [evaluation record](ci-evaluation.md) and [PR #9](https://github.com/up2itnow0822/agentwallet-sdk/pull/9) carry hosted evidence. An expired external review-bot trial is not an approval.

The initial frozen candidate had eleven review lenses plus separate finding validation; follow-up repair reviews and observed red/green regressions closed the retained findings. These are in-process code reviews, not an independent contract/application audit. RPC fixtures and local protocol doubles do not prove live protocol settlement. An owner-supplied mainnetAuthorized SDK flag is not release evidence. UI mainnet writes remain disabled.

## External gates

Before any mainnet funding or registry/public deployment:

1. Choose an audited owner signing setup and separate gas operator; verify host/process isolation and backups. Exercise owner pause/revoke/recovery and immutable-owner migration.
2. Authorize and fund a testnet deployment. Verify compiler inputs, published source and exact deployed runtime hash including immutable addresses against independent explorers/RPC. Publish a reviewed public deployment manifest.
3. Execute and save confirmed live evidence for native/ERC20 transfer, rejected unauthorized/overbudget operation, queued owner approval, Uniswap quote/swap/rollback, Aave supply/redemption with correct token/aToken, and CCTP source burn through Circle sandbox attestation to destination mint/recovery. Validate failure/reorg/RPC-loss recovery without duplicate burns or payments.
4. Test the HTTPS merchant with the SDK against the live testnet vault and concurrent persistent clients, including replay, rejected proof and paid-resource delivery. Check deployment-origin integrity, CSP, TLS and monitoring.
5. Commission an independent contract and integrated application security audit. Resolve every actionable finding, freeze compiler/dependencies and repeat verification plus exact deployment checks after fixes.
6. Audit git history for exposed credentials and rotate anything discovered. Validate lockfile/registry provenance and the actual tarball intended for publication.
7. Establish monitoring and incident response for owner/operator changes, policy updates, pending approvals, on-chain allowances, unknown submissions, merchant delivery, bridge recovery and protocol changes. Document rollback/migration with no silent accounting reset.
8. Obtain explicit release approval for the concrete audited deployment and artifact. Only then merge/publish/fund mainnet. CI does not perform these actions.

No funded live transaction, production deployment, mainnet publication or independent audit has been performed in this workspace. These require credentials/funding or third-party work outside the reversible repair scope.
