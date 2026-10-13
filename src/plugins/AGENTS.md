# Agent runtime plugin domain
## Purpose
Expose scoped guarded wallet capabilities to ElizaOS without owner credentials or global wallet state.
## Ownership
src/plugins/ and plugin source tests; payments domain owns X402Client policy/store and root owns guarded execution.
## Local Contracts
Host supplies runtime.agentWalletConfig = {wallet: AgentWallet,payment?: X402ClientConfig}. Raw private key/settings bootstrap was intentionally removed in v5. getAgentWallet(config,scope?) returns frozen {address,chainId,fetch} facade; createAgentFetch returns same bound capability. Default scope is config object; provider scope is runtime. WeakMap retains one X402Client per scope and rejects wallet/client/payment configuration drift. Both clients must identify the guarded wallet chain. Provider verification and every fetch require verified deployed guarded wallet, non-owner active operator. No full wallet clients, private keys or owner signing capability are placed on runtime. Host retains gas signer; owner configuration uses external wallet. Payment defaults remain deny-by-default and require approved origins, explicit limits and durable budget config per x402 domain.
## Work Guidance
Keep agent code isolated from the host signer, owner credentials and durable state. A frozen in-process facade is a capability contract, not a process sandbox.
## Verification
Three original regressions failed for private-key acceptance, global singleton contamination and runtime exposure. Additional test rejects owner/inactive gas signers before capabilities are exposed. Tests use disposable fixture metadata and mocked RPC; no real credentials or funded transactions. Plugin version targets host-injected configuration rather than old settings-based automatic account creation.
## Child DOX Index
None.
