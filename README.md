# agentwallet-sdk

**The only non-custodial agent wallet SDK. Unlike Coinbase Agentic Wallets — your keys, your agent.**

Non-custodial agent wallet SDK. Your agent holds its own keys — no custodian, no KYC, no freeze risk.

[![npm](https://img.shields.io/npm/v/agentwallet-sdk?style=flat-square)](https://www.npmjs.com/package/agentwallet-sdk)
[![Discord](https://img.shields.io/discord/1475549260140253194?label=Community&logo=discord&color=5865F2)](https://discord.gg/958AACqf7Y)
![x402](https://img.shields.io/badge/x402-native-green?style=flat-square)
![CCTP V2](https://img.shields.io/badge/CCTP_V2-17_chains-red?style=flat-square)
![Tests](https://img.shields.io/badge/tests-629_passing-brightgreen?style=flat-square)
![Swap Fee](https://img.shields.io/badge/swap_fee-0.77%25-blue?style=flat-square)

```bash
npm i agentwallet-sdk
```

---

## Why agentwallet-sdk?

Most agent wallet solutions compromise on the thing that matters most: who controls the keys.

| | agentwallet-sdk | Coinbase Agentic Wallets | MoonPay Agents |
|---|---|---|---|
| **Key custody** | Agent holds own keys | Coinbase TEE (custodial) | MoonPay managed |
| **Freeze risk** | None — on-chain only | Yes — platform can freeze | Yes — KYC-gated |
| **Cross-chain** | 17 chains via CCTP V2 | Base only | Limited |
| **Swap fee** | **0.77%** | 0.875% | N/A |
| **x402 support** | Native (v2.0.1+) | No public x402 client | No |
| **Spend limits** | On-chain, enforced by contract | Platform-enforced | Platform-enforced |
| **Agent identity** | DID + Verifiable Credentials | No | No |
| **Agent staking** | AAVE USDC yield pool | No | No |
| **KYC required** | No | No | Yes |
| **MCP compatible** | Yes | No | No |

### 0.77% swap fee — 12% cheaper than MetaMask and Coinbase Wallet

Both MetaMask and Coinbase Wallet charge **0.875%** on every swap. We charge **0.77%** — the lowest fee from any major wallet SDK. Built for agents that execute hundreds of swaps autonomously. Every basis point compounds.

```typescript
import { SwapModule } from 'agentwallet-sdk/swap';

const swap = new SwapModule(publicClient, walletClient, accountAddress);

// 0.77% fee — cheaper than MetaMask, cheaper than Coinbase Wallet
const result = await swap.executeSwap(USDC_ADDRESS, WETH_ADDRESS, 1000_000000n);
```

### True non-custody

The wallet is an ERC-6551 token-bound account on-chain. The agent's private key lives in the agent's environment, controlled by whoever runs the agent. Nobody else has it. Spend limits are enforced by the smart contract — not by a platform policy that can change overnight.

```typescript
import { createWallet, createX402Fetch, NATIVE_TOKEN } from 'agentwallet-sdk';

const wallet = createWallet({ accountAddress: '0x...', chain: 'base', walletClient });

// x402 payments: agent pays APIs automatically, no human needed
const fetch = createX402Fetch(wallet, { globalDailyLimit: 10_000_000n });
const data = await fetch('https://api.example.com/premium');
// Server returned 402? Payment handled. Original request retried. Human not consulted.
```

### Agent identity — permanent DID + Verifiable Credentials

Every agent gets a permanent, self-sovereign decentralized identity derived directly from its wallet key. No external registry. No KYC. Just cryptographic proof that this agent is who it claims to be.

```typescript
import { deriveAgentDID, issueCredential, verifyCredential } from 'agentwallet-sdk/identity';

// Permanent DID — same key always produces the same DID
const did = deriveAgentDID(privateKey);
// → "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"

// Issue a signed Verifiable Credential
const vc = issueCredential(did, privateKey, {
  agentName: 'TradingAgent-01',
  capabilities: ['swap', 'bridge', 'pay'],
  owner: '0xff86...',
});

// Any counterparty can verify without phoning home
console.log(verifyCredential(vc)); // true
```

### Agent staking — earn yield on idle USDC

Agents can deposit USDC into an AAVE V3-backed staking pool and earn yield on earnings instead of holding cash in a wallet. **Agent participants only** — verified by DID at deposit time. No human participants.

```typescript
import { AgentStakingPool } from 'agentwallet-sdk/staking';

const pool = new AgentStakingPool();

// Deposit TaskBridge earnings — starts earning yield immediately
await pool.deposit({
  agentDID: did,
  amountUsdc: 500_000000n,  // 500 USDC
  walletClient,
  chain: 'base',
});

// Check balance (principal + yield, minus 0.5% annual management fee)
const balance = await pool.getBalance(did, 'base');
console.log(balance.currentBalanceUsdc); // growing
```

### Agent verification — machine-readable trust score

Before transacting with an unknown agent, request a trust bundle. Staking balance, task history, wallet age — all signed by the agent's DID. No PII. No central authority.

```typescript
import { verifyAgent, verifyTrustBundle } from 'agentwallet-sdk/verify';

const bundle = await verifyAgent({ privateKey, chain: 'base' });
// {
//   did: "did:key:z6Mk...",
//   walletAddress: "0x...",
//   stakingBalance: 500000000n,      // 500 USDC staked
//   reputationScore: 87,             // 0-100
//   taskBridgeTasksCompleted: 47,
//   walletAgeDays: 183,
//   signature: "..."                 // tamper-proof
// }

// Counterparty verifies before accepting payment or task
console.log(verifyTrustBundle(bundle)); // true
```

### Cross-chain without the ceremony

One bridge interface across 17 chains. Coinbase Agentic Wallets are Base-only.

```typescript
import { UnifiedBridge } from 'agentwallet-sdk';

const bridge = new UnifiedBridge({ evmSigner, solanaWallet });

await bridge.bridge({
  amount: 1_000_000n,
  sourceChain: 'solana',
  destinationChain: 'base',
  destinationAddress: '0x...',
});
```

Supported chains: Base, Ethereum, Solana, Arbitrum, Optimism, Polygon, Avalanche, Unichain, Linea, Codex, Sonic, World Chain, Sei, XDC, HyperEVM, Ink, Plume.

---

## Install

```bash
npm i agentwallet-sdk
```

## Quick Start

```typescript
import { createWallet, setSpendPolicy, agentExecute, NATIVE_TOKEN } from 'agentwallet-sdk';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const walletClient = createWalletClient({
  account: privateKeyToAccount(process.env.AGENT_PRIVATE_KEY),
  transport: http('https://mainnet.base.org'),
});

const wallet = createWallet({
  accountAddress: '0xYOUR_AGENT_ACCOUNT',
  chain: 'base',
  walletClient,
});

// Set spend limits once (owner operation)
await setSpendPolicy(wallet, {
  token: NATIVE_TOKEN,
  perTxLimit: 25_000000000000000n,    // 0.025 ETH per tx
  periodLimit: 500_000000000000000n,  // 0.5 ETH per day
  periodLength: 86400,
});

// Agent executes autonomously within limits
await agentExecute(wallet, { to: '0xSOME_SERVICE', value: 10_000000000000000n });
```

## Modules

| Module | Import | What it does |
|---|---|---|
| Core | `agentwallet-sdk` | Wallet creation, spend limits, agent execution |
| x402 | `agentwallet-sdk/x402` | Automatic API payment handling (HTTP 402) |
| Bridge | `agentwallet-sdk/bridge` | CCTP V2 cross-chain USDC (17 chains) |
| Swap | `agentwallet-sdk/swap` | Uniswap V3 token swaps @ **0.77% fee** |
| Policy | `agentwallet-sdk/policy` | SpendingPolicy — allowlists, rolling caps |
| Identity | `agentwallet-sdk/identity` | Agent DID (W3C did:key) + Verifiable Credentials |
| Staking | `agentwallet-sdk/staking` | Agent-only AAVE USDC yield pool |
| Verify | `agentwallet-sdk/verify` | Trust bundle — DID + staking + reputation |

## vs. MoonPay Agents

MoonPay entered the agent wallet space with a managed offering. Here's why builders choose `agentwallet-sdk` instead:

| | agentwallet-sdk | MoonPay Agents |
|---|---|---|
| **Open source** | ✅ MIT licensed | ❌ Closed enterprise product |
| **x402-native** | ✅ Built-in (v2.0.1+) | ❌ No x402 support |
| **Key custody** | Agent holds own keys | MoonPay managed |
| **KYC required** | ❌ None | ✅ KYC-gated |
| **Vendor lock-in** | ❌ On-chain, permissionless | ✅ Platform-dependent |
| **Cross-chain** | 17 chains via CCTP V2 | Limited |
| **DID / identity** | ✅ W3C did:key standard | ❌ No |

The difference isn't just technical. MoonPay Agents is a closed enterprise product — your agent's payment capability depends on MoonPay's platform staying available, compliant, and willing to serve you. `agentwallet-sdk` is open-source, x402-native, and permissionless. Your agent pays because it has keys, not because a vendor approved the transaction.

## Resources

- [npm package](https://www.npmjs.com/package/agentwallet-sdk)
- [Discord community](https://discord.gg/958AACqf7Y)
- [x402 docs](https://docs.x402.org)

## License

MIT
