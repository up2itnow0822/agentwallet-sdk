# Trust verification contract
## Purpose
Separate authenticated claims from independently observed on-chain ownership and economic facts.
## Ownership
src/verify/ and trust/verify-prefixed source tests.
## Local Contracts
verifyAgent creates a custom signed chain snapshot using explicit trusted PublicClient, wallet/chain/codehash and token/aToken deployment configuration. It requires an owner signature for the exact walletBindingMessage domain, DID, wallet, chain, verifier challenge and expiry (maximum one hour).
verifyTrustBundle is asynchronous and fails closed without verifier-owned options: expectedIssuer, expectedChallenge, trusted PublicClient, expected wallet/chain/codehash and deployment config. Independently query chain, block hash, codehash, owner(), principal and aToken balance at the signed block; enforce confirmations, freshness and matching amounts. Check owner signature through that trusted chain's verifyMessage (supports ERC-1271). Use a fresh verifier nonce/challenge and consume it in the caller's authorization store if a bundle authorizes an action; this read-only verifier does not consume challenges.
verifyTrustBundleSignature authenticates only the custom credential. No economic facts, DID-to-wallet association, AI-only distinction, fabricated task count, age estimate or reputation score are inferred from a valid agent signature. Trusted RPC and asset deployment integrity are external trust inputs; replay-resistant authorization belongs to the caller.
## Work Guidance
Treat verifier configuration and RPC as explicit trusted inputs. Document nonce consumption in the application's authorization store; signature-only checks never authorize an economic claim.
## Verification
Run self-signed false-economic-claim regression, correct-owner success, mismatched wallet/chain/challenge/codehash, expiry, replaced block and unavailable provider tests. No secrets or funded writes.
## Child DOX Index
None.
