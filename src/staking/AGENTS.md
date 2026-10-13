# Staking contract
## Purpose
Deposit/redeem through the guarded vault and report actual AAVE balances.
## Ownership
src/staking/ and staking-prefixed source tests.
## Local Contracts
AgentStakingPool requires explicit trusted {token,aToken} deployments. deposit({wallet,amount}) and withdraw({wallet,amount}) accept AgentWallet and positive uint256 bigint base units; use executeVaultOperation agentSupply/agentWithdraw and return confirmed {txHash,receipt}. Proceeds stay in vault. No direct funded signer approvals/supply/withdraw, DID-based AI-only claim, synthetic APY, local principal tracker, hardcoded fee or fee collector.
getBalance(wallet) checks provider chain and queries aToken.balanceOf(vault) plus vault.stakingPrincipal(token) at the same block. Yield is observed positive difference, principalShortfall captures loss. Caller must verify configured AAVE token/aToken deployments against its owner-authorized vault pool before use.
## Work Guidance
Use exact base units and confirmed vault receipts. Independently validate token/aToken/pool deployments before reporting economics; owner recovery can alter tracked principal relationships.
## Verification
Run staking migration, route/receipt, bigint rejection and real read-snapshot source tests plus root local-EVM vault AAVE tests. No mainnet writes.
## Child DOX Index
None.
