# AgentWallet SDK

Version 5 is a security release candidate for a non-custodial agent vault, a Node SDK, and a browser wallet console. An external owner wallet controls permissions. A separate agent operator can spend only through the vault's explicit limits and approved routes.

**Testnet release candidate. Do not use this branch for mainnet funds.** Local tests and dependency audits do not establish an independent contract audit or live protocol settlement. Follow [release readiness](docs/security/release-readiness.md) before publishing or funding a production deployment. No software can promise that it is unhackable.

## Try the console

Use Node 24, Git, and an external EIP-1193 wallet extension:

```sh
npm ci --ignore-scripts
npm --prefix apps/wallet-console ci --ignore-scripts
npm run ui:dev
```

Open the Vite URL. The console defaults to Base Sepolia. Its demonstration mode explains the screens without signing. Connect an external owner or operator wallet and import a deployment manifest with an independently checked runtime code hash to use an existing testnet vault. The testnet deployment wizard requests explicit wallet confirmation and produces a public manifest. It never asks for a private key or seed phrase.

The console provides balances, native/token transfers, bounded swaps, Aave supply/redemption, bridge submission and recovery, owner permissions, queued approval review, and transaction history. Transactions are simulated and shown for review before wallet confirmation; a successful receipt is required before reporting execution. A queued request is not a payment.

Before asking the wallet to sign, the console saves a public recovery identity and claims an origin-wide browser lock. A lost broadcast response stays unresolved across navigation and reload, blocking further writes. Use the recovery panel with the original hash from your wallet history; it verifies the exact transaction and two-confirmation receipt. Download recovery metadata and keep the original browser profile while requests are unresolved. The journal contains public identities and calldata digests, never keys, signatures or attestations.

## Asset and authority boundaries

| Component | What it does | Limits |
| --- | --- | --- |
| AgentVault | Holds assets; enforces owner/operator roles, recipients, token budgets, swap price floors and bridge destinations | Defaults deny; non-upgradeable; immutable owner/protocol addresses |
| Owner wallet | Configures, pauses, revokes operators, approves queued transfers and performs recovery calls | Ultimate authority over funds; keep outside AI runtimes |
| Operator wallet | Pays gas and requests bounded vault operations | Never a funded capital EOA; arbitrary calldata forbidden |
| HTTP payments | Pays approved resources through the vault and verifies confirmed exact transfers | Custom agent-vault-tx-v1 scheme; requires a compatible merchant |
| Identity and trust | Authenticates custom signed claims and independently checks owner/chain/economic evidence | No invented reputation, wallet age, AI status or yield |
| Agent runtime | Receives an isolated payment capability | Host retains signing clients; no owner credentials exposed |

Limits use bigint token base units. All protocol fees charged by this SDK are zero; network gas, protocol fees, market movement and third-party protocol risk remain. Owner approval of a pending transfer is an explicit exception to operator budgets. Queue entries expire after one day and any owner policy change invalidates earlier entries.

## Supported integrations

Swaps use Uniswap V3 Router02 on Base and Base Sepolia. Aave V3 supply/redemption requires explicit verified token/aToken deployments and the vault's immutable pool. CCTP V2 bridging supports Ethereum, Optimism, Arbitrum and Base, each with a separate Sepolia configuration and dedicated destination gas signer. Testnet bridges use Circle's sandbox; mainnet/testnet mixing is rejected.

Base Sepolia Aave test USDC and native Circle test USDC are **different tokens**. Configure policies and approvals by address, not symbol. Abstract delegated payments and ordinary x402 exact authorization are unsupported. ERC-8004 clients require explicitly supplied verified registry deployments. Only standard owner-approved ERC20 tokens are supported; rebasing, transfer-tax and malicious tokens are outside the vault's integration contract.

## SDK example

Install a locally verified package tarball from this branch. It has not been published by this repair work.

```ts
import { createWallet, agentTransferToken } from 'agentwallet-sdk';
import type { PublicClient, WalletClient, Address, Hash } from 'viem';

// Obtain these from a trusted host and an independently checked deployment.
declare const publicClient: PublicClient;
declare const operatorClient: WalletClient;
declare const vaultAddress: Address;
declare const runtimeCodeHash: Hash;
declare const circleTestUsdc: Address;
declare const approvedRecipient: Address;

const wallet = createWallet({
  accountAddress: vaultAddress,
  expectedCodeHash: runtimeCodeHash,
  chain: 'base-sepolia',
  publicClient,
  walletClient: operatorClient,
  confirmations: 2,
});
const hash = await agentTransferToken(wallet, {
  token: circleTestUsdc,
  to: approvedRecipient,
  amount: 1_000_000n,
});
```

This succeeds only after the owner grants the recipient and token budget on-chain. A revert, queued transfer, wrong chain or substituted vault code rejects. If an error contains a submitted transaction hash, reconcile that transaction before retrying.

Guarded HTTP payments distinguish settlement from resource delivery. A paid error response retains verified local receipt facts; an in-session proof-only retry reuses the original transaction and challenge without another transfer. Merchant confirmation depth and separate mining/proof deadlines are checked before spending. See the migration guide for the exact configuration, recovery APIs and restart limits.

For payment, staking, identity and bridge migration examples, see [v5 migration](docs/migration.md). Node-only payment, registry retrieval and bridge recovery APIs must not be bundled into a browser; the console imports browser-safe ABI and message validation modules.

## Verify this branch

```sh
npm run verify
```

The command performs strict TypeScript checks, unique source regression tests, adversarial contract tests on an actual local EVM, a clean contract/SDK build, installation and import checks of the actual npm tarball, a source secret scan, console build/unit/browser tests and full/production dependency audits for both packages. CI runs the same command with frozen lockfiles and fails on any error. Disposable test accounts never hold real funds. Tests using synthetic RPC evidence are distinguished from actual local-EVM tests in the [security evidence](docs/security/remediation.md).

[Security policy](SECURITY.md) · [Threat model](docs/security/threat-model.md) · [Contribution guide](CONTRIBUTING.md) · [Release gates](docs/security/release-readiness.md)

The [bounded CI evaluation record](docs/security/ci-evaluation.md) tracks PR #9's repair passes and review evidence. The packed SDK includes these release guides; package verification checks their presence.
