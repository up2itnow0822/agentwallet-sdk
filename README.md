# agentwallet-sdk

Non-custodial agent wallet SDK. Your agent holds its own keys - no custodian, no KYC, no freeze risk.

[![npm](https://img.shields.io/npm/v/agentwallet-sdk?style=flat-square)](https://www.npmjs.com/package/agentwallet-sdk)
[![Discord](https://img.shields.io/discord/1475549260140253194?label=Community&logo=discord&color=5865F2)](https://discord.gg/958AACqf7Y)
![x402](https://img.shields.io/badge/x402-native-green?style=flat-square)
![CCTP V2](https://img.shields.io/badge/CCTP_V2-17_chains-red?style=flat-square)
![Tests](https://img.shields.io/badge/tests-376_passing-brightgreen?style=flat-square)

```bash
npm i agentwallet-sdk
```

---

## Why agent-wallet-sdk?

Most agent wallet solutions compromise on the thing that matters most: who controls the keys.

| | agent-wallet-sdk | Coinbase Agentic Wallets | MoonPay Agents |
|---|---|---|---|
| **Key custody** | Agent holds own keys | Coinbase TEE (custodial) | MoonPay managed |
| **Freeze risk** | None - on-chain only | Yes - platform can freeze | Yes - KYC-gated |
| **Cross-chain** | 17 chains via CCTP V2 | Base only | Limited |
| **x402 support** | Native (v2.0.1+) | No public x402 client | No |
| **Spend limits** | On-chain, enforced by contract | Platform-enforced | Platform-enforced |
| **KYC required** | No | No | Yes |
| **MCP compatible** | Yes | No | No |

### Coinbase Agentic Wallets - what "TEE-custodial" means

Coinbase stores private keys in Trusted Execution Environments on their infrastructure. The keys are not yours. If Coinbase freezes your account, halts the service, or gets a court order, your agent stops working. The TEE makes the custody tamper-resistant to Coinbase employees - but it does not make it non-custodial. You are still trusting Coinbase.

### MoonPay Agents - the CLI-bound, KYC wall

MoonPay requires identity verification before an agent can transact. That kills the autonomous agent use case - you can't run an agent at 2 AM that needs to pay an API if the payment rails need KYC approval first. MoonPay also does not expose an x402 interface, so agents using MoonPay can't participate in the emerging x402 payment ecosystem.

### agent-wallet-sdk - true non-custody

The wallet is an ERC-6551 token-bound account on-chain. The agent's private key lives in the agent's environment, controlled by whoever runs the agent. Nobody else has it. Spend limits are enforced by the smart contract - not by a platform policy that can change overnight.

```typescript
import { createWallet, createX402Fetch, NATIVE_TOKEN } from 'agentwallet-sdk';

// Agent holds its own key
const wallet = createWallet({ accountAddress: '0x...', chain: 'base', walletClient });

// x402 payments: agent pays APIs automatically, no human needed
const fetch = createX402Fetch(wallet, { globalDailyLimit: 10_000_000n });
const data = await fetch('https://api.example.com/premium');
// Server returned 402? Payment handled. Original request retried. Human not consulted.

// Spend limits are on-chain - agent can't exceed them even under prompt injection
```

### Cross-chain without the ceremony

One bridge interface across 17 chains. Coinbase Agentic Wallets are Base-only. MoonPay is not cross-chain native.

```typescript
import { UnifiedBridge } from 'agentwallet-sdk';

const bridge = new UnifiedBridge({ evmSigner, solanaWallet });

// Solana -> Base in one call
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
  perTxLimit: 25_000000000000000n,   // 0.025 ETH per tx
  periodLimit: 500_000000000000000n, // 0.5 ETH per day
  periodLength: 86400,
});

// Agent executes autonomously within limits
await agentExecute(wallet, { to: '0xSOME_SERVICE', value: 10_000000000000000n });
```

## Key Features

- **Non-custodial**: Agent holds its own private key. No custodian.
- **x402 native**: Drop-in fetch wrapper for automatic API payment handling
- **17-chain CCTP V2**: Cross-chain USDC via Circle's bridge - EVM + Solana
- **On-chain spend limits**: ERC-6551 token-bound accounts with contract-enforced policies
- **MCP compatible**: Use with any MCP-based agent framework
- **376 tests passing**

## Resources

- [npm package](https://www.npmjs.com/package/agentwallet-sdk)
- [Discord community](https://discord.gg/958AACqf7Y)
- [x402 docs](https://docs.x402.org)

## License

MIT
