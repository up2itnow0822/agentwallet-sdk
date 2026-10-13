# Release readiness

Current status: **testnet release candidate; public mainnet release blocked**. The goal is no known unresolved actionable defects in the reviewed and tested scope, not a promise of an unhackable project.

## Local gates

The authoritative command is npm run verify on Node 24 after frozen SDK and console installs. It must pass strict TypeScript, source-only regressions, actual local-EVM adversarial contract tests, clean deterministic SDK/contract build, actual packed-consumer runtime and declaration imports, source secret scan, console build/unit/browser flows and full/production dependency audits. The source secret scan is not a history-wide secret audit.

Final verification and independent fresh-context reviewer results are pending integration. Do not infer readiness from this placeholder or from an owner-supplied mainnetAuthorized SDK flag. UI mainnet writes are disabled.

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
