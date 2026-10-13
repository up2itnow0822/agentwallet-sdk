# Guarded swap domain
## Purpose
Quote and submit owner-bounded ERC20 Uniswap V3 swaps through AgentVault.
## Ownership
src/swap/ and protocol.swap source tests. Root owns wallet types, execution and ABI.
## Local Contracts
SwapModule(wallet: AgentWallet, config?: {maxSlippageBps?: number}) rejects raw EOA constructors and unsupported config. swap/executeSwap accept ERC20 tokens, positive uint256 bigint and options slippageBps, feeTiers, deadlineSecs. attachSwap uses the same guard. SDK fees are zero; feeWallet/feeBps overrides and external approval/fee writes are removed. Slippage defaults 50bps, never exceeds 500bps or the stricter configured cap; deadline duration 1..3600s defaults 300s. Quote uses nonpayable QuoterV2 simulateContract, validates chain and vault router, and returns frozen bigint output. Vault agentSwap receives a real deadline and retains output; exact scoped allowances are contract-side.
## Work Guidance
Use only explicit verified Router02/QuoterV2 deployments. Quote through simulateContract; never replace the guarded execution boundary with a funded signer or persistent allowance.
## Verification
Trusted deployments are Base8453 and BaseSepolia84532 from https://developers.uniswap.org/docs/protocols/v3/deployments/v3-base-deployments (checked 2026-10-12). Other swap chains are intentionally unsupported. Four regression cases initially failed against original unsafe module and now pass. Expanded seven-case suite also exercises quote-expired deadline, non-bigint/native input, stricter slippage cap, substituted router and failed vault execution without fee/approval writes. Local mocks prove client behavior, not live pool settlement or deployed contract correctness. Root integrates local EVM contract tests and external release gates.
## Child DOX Index
None.
