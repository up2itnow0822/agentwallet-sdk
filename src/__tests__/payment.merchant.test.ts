import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createPublicClient,
  custom,
  encodeAbiParameters,
  encodeEventTopics,
  encodeFunctionData,
  keccak256,
  parseAbi,
  toHex,
  type Hash,
} from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { AgentVaultAbi } from "../contracts/AgentVaultAbi.js";
import { GuardedPaymentMerchant } from "../x402/merchant.js";
import { createGuardedPaymentResource } from "../x402/example-server.js";
import { X402Client, PAYMENT_BINDING_TYPES } from "../x402/client.js";
import { MemoryBudgetStore } from "../x402/budget.js";
import { executeVaultOperation } from "../wallet/execution.js";
import {
  PAYMENT_HEADER,
  PAYMENT_REQUIRED_HEADER,
  GUARDED_TRANSACTION_SCHEME,
} from "../x402/types.js";
import type { AgentWallet } from "../types.js";
vi.mock("../wallet/execution.js", () => ({ executeVaultOperation: vi.fn() }));
// Disposable local-only signing identity. The RPC below is controlled synthetic evidence, not a live chain.
const account = privateKeyToAccount(`0x${"01".repeat(32)}`);
const vault = "0x1111111111111111111111111111111111111111" as const;
const asset = "0x3333333333333333333333333333333333333333" as const;
const recipient = "0x2222222222222222222222222222222222222222" as const;
const txHash = `0x${"44".repeat(32)}` as Hash;
const blockHash = `0x${"55".repeat(32)}` as Hash;
const code = "0x6001600055" as const;
const resource = "https://merchant.example/item";
const directories: string[] = [];
afterEach(() => {
  directories
    .splice(0)
    .forEach((d) => rmSync(d, { recursive: true, force: true }));
  vi.clearAllMocks();
});
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "merchant-settlement-"));
  directories.push(directory);
  const transfer = parseAbi([
    "event Transfer(address indexed from,address indexed to,uint256 value)",
  ]);
  const state = {
    head: 10n,
    receiptBlock: 11n,
    receiptExists: true,
    status: "0x1",
    input: encodeFunctionData({
      abi: AgentVaultAbi,
      functionName: "agentTransferToken",
      args: [asset, recipient, 7n],
    }),
    from: account.address,
    to: vault,
    code,
    chainId: baseSepolia.id,
    value: "0x0",
    amount: 7n,
    token: asset,
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
  };
  const rpc = vi.fn(
    async ({ method }: { method: string; params?: readonly unknown[] }) => {
      const log = {
        address: state.token,
        data: encodeAbiParameters([{ type: "uint256" }], [state.amount]),
        topics: encodeEventTopics({
          abi: transfer,
          eventName: "Transfer",
          args: { from: vault, to: recipient },
        }),
        blockHash,
        blockNumber: toHex(state.receiptBlock),
        transactionHash: txHash,
        transactionIndex: "0x0",
        logIndex: "0x0",
        removed: false,
      };
      if (method === "eth_chainId") return toHex(state.chainId);
      if (method === "eth_blockNumber") return toHex(state.head);
      if (method === "eth_getCode") return state.code;
      if (method === "eth_call")
        return encodeAbiParameters([{ type: "uint256" }], [1n]);
      if (method === "eth_getTransactionByHash")
        return {
          hash: txHash,
          from: state.from,
          to: state.to,
          input: state.input,
          chainId: toHex(state.chainId),
          blockHash,
          blockNumber: toHex(state.receiptBlock),
          transactionIndex: "0x0",
          gas: "0x186a0",
          gasPrice: "0x1",
          nonce: "0x0",
          value: state.value,
          type: "0x0",
          r: toHex(1n, { size: 32 }),
          s: toHex(1n, { size: 32 }),
          v: "0x1b",
        };
      if (method === "eth_getTransactionReceipt")
        return state.receiptExists
          ? {
              transactionHash: txHash,
              transactionIndex: "0x0",
              blockHash,
              blockNumber: toHex(state.receiptBlock),
              from: state.from,
              to: state.to,
              cumulativeGasUsed: "0x5208",
              gasUsed: "0x5208",
              effectiveGasPrice: "0x1",
              contractAddress: null,
              logs: [log],
              logsBloom: `0x${"00".repeat(256)}`,
              status: state.status,
              type: "0x0",
            }
          : null;
      if (method === "eth_getBlockByHash" || method === "eth_getBlockByNumber")
        return {
          number: toHex(state.receiptBlock),
          hash: blockHash,
          parentHash: `0x${"00".repeat(32)}`,
          nonce: "0x0000000000000000",
          sha3Uncles: `0x${"00".repeat(32)}`,
          logsBloom: `0x${"00".repeat(256)}`,
          transactionsRoot: `0x${"00".repeat(32)}`,
          stateRoot: `0x${"00".repeat(32)}`,
          receiptsRoot: `0x${"00".repeat(32)}`,
          miner: recipient,
          difficulty: "0x0",
          totalDifficulty: "0x0",
          extraData: "0x",
          size: "0x1",
          gasLimit: "0x1c9c380",
          gasUsed: "0x5208",
          timestamp: toHex(state.timestamp),
          transactions: [],
          uncles: [],
          baseFeePerGas: "0x1",
        };
      throw new Error(`Unsupported controlled RPC ${method}`);
    },
  );
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: custom({ request: rpc }, { retryCount: 0 }),
  });
  const config = {
    publicClient,
    vault,
    asset,
    recipient,
    expectedCodeHash: keccak256(code),
    deploymentBlock: 1n,
    chainId: baseSepolia.id,
    origin: "https://merchant.example",
    resource,
    amount: 7n,
    confirmations: 2,
    durableDirectory: directory,
  };
  const merchant = new GuardedPaymentMerchant(config);
  return { state, merchant, config, publicClient, directory };
}
async function proof(merchant: GuardedPaymentMerchant) {
  const required = await merchant.issueChallenge();
  const accepted = required.accepts[0]!;
  const signature = await account.signTypedData({
    domain: {
      name: "AgentVaultTransactionPayment",
      version: "1",
      chainId: baseSepolia.id,
      verifyingContract: vault,
    },
    types: PAYMENT_BINDING_TYPES,
    primaryType: "PaymentBinding",
    message: {
      txHash,
      resource,
      requestId: accepted.requestId,
      asset,
      payTo: recipient,
      amount: 7n,
    },
  });
  const payload = {
    protocol: GUARDED_TRANSACTION_SCHEME,
    resource,
    accepted,
    payload: { txHash, vault, signer: account.address, signature },
  };
  return {
    payload,
    header: Buffer.from(JSON.stringify(payload)).toString("base64"),
  };
}
describe("payment custom merchant settlement using controlled viem RPC", () => {
  it("verifies exact chain evidence and durably accepts a signed payment exactly once", async () => {
    const { merchant, state, config } = fixture();
    const { header } = await proof(merchant);
    state.head = 12n;
    const accepted = await merchant.verifyPayment(header);
    expect(accepted.txHash).toBe(txHash);
    expect(accepted.resource).toBe(resource);
    expect(Object.isFrozen(accepted)).toBe(true);
    await expect(
      new GuardedPaymentMerchant(config).verifyPayment(header),
    ).rejects.toThrow("consumed");
  });
  it("allows only one concurrent verification across merchant instances", async () => {
    const { merchant, state, config } = fixture();
    const { header } = await proof(merchant);
    state.head = 12n;
    const outcomes = await Promise.allSettled([
      merchant.verifyPayment(header),
      new GuardedPaymentMerchant(config).verifyPayment(header),
    ]);
    expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });
  it("rejects invalid signatures, resource binding and corrupted durable state", async () => {
    const { merchant, state, directory } = fixture();
    const { payload, header } = await proof(merchant);
    state.head = 12n;
    const wrong = { ...payload, resource: resource + "/other" };
    await expect(
      merchant.verifyPayment(
        Buffer.from(JSON.stringify(wrong)).toString("base64"),
      ),
    ).rejects.toThrow();
    const signature = {
      ...payload,
      payload: { ...payload.payload, signature: `0x${"00".repeat(65)}` },
    };
    await expect(
      merchant.verifyPayment(
        Buffer.from(JSON.stringify(signature)).toString("base64"),
      ),
    ).rejects.toThrow();
    writeFileSync(join(directory, "merchant-ledger.json"), "{}");
    await expect(merchant.verifyPayment(header)).rejects.toThrow();
  });
  it("rejects insufficient confirmations, wrong calldata/recipient, missing/reverted transfer, stale blocks and code/chain mismatches", async () => {
    for (const mutation of [
      (s: ReturnType<typeof fixture>["state"]) => {
        s.head = 11n;
      },
      (s: ReturnType<typeof fixture>["state"]) => {
        s.input = encodeFunctionData({
          abi: AgentVaultAbi,
          functionName: "agentTransferToken",
          args: [asset, vault, 7n],
        });
      },
      (s: ReturnType<typeof fixture>["state"]) => {
        s.amount = 6n;
      },
      (s: ReturnType<typeof fixture>["state"]) => {
        s.status = "0x0";
      },
      (s: ReturnType<typeof fixture>["state"]) => {
        s.receiptExists = false;
      },
      (s: ReturnType<typeof fixture>["state"]) => {
        s.receiptBlock = 10n;
      },
      (s: ReturnType<typeof fixture>["state"]) => {
        s.timestamp -= 600n;
      },
      (s: ReturnType<typeof fixture>["state"]) => {
        s.code = "0x6002600055" as typeof code;
      },
      (s: ReturnType<typeof fixture>["state"]) => {
        s.chainId = 1 as typeof baseSepolia.id;
      },
    ]) {
      const { merchant, state } = fixture();
      const { header } = await proof(merchant);
      state.head = 12n;
      mutation(state);
      await expect(merchant.verifyPayment(header)).rejects.toThrow();
    }
  });
  it("rejects fabricated request IDs, altered amounts, calldata suffixes, nonzero value and signer/target substitution", async () => {
    for (const mutation of [
      (s: ReturnType<typeof fixture>["state"]) => {
        s.input += "00";
      },
      (s: ReturnType<typeof fixture>["state"]) => {
        s.value = "0x1";
      },
      (s: ReturnType<typeof fixture>["state"]) => {
        s.from = recipient as typeof account.address;
      },
      (s: ReturnType<typeof fixture>["state"]) => {
        s.to = recipient as typeof vault;
      },
    ]) {
      const { merchant, state } = fixture();
      const { header } = await proof(merchant);
      state.head = 12n;
      mutation(state);
      await expect(merchant.verifyPayment(header)).rejects.toThrow();
    }
    const { merchant, state } = fixture();
    const { payload } = await proof(merchant);
    state.head = 12n;
    for (const accepted of [
      { ...payload.accepted, requestId: "never-issued-request-id" },
      { ...payload.accepted, amount: "6" },
    ])
      await expect(
        merchant.verifyPayment(
          Buffer.from(JSON.stringify({ ...payload, accepted })).toString(
            "base64",
          ),
        ),
      ).rejects.toThrow();
  });
  it("completes a real client/challenge/proof/resource flow through the reference handler", async () => {
    const { merchant, state, publicClient, config } = fixture();
    const handler = createGuardedPaymentResource(
      merchant,
      () => new Response("paid resource"),
    );
    const wallet = {
      address: vault,
      chain: baseSepolia,
      publicClient,
      walletClient: { account, signTypedData: account.signTypedData },
      expectedCodeHash: config.expectedCodeHash,
      confirmations: 2,
    } as unknown as AgentWallet;
    vi.mocked(executeVaultOperation).mockImplementation(
      async (_wallet, _operation, _args, options) => {
        state.head = 12n;
        await options?.onSubmitted?.(txHash);
        const receipt = await publicClient.getTransactionReceipt({
          hash: txHash,
        });
        return { txHash, receipt };
      },
    );
    const client = new X402Client(wallet, {
      autoPay: true,
      approvedServices: [
        { origin: config.origin, recipient, asset, network: "eip155:84532" },
      ],
      globalDailyLimit: 10n,
      globalPerRequestMax: 10n,
      serviceBudgets: [
        { service: config.origin, dailyLimit: 10n, maxPerRequest: 10n },
      ],
      memoryStore: new MemoryBudgetStore(),
      fetchFn: handler,
    });
    const response = await client.fetch(resource);
    expect(await response.text()).toBe("paid resource");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(client.getTransactionLog()).toHaveLength(1);
    const challenge = await handler(resource);
    expect(challenge.status).toBe(402);
    expect(challenge.headers.has(PAYMENT_REQUIRED_HEADER)).toBe(true);
    expect(challenge.headers.has(PAYMENT_HEADER)).toBe(false);
  });
});
