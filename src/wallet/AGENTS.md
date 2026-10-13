# Guarded SDK execution
## Purpose
Provide the single validated SDK signing boundary for vault asset operations and owner policy changes.
## Ownership
src/wallet/, core facade src/index.ts/src/types.ts/src/abi.ts and core.security tests are root integration scope.
## Local Contracts
executeVaultOperation(wallet,operation,args,{onSubmitted?}) returns {txHash,receipt}. Verify chain IDs, pinned runtime bytecode and securityVersion1 before simulating/signing. No agent attached native capital value and no direct EOA fallback. Error after broadcast preserves transaction hash; callback persists it before receipt waiting. Owner operations use a separate whitelist and verify owner matches signer.
The core chain map includes explicit Ethereum, Base, Arbitrum and Optimism Sepolia variants; protocol support remains the domain module's checked deployment allowlist.
## Work Guidance
Reject unsupported networks, empty bytecode, substitution and arbitrary operator function names. Receipt status must be success. Distinguish queued/executed events from matching vault only. Complete pending calldata is mandatory. Mainnet needs explicit owner configuration plus external release gates; the SDK authorization flag is not audit evidence.
## Verification
Core regressions cover reverted/queued false success, replaced receipts, deployment receipt-loss hash preservation, wrong chain/code hash, unsolicited signer funding and arbitrary calldata; aggregate tests, strict build and real-EVM vault tests are final proof. Receipt hashes must match the original submitted call; replacement success is not settlement proof.
## Child DOX Index
None.
