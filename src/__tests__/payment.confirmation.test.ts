import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { AgentVaultAbi } from "../contracts/AgentVaultAbi.js";
import type { AgentWallet } from "../types.js";
import {
  createX402Fetch,
  createGuardedPaymentResource,
  GuardedPaymentMerchant,
  MemoryBudgetStore,
  X402BudgetTracker,
  PAYMENT_HEADER,
  PAYMENT_REQUIRED_HEADER,
  getX402PaymentReceipt,
  getX402PaymentRecovery,
  retryX402PaymentProof,
  PAYMENT_BINDING_TYPES,
  PAYMENT_RECEIPT_HEADER,
  type FetchFunction,
} from "../x402/index.js";

// Disposable local signing identity and synthetic RPC: no keys or chain transactions leave this test.
const account = privateKeyToAccount(`0x${"02".repeat(32)}`);
const vault = "0x1111111111111111111111111111111111111111" as const;
const asset = "0x3333333333333333333333333333333333333333" as const;
const recipient = "0x2222222222222222222222222222222222222222" as const;
const hash = `0x${"44".repeat(32)}` as Hash;
const blockHash = `0x${"55".repeat(32)}` as Hash;
const code = "0x6001600055" as const;
const resource = "https://merchant.example/item";
const directories: string[] = [];
afterEach(() => {
  directories.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true }));
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function fixture(walletConfirmations = 1, merchantConfirmations = 4) {
  const directory = mkdtempSync(join(tmpdir(), "payment-confirmations-"));
  directories.push(directory);
  const state = { head: 10n, minedAt: BigInt(Math.floor(Date.now() / 1000)) };
  const transfer = parseAbi(["event Transfer(address indexed from,address indexed to,uint256 value)"]);
  const input = encodeFunctionData({ abi: AgentVaultAbi, functionName: "agentTransferToken", args: [asset, recipient, 7n] });
  const rpc = async ({ method }: { method: string }) => {
    if (method === "eth_chainId") return toHex(baseSepolia.id);
    if (method === "eth_blockNumber") return toHex(state.head);
    if (method === "eth_getCode") return code;
    if (method === "eth_call") return encodeAbiParameters([{ type: "uint256" }], [1n]);
    if (method === "eth_getTransactionByHash") return {
      hash, from: account.address, to: vault, input, value: "0x0", chainId: toHex(baseSepolia.id),
      blockHash, blockNumber: "0xb", transactionIndex: "0x0", gas: "0x186a0", gasPrice: "0x1",
      nonce: "0x0", type: "0x0", r: toHex(1n, { size: 32 }), s: toHex(1n, { size: 32 }), v: "0x1b",
    };
    if (method === "eth_getTransactionReceipt") return {
      transactionHash: hash, from: account.address, to: vault, blockHash, blockNumber: "0xb",
      transactionIndex: "0x0", status: "0x1", type: "0x0", gasUsed: "0x5208", cumulativeGasUsed: "0x5208",
      effectiveGasPrice: "0x1", contractAddress: null, logsBloom: `0x${"00".repeat(256)}`,
      logs: [{
        address: asset, transactionHash: hash, blockHash, blockNumber: "0xb", transactionIndex: "0x0", logIndex: "0x0", removed: false,
        topics: encodeEventTopics({ abi: transfer, eventName: "Transfer", args: { from: vault, to: recipient } }),
        data: encodeAbiParameters([{ type: "uint256" }], [7n]),
      }],
    };
    if (method === "eth_getBlockByNumber") return {
      number: "0xb", hash: blockHash, parentHash: `0x${"00".repeat(32)}`, timestamp: toHex(state.minedAt),
      transactions: [], uncles: [], gasLimit: "0x1c9c380", gasUsed: "0x5208", miner: recipient,
      difficulty: "0x0", totalDifficulty: "0x0", size: "0x1", extraData: "0x", baseFeePerGas: "0x1",
    };
    throw new Error(`Unexpected synthetic RPC ${method}`);
  };
  const chainClient = createPublicClient({ chain: baseSepolia, transport: custom({ request: rpc }, { retryCount: 0 }) });
  const wait = vi.fn(async ({ hash: requested, confirmations = 1 }: { hash: Hash; confirmations?: number; timeout?: number }) => {
    state.head = 11n + BigInt(confirmations) - 1n;
    return chainClient.getTransactionReceipt({ hash: requested });
  });
  const publicClient = chainClient.extend(() => ({ waitForTransactionReceipt: wait }));
  const write = vi.fn(async () => {
    state.head = 11n;
    state.minedAt = BigInt(Math.floor(Date.now() / 1000));
    return hash;
  });
  const sign = vi.fn(account.signTypedData);
  const wallet = {
    address: vault, chain: baseSepolia, publicClient, expectedCodeHash: keccak256(code), confirmations: walletConfirmations,
    walletClient: { account, chain: baseSepolia, getChainId: async () => baseSepolia.id, writeContract: write, signTypedData: sign },
  } as unknown as AgentWallet;
  const merchantConfig = {
    publicClient: chainClient, vault, asset, recipient, expectedCodeHash: keccak256(code), deploymentBlock: 1n,
    chainId: baseSepolia.id, origin: "https://merchant.example", resource, amount: 7n,
    confirmations: merchantConfirmations, durableDirectory: directory,
  };
  const clientConfig = {
    autoPay: true, approvedServices: [{ origin: merchantConfig.origin, recipient, asset, network: "eip155:84532" as const }],
    globalDailyLimit: 10n, globalPerRequestMax: 10n,
    serviceBudgets: [{ service: merchantConfig.origin, dailyLimit: 10n, maxPerRequest: 10n }], memoryStore: new MemoryBudgetStore(),
  };
  return { state, chainClient, publicClient, wallet, write, sign, wait, merchantConfig, clientConfig };
}

describe("payment merchant confirmation requirements", () => {
  it("waits a merchant depth greater than the wallet depth before presenting a real signed proof", async () => {
    const f = fixture(1, 4);
    const merchant = new GuardedPaymentMerchant(f.merchantConfig);
    const serve = vi.fn(() => new Response("confirmed paid resource"));
    const handler = createGuardedPaymentResource(merchant, serve);
    const transport = vi.fn(handler);
    const fetch = createX402Fetch(f.wallet, { ...f.clientConfig, fetchFn: transport });

    const response = await fetch(resource);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("confirmed paid resource");
    expect(f.state.head).toBe(14n);
    expect(f.wait).toHaveBeenCalledWith(expect.objectContaining({ hash, confirmations: 4 }));
    expect(f.write).toHaveBeenCalledTimes(1);
    expect(serve).toHaveBeenCalledTimes(1);
    expect(getX402PaymentReceipt(response)?.txHash).toBe(hash);
    const proof = new Headers(transport.mock.calls[1]?.[1]?.headers).get(PAYMENT_HEADER)!;
    expect(JSON.parse(Buffer.from(proof, "base64").toString()).accepted.confirmations).toBe(4);
  });

  it("advertises separate mining and proof windows and accepts timely mining after the mining deadline passes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const start = new Date("2026-10-13T12:00:00Z").getTime();
    vi.setSystemTime(start);
    const f = fixture(1, 4);
    const merchant = new GuardedPaymentMerchant({ ...f.merchantConfig, challengeTtlMs: 1000, proofTtlMs: 600000 });
    const required = await merchant.issueChallenge();
    expect(required.accepts[0]).toMatchObject({ confirmations: 4, expiresAt: start + 1000, proofExpiresAt: start + 601000 });
    f.wait.mockImplementation(async ({ hash: requested, confirmations = 1 }) => {
      f.state.head = 11n + BigInt(confirmations) - 1n;
      if (confirmations >= 4) vi.setSystemTime(start + 120000);
      return f.chainClient.getTransactionReceipt({ hash: requested });
    });
    const serve = vi.fn(() => new Response("late confirmation, timely payment"));
    const handler = createGuardedPaymentResource(merchant, serve);
    const fetch = createX402Fetch(f.wallet, { ...f.clientConfig, fetchFn: handler });

    const response = await fetch(resource);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("late confirmation, timely payment");
    expect(f.write).toHaveBeenCalledTimes(1);
    expect(serve).toHaveBeenCalledTimes(1);
  });

  it("retains the same challenge and retries only the proof after a transient confirmation failure", async () => {
    const f = fixture(1, 4);
    const merchant = new GuardedPaymentMerchant(f.merchantConfig);
    const serve = vi.fn(() => new Response("paid after recovery"));
    const handler = createGuardedPaymentResource(merchant, serve);
    const transport = vi.fn(handler);
    f.wait.mockImplementationOnce(async ({ hash: requested }) => {
      f.state.head = 11n;
      return f.chainClient.getTransactionReceipt({ hash: requested });
    }).mockRejectedValueOnce(new Error("Confirmation RPC interrupted"));
    const fetch = createX402Fetch(f.wallet, { ...f.clientConfig, fetchFn: transport });

    const error: unknown = await fetch(resource).catch((value: unknown) => value);

    expect(error).toMatchObject({ txHash: hash });
    expect(f.write).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(Error);
    const retained = getX402PaymentRecovery(error as Error)!;
    expect(retained).toMatchObject({ txHash: hash, paymentRequirements: { confirmations: 4 } });
    const budget = new X402BudgetTracker({ ...f.clientConfig, scope: { wallet: vault, chainId: baseSepolia.id, asset } });
    expect(budget.getReservations()).toMatchObject([{ txHash: hash, binding: { requestId: retained.paymentRequirements.requestId, confirmations: 4, proofExpiresAt: retained.paymentRequirements.proofExpiresAt } }]);
    expect(budget.getTransactionLog()).toHaveLength(0);
    const reserve = vi.spyOn(X402BudgetTracker.prototype, "reserve");
    const release = vi.spyOn(X402BudgetTracker.prototype, "release");
    const response = await retryX402PaymentProof(error as Error);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("paid after recovery");
    expect(getX402PaymentRecovery(response)?.paymentRequirements.requestId).toBe(retained.paymentRequirements.requestId);
    expect(f.write).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(2);
    expect(serve).toHaveBeenCalledTimes(1);
    expect(budget.getReservations()).toHaveLength(0);
    expect(budget.getTransactionLog()).toMatchObject([{ txHash: hash, requestId: retained.paymentRequirements.requestId }]);
    expect(budget.getDailySpendSummary().global).toBe(7n);
    expect(reserve).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
  });

  it.each([0, -1, 0.5, 86400001, Infinity])("rejects unsupported proof lifetime %s", (proofTtlMs) => {
    const f = fixture();
    expect(() => new GuardedPaymentMerchant({ ...f.merchantConfig, proofTtlMs })).toThrow();
    expect(f.write).not.toHaveBeenCalled();
  });

  it.each([1000, 119999])("rejects proof lifetime %s shorter than the merchant depth allowance", (proofTtlMs) => {
    const f = fixture(1, 4);
    expect(() => new GuardedPaymentMerchant({ ...f.merchantConfig, proofTtlMs })).toThrow();
    expect(f.write).not.toHaveBeenCalled();
  });

  it.each([[1, 64, 1000], [64, 2, 60000]])(
    "denies an insufficient window before reserving or paying (wallet %i, merchant %i)",
    async (walletDepth, merchantDepth, proofWindow) => {
      const f = fixture(walletDepth, merchantDepth);
      const merchant = new GuardedPaymentMerchant(f.merchantConfig);
      const handler = createGuardedPaymentResource(merchant, () => new Response("paid"));
      const fetchFn = async (input: string | URL | Request, init?: RequestInit) => {
        const response = await handler(input, init);
        if (response.status !== 402) return response;
        const required = JSON.parse(Buffer.from(response.headers.get(PAYMENT_REQUIRED_HEADER)!, "base64").toString());
        required.accepts[0].proofExpiresAt = required.accepts[0].expiresAt + proofWindow;
        response.headers.set(PAYMENT_REQUIRED_HEADER, Buffer.from(JSON.stringify(required)).toString("base64"));
        return response;
      };
      const fetch = createX402Fetch(f.wallet, { ...f.clientConfig, fetchFn });
      const budget = new X402BudgetTracker({ ...f.clientConfig, scope: { wallet: vault, chainId: baseSepolia.id, asset } });

      await expect(fetch(resource)).rejects.toThrow();

      expect(f.write).not.toHaveBeenCalled();
      expect(f.wait).not.toHaveBeenCalled();
      expect(budget.getReservations()).toHaveLength(0);
      expect(budget.getDailySpendSummary().global).toBe(0n);
    },
  );

  it("honors a higher wallet depth when the original proof window is sufficient", async () => {
    const f = fixture(64, 2);
    const merchant = new GuardedPaymentMerchant(f.merchantConfig);
    const fetch = createX402Fetch(f.wallet, { ...f.clientConfig, fetchFn: createGuardedPaymentResource(merchant, () => new Response("deep wallet payment")) });

    const response = await fetch(resource);

    expect(response.status).toBe(200);
    expect(f.wait).toHaveBeenCalledWith(expect.objectContaining({ hash, confirmations: 64 }));
    expect(f.state.head).toBe(74n);
    expect(f.write).toHaveBeenCalledTimes(1);
  });

  it("reuses the signed original proof after failed delivery and retains provenance on response clones", async () => {
    const f = fixture(1, 4);
    const merchant = new GuardedPaymentMerchant(f.merchantConfig);
    const serve = vi.fn(() => new Response("retried paid resource"));
    const handler = createGuardedPaymentResource(merchant, serve);
    let failDelivery = true;
    const transport = vi.fn<FetchFunction>(async (input, init) => {
      if (new Headers(init?.headers).has(PAYMENT_HEADER) && failDelivery) {
        failDelivery = false;
        throw new Error("Paid HTTP connection interrupted before verification");
      }
      return handler(input, init);
    });
    const fetch = createX402Fetch(f.wallet, { ...f.clientConfig, fetchFn: transport });
    const error: unknown = await fetch(resource).catch((value: unknown) => value);
    expect(error).toBeInstanceOf(Error);
    const original = getX402PaymentRecovery(error as Error)!;
    expect(original.paymentProof).toBeTypeOf("string");
    expect(Object.isFrozen(original)).toBe(true);
    expect(Object.isFrozen(original.paymentRequirements)).toBe(true);
    const signed = JSON.parse(Buffer.from(original.paymentProof!, "base64").toString());
    for (const alteration of [
      { confirmations: 3 },
      { expiresAt: original.paymentRequirements.expiresAt + 1000 },
      { proofExpiresAt: original.paymentRequirements.proofExpiresAt + 1000 },
    ]) {
      const altered = { ...signed, accepted: { ...signed.accepted, ...alteration } };
      await expect(merchant.verifyPayment(Buffer.from(JSON.stringify(altered)).toString("base64"))).rejects.toThrow("exact issued challenge");
    }
    const reserve = vi.spyOn(X402BudgetTracker.prototype, "reserve");
    const release = vi.spyOn(X402BudgetTracker.prototype, "release");

    const response = await retryX402PaymentProof(error as Error);

    expect(response.status).toBe(200);
    expect(new Headers(transport.mock.calls[2]?.[1]?.headers).get(PAYMENT_HEADER)).toBe(original.paymentProof);
    expect(getX402PaymentRecovery(response)?.paymentProof).toBe(original.paymentProof);
    const cloned = response.clone();
    cloned.headers.set(PAYMENT_RECEIPT_HEADER, "forged remote receipt");
    expect(getX402PaymentRecovery(cloned)).toEqual(getX402PaymentRecovery(response));
    const forged = new Response(null, { headers: response.headers });
    expect(getX402PaymentRecovery(forged)).toBeUndefined();
    await expect(retryX402PaymentProof(forged)).rejects.toThrow("no locally retained");
    const consumed = await retryX402PaymentProof(cloned);
    expect(consumed.status).toBe(403);
    expect(getX402PaymentReceipt(consumed)?.txHash).toBe(hash);
    expect(getX402PaymentRecovery(consumed)?.paymentProof).toBe(original.paymentProof);
    expect(f.sign).toHaveBeenCalledTimes(1);
    expect(f.write).toHaveBeenCalledTimes(1);
    expect(serve).toHaveBeenCalledTimes(1);
    expect(reserve).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
  });

  it("keeps the original proof deadline and hash when a confirmation wait outlives the window", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const start = new Date("2026-10-13T12:00:00Z").getTime();
    vi.setSystemTime(start);
    const f = fixture(1, 4);
    const merchant = new GuardedPaymentMerchant({ ...f.merchantConfig, challengeTtlMs: 1000, proofTtlMs: 120000 });
    f.wait.mockImplementation(async ({ hash: requested, confirmations = 1 }) => {
      f.state.head = 11n + BigInt(confirmations) - 1n;
      if (confirmations >= 4) vi.setSystemTime(start + 121001);
      return f.chainClient.getTransactionReceipt({ hash: requested });
    });
    const transport = vi.fn(createGuardedPaymentResource(merchant, () => new Response("paid")));
    const fetch = createX402Fetch(f.wallet, { ...f.clientConfig, fetchFn: transport });
    const error: unknown = await fetch(resource).catch((value: unknown) => value);
    expect(error).toMatchObject({ txHash: hash });
    const original = getX402PaymentRecovery(error as Error)!;
    expect(original.paymentRequirements.proofExpiresAt).toBe(start + 121000);
    const priorWaits = f.wait.mock.calls.length;
    const reserve = vi.spyOn(X402BudgetTracker.prototype, "reserve");
    const release = vi.spyOn(X402BudgetTracker.prototype, "release");

    const expired: unknown = await retryX402PaymentProof(error as Error).catch((value: unknown) => value);

    expect(expired).toMatchObject({ txHash: hash });
    expect(getX402PaymentRecovery(expired as Error)?.paymentRequirements.proofExpiresAt).toBe(start + 121000);
    expect(f.wait).toHaveBeenCalledTimes(priorWaits);
    expect(f.write).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(reserve).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
  });

  it.each([
    { confirmations: undefined }, { confirmations: 0 }, { confirmations: 65 }, { confirmations: 1.5 }, { confirmations: "4" },
    { proofExpiresAt: undefined }, { proofExpiresAt: 0 }, { proofExpiresAt: Infinity }, { proofExpiresAt: "tomorrow" },
  ])("rejects malformed finality requirements before paying: %j", async (mutation) => {
    const f = fixture();
    const merchant = new GuardedPaymentMerchant(f.merchantConfig);
    const handler = createGuardedPaymentResource(merchant, () => new Response("paid"));
    const fetchFn: FetchFunction = async (input, init) => {
      const response = await handler(input, init);
      const required = JSON.parse(Buffer.from(response.headers.get(PAYMENT_REQUIRED_HEADER)!, "base64").toString());
      Object.assign(required.accepts[0], mutation);
      response.headers.set(PAYMENT_REQUIRED_HEADER, Buffer.from(JSON.stringify(required)).toString("base64"));
      return response;
    };
    const fetch = createX402Fetch(f.wallet, { ...f.clientConfig, fetchFn });
    const budget = new X402BudgetTracker({ ...f.clientConfig, scope: { wallet: vault, chainId: baseSepolia.id, asset } });

    await expect(fetch(resource)).rejects.toThrow("Invalid payment option");

    expect(f.write).not.toHaveBeenCalled();
    expect(budget.getReservations()).toHaveLength(0);
    expect(budget.getDailySpendSummary().global).toBe(0n);
  });

  it("rejects proof signatures that omit the finality and deadline bindings", async () => {
    const f = fixture();
    const merchant = new GuardedPaymentMerchant(f.merchantConfig);
    const accepted = (await merchant.issueChallenge()).accepts[0]!;
    const signature = await account.signTypedData({
      domain: { name: "AgentVaultTransactionPayment", version: "1", chainId: baseSepolia.id, verifyingContract: vault },
      types: { PaymentBinding: PAYMENT_BINDING_TYPES.PaymentBinding.slice(0, 6) },
      primaryType: "PaymentBinding", message: { txHash: hash, resource, requestId: accepted.requestId, asset, payTo: recipient, amount: 7n },
    });
    const proof = Buffer.from(JSON.stringify({ protocol: "agent-vault-tx-v1", resource, accepted, payload: { txHash: hash, vault, signer: account.address, signature } })).toString("base64");

    await expect(merchant.verifyPayment(proof)).rejects.toThrow("signature");
  });

  it("fails closed when persisted finality requirements are corrupted", async () => {
    const f = fixture();
    const merchant = new GuardedPaymentMerchant(f.merchantConfig);
    const accepted = (await merchant.issueChallenge()).accepts[0]!;
    const path = join(f.merchantConfig.durableDirectory, "merchant-ledger.json");
    const ledger = JSON.parse(readFileSync(path, "utf8"));
    ledger.challenges[accepted.requestId].payment.proofExpiresAt = accepted.expiresAt + 1000;
    writeFileSync(path, JSON.stringify(ledger));

    await expect(new GuardedPaymentMerchant(f.merchantConfig).issueChallenge()).rejects.toThrow("Corrupt");
    expect(f.write).not.toHaveBeenCalled();
  });

  it("rejects concurrent proof retries without reserving or transferring again", async () => {
    const f = fixture(1, 4);
    const merchant = new GuardedPaymentMerchant(f.merchantConfig);
    const handler = createGuardedPaymentResource(merchant, () => new Response("recovered"));
    f.wait.mockImplementationOnce(async ({ hash: requested }) => {
      f.state.head = 11n;
      return f.chainClient.getTransactionReceipt({ hash: requested });
    }).mockRejectedValueOnce(new Error("Confirmation unavailable"));
    const fetch = createX402Fetch(f.wallet, { ...f.clientConfig, fetchFn: handler });
    const error: unknown = await fetch(resource).catch((value: unknown) => value);
    let finish!: () => void;
    f.wait.mockImplementationOnce(async ({ hash: requested }) => {
      await new Promise<void>((resolve) => { finish = resolve; });
      f.state.head = 14n;
      return f.chainClient.getTransactionReceipt({ hash: requested });
    });
    const reserve = vi.spyOn(X402BudgetTracker.prototype, "reserve");
    const release = vi.spyOn(X402BudgetTracker.prototype, "release");
    const first = retryX402PaymentProof(error as Error);
    await vi.waitFor(() => expect(finish).toBeTypeOf("function"));

    await expect(retryX402PaymentProof(error as Error)).rejects.toMatchObject({ txHash: hash });
    finish();
    expect((await first).status).toBe(200);
    expect(f.write).toHaveBeenCalledTimes(1);
    expect(f.wait).toHaveBeenCalledTimes(3);
    expect(reserve).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
  });
});
