# Migrating to version 5

Version 5 deliberately removes unsafe compatibility paths. Deploy a new independently verified AgentVault and move assets with the owner wallet; legacy account bytecode does not become secure by updating this SDK. Use a separate gas operator. Never transfer capital to that operator as an execution fallback.

## Wallet operations

createWallet requires an explicit vault address, runtime code hash, external walletClient and matching chain. There is no automatic raw-key bootstrap. Capital operations use agentExecute for empty-calldata native payments, agentTransferToken, agentSwap, agentSupply, agentWithdraw or agentBridge. Arbitrary operator calldata and token approvals are rejected. Owner administration uses executeOwnerOperation or typed facade helpers.

Confirmed native transfers return {status:'executed', executed:true, txHash} or {status:'queued', executed:false, txHash, txId}. Other asset modules reject a queued payment rather than reporting settlement. Pending approval objects preserve target, token, amount, native value, full calldata, timestamps and policy epoch. Owner approval may exceed operator budgets and requires review of the exact request.

SubmittedTransactionError contains txHash after a known broadcast. Never repeat the operation before reconciling it. Bridge errors also contain recoveryId. Batch transfers are sequential and can partially complete; they are not an atomic multisend.

## Guarded HTTP payments

This SDK's legacy class names X402Client/X402BudgetTracker now implement the custom agent-vault-tx-v1 settlement scheme with AGENT-VAULT-PAYMENT-REQUIRED and AGENT-VAULT-PAYMENT headers. It is not interoperable with standard x402 exact/EIP-3009 funded-EOA authorizations. Abstract delegated facilitator support rejects until a compatible audited implementation exists.

Auto-payment defaults off. Supply explicit approved origin/recipient/asset/network tuples, positive bigint limits and a private durable directory. For example, with a previously verified wallet:

```ts
import { X402Client } from 'agentwallet-sdk/x402';
const payments = new X402Client(wallet, {
  autoPay: true,
  approvedServices: [{
    origin: 'https://merchant.example',
    recipient: approvedRecipient,
    asset: circleTestUsdc,
    network: 'eip155:84532',
  }],
  globalDailyLimit: 5_000_000n,
  globalPerRequestMax: 1_000_000n,
  durableDirectory: './runtime-state/payments',
});
const response = await payments.fetch('https://merchant.example/resource');
```

Merchant configuration must pin the vault, chain, deployment block, asset, recipient, amount, resource, confirmation depth and a separate private durable directory. GuardedPaymentMerchant.issueChallenge() issues a future-payment challenge; verifyPayment(header) checks the signed exact vault transfer and consumes both transaction and request once. createGuardedPaymentResource provides a framework-neutral compatible handler; createGuardedPaymentHttpsServer builds an opt-in Node HTTPS server without listening or deploying automatically. This is a fixed-price protected-resource reference, not a general merchant account platform.

Default transport permits bounded public-address HTTPS GET/HEAD on port 443, pins DNS to validated public addresses and rejects redirects. A caller-supplied fetchFn is a trusted host transport and must preserve equivalent origin, redirect, size and network restrictions. Pending/unknown submissions remain charged across restarts and day changes. Filesystem state and lock files must not be cleared automatically. In-memory accounting is disposable, single-process testing only.

## Swaps, Aave and bridging

new SwapModule(wallet, {maxSlippageBps:50}) uses the guarded vault. Quotes simulate Uniswap QuoterV2, amounts are base-unit bigints, and output stays in the vault. The owner must configure an expiring minimum-rate pair and token spending policy. Exact temporary router allowances are cleared atomically; the SDK adds no protocol fee. Quote freshness and price floors cannot eliminate MEV or economic loss inside authorized limits.

new AgentStakingPool({token,aToken}) requires explicit verified deployments. deposit({wallet,amount}) and withdraw({wallet,amount}) submit guarded Aave operations and return hash plus receipt. getBalance(wallet) reads principal and actual aToken balance at one block, including any principal shortfall. No synthetic APY, DID access gate or management fee remains. Owner recovery can alter positions outside tracked principal accounting.

new BridgeModule(wallet,{store:new FileBridgeStore(directory),destinations:{...}}) requires dedicated destination publicClient and gas walletClient. burn(amount,toChain,{destinationAddress}) creates a persistent recoverable burn; bridge additionally waits and mints. Use recoverBurn(id,hash?), waitForAttestation(id), mint(id,attested), resume(id) and recoverMint(id,hash?) to reconcile each state. Source capital always goes through agentBridge; destination receiveMessage only mints a verified attested output and spends gas. Unknown broadcasts block retries, even if a transport did not return a hash. Manual hash recovery verifies the saved intent and transaction calldata.

Only Ethereum/Optimism/Arbitrum/Base and their explicit Sepolia variants are mapped. Mainnet and testnet must match; testnet uses Circle's sandbox. Arbitrary attestation hosts, hooks and undocumented chain names are unsupported. Browser consumers may import the browser-safe maps, ABI and message validator; the Node bridge client and filesystem store cannot be bundled into browsers.

## Credentials, trust and runtime plugins

Credentials use AgentWalletEd25519EnvelopeV1, a fully signed custom JSON envelope, rather than claiming conformance to a W3C cryptographic suite. verifyCredentialSignature authenticates the envelope and expected issuer/subject. Proof type, creation time, verification method, purpose, controller and expiry are signed and checked. See src/identity/MIGRATION.md for exact compatibility changes.

verifyAgent requires independently configured chain/vault/token/aToken evidence, a verifier challenge, expiry and the owner's signature of walletBindingMessage(...). verifyTrustBundle is asynchronous and checks the expected issuer/challenge against independent chain evidence; signature-only verifyTrustBundleSignature is explicitly weaker. The consuming application must atomically use each verifier challenge once. Registry discovery requires explicit verified ERC-8004 deployments, and untrusted metadata uses bounded DNS-pinned HTTPS.

ElizaOS hosts inject runtime.agentWalletConfig = {wallet,payment}. Runtime consumers receive only a frozen address/chain/fetch capability. No private-key settings, global singleton, full signing client or owner account is exposed. The host must isolate agent code from signer credentials and filesystem state; an in-process callback is not a sandbox.
