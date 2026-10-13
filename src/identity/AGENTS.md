# Identity and network contract
## Purpose
Provide DID key handling, custom signed credentials and ERC-8004 registry discovery without treating untrusted metadata as trust evidence.
## Ownership
src/identity/ and identity-prefixed source tests. Shared wallet ABI/types/execution and release docs belong to root.
## Local Contracts
Ed25519 keys use exact 0xed01 multicodec + 32-byte keys. Credentials are AgentWalletEd25519EnvelopeV1 custom JSON envelopes, NOT W3C Data Integrity/Ed25519Signature2020. Sign body plus every proof option; enforce key/issuer/controller consistency, assertion purpose, issuance/expiry and expected issuer/subject. Signature authenticity never proves economics or AI status.
Node-only fetchPublicHttpsJson validates all DNS answers and pins the socket to a public IP on every HTTPS redirect. Permit only port 443 and no credentials. Reject reserved IPv4, IPv6 and transition ranges; preserve hostname TLS checks. One total deadline covers DNS, headers, streaming and redirects. Hard caps: 1 MiB, 10 seconds, 5 redirects. No private-address escape hatch.
ERC-8004 clients require explicit nonzero verified deployments and trusted RPC URLs. register overloads and Registered event decoding follow https://eips.ethereum.org/EIPS/eip-8004 checked 2026-10-12. No placeholder known deployments. Registration awaits successful receipt and matching registry/owner event. Metadata is parsed with size/schema bounds; advertised endpoints are never automatically contacted.
## Work Guidance
Keep cryptographic authenticity, registry discovery and independently observed facts distinct. Do not introduce a private-network fetch escape hatch or claim a standard proof suite without an independently validated implementation.
## Verification
Run identity DID, proof-tampering, untrusted URL, DNS pin/rebind, timeout, streamed body, reserved address and ABI selector source tests. No funded registry/mainnet writes.
## Child DOX Index
None.
