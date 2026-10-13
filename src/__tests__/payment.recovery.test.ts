import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  encodeAbiParameters,
  encodeEventTopics,
  keccak256,
  parseAbi,
  type TransactionReceipt,
} from "viem";
import { baseSepolia } from "viem/chains";
import { AgentVaultAbi } from "../contracts/AgentVaultAbi.js";
import type { AgentWallet } from "../types.js";
import {
  QueuedTransactionError,
  SubmittedTransactionError,
} from "../wallet/execution.js";
import {
  createX402Fetch,
  wrapWithX402,
  X402SubmittedPaymentError,
  MemoryBudgetStore,
  X402BudgetTracker,
  GUARDED_TRANSACTION_SCHEME,
  PAYMENT_HEADER,
  PAYMENT_REQUIRED_HEADER,
  PAYMENT_RECEIPT_HEADER,
  getX402PaymentReceipt,
  getX402PaymentRecovery,
  type FetchFunction,
  type X402ClientConfig,
} from "../x402/index.js";

const vault = "0x1111111111111111111111111111111111111111" as const;
const recipient = "0x2222222222222222222222222222222222222222" as const;
const asset = "0x3333333333333333333333333333333333333333" as const;
const signer = "0x5555555555555555555555555555555555555555" as const;
const txHash = `0x${"4".repeat(64)}` as const;
const resource = "https://merchant.example/item?variant=blue";
const requestId = "merchant-recovery-request-123";
const service = "https://merchant.example";
const receiptHeader = PAYMENT_RECEIPT_HEADER;
const code = "0x6000" as const;
const directories: string[] = [];
const limits = {
  globalDailyLimit: 10n,
  globalPerRequestMax: 10n,
  serviceBudgets: [{ service, dailyLimit: 10n, maxPerRequest: 10n }],
};

afterEach(() => {
  directories
    .splice(0)
    .forEach((path) => rmSync(path, { recursive: true, force: true }));
});

// Controlled receipt and wallet transports exercise the real payment/execution code without network or keys.
function successReceipt(): TransactionReceipt {
  const abi = parseAbi([
    "event Transfer(address indexed from, address indexed to, uint256 value)",
  ]);
  return {
    status: "success",
    transactionHash: txHash,
    logs: [
      {
        address: asset,
        topics: encodeEventTopics({
          abi,
          eventName: "Transfer",
          args: { from: vault, to: recipient },
        }),
        data: encodeAbiParameters([{ type: "uint256" }], [7n]),
      },
    ],
  } as unknown as TransactionReceipt;
}

function challenge(): Response {
  return new Response(null, {
    status: 402,
    headers: {
      [PAYMENT_REQUIRED_HEADER]: Buffer.from(
        JSON.stringify({
          protocol: GUARDED_TRANSACTION_SCHEME,
          resource,
          accepts: [
            {
              scheme: GUARDED_TRANSACTION_SCHEME,
              network: "eip155:84532",
              asset,
              amount: "7",
              payTo: recipient,
              resource,
              requestId,
              confirmations: 1,
              expiresAt: Date.now() + 60000,
              proofExpiresAt: Date.now() + 3660000,
            },
          ],
        }),
      ).toString("base64"),
    },
  });
}

function fixture(durableDirectory?: string) {
  const publicClient = {
    getChainId: vi.fn(async () => baseSepolia.id),
    getBytecode: vi.fn(async () => code),
    readContract: vi.fn(async () => 1n),
    simulateContract: vi.fn(async () => ({ request: {} })),
    waitForTransactionReceipt: vi.fn(async () => successReceipt()),
  };
  const walletClient = {
    account: { address: signer },
    chain: baseSepolia,
    getChainId: vi.fn(async () => baseSepolia.id),
    writeContract: vi.fn(async () => txHash),
    signTypedData: vi.fn(async () => `0x${"6".repeat(130)}` as const),
  };
  const wallet = {
    address: vault,
    chain: baseSepolia,
    expectedCodeHash: keccak256(code),
    confirmations: 1,
    publicClient,
    walletClient,
  } as unknown as AgentWallet;
  const storage = durableDirectory
    ? { durableDirectory }
    : { memoryStore: new MemoryBudgetStore() };
  const config: X402ClientConfig = {
    ...limits,
    ...storage,
    autoPay: true,
    approvedServices: [
      { origin: service, recipient, asset, network: "eip155:84532" },
    ],
  };
  const budget = new X402BudgetTracker({
    ...limits,
    ...storage,
    scope: { wallet: vault, chainId: baseSepolia.id, asset },
  });
  return { wallet, config, budget, publicClient, walletClient };
}

const wrappers = [
  {
    name: "createX402Fetch",
    create: (
      fetchFn: FetchFunction,
      wallet: AgentWallet,
      config: X402ClientConfig,
    ) => createX402Fetch(wallet, { ...config, fetchFn }),
  },
  {
    name: "wrapWithX402",
    create: (
      fetchFn: FetchFunction,
      wallet: AgentWallet,
      config: X402ClientConfig,
    ) => wrapWithX402(fetchFn, wallet, config),
  },
];

describe.each(wrappers)("$name payment recovery", ({ create }) => {
  it("exposes the settled hash and exact challenge when binding signing rejects", async () => {
    const f = fixture();
    const rejectedSignature = new Error("Payment binding signature rejected");
    f.walletClient.signTypedData.mockRejectedValueOnce(rejectedSignature);
    const fetchFn = vi.fn<FetchFunction>(async () => challenge());
    const wrapped = create(fetchFn, f.wallet, f.config);

    const error: unknown = await wrapped(resource).catch((value: unknown) => value);

    expect(error).toMatchObject({
      txHash,
      resource,
      requestId,
      cause: rejectedSignature,
      name: "X402SubmittedPaymentError",
    });
    expect(error).toBeInstanceOf(SubmittedTransactionError);
    expect(error).toBeInstanceOf(X402SubmittedPaymentError);
    expect(f.budget.getTransactionLog()).toMatchObject([{ txHash, requestId }]);
    expect(f.budget.getReservations()).toHaveLength(0);
    expect(f.budget.getDailySpendSummary().global).toBe(7n);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(f.walletClient.writeContract).toHaveBeenCalledTimes(1);
    await expect(wrapped(resource)).rejects.toThrow();
    expect(f.walletClient.writeContract).toHaveBeenCalledTimes(1);
  });

  it("rejects failed paid delivery with the settled hash and original cause", async () => {
    const f = fixture();
    const failedDelivery = new Error("Paid response transport failed");
    const onPaymentComplete = vi.fn();
    const fetchFn = vi.fn<FetchFunction>()
      .mockResolvedValueOnce(challenge())
      .mockRejectedValueOnce(failedDelivery);
    const wrapped = create(fetchFn, f.wallet, { ...f.config, onPaymentComplete });

    const error: unknown = await wrapped(resource).catch((value: unknown) => value);

    expect(error).toMatchObject({
      txHash,
      resource,
      requestId,
      cause: failedDelivery,
      name: "X402SubmittedPaymentError",
    });
    expect(error).toBeInstanceOf(SubmittedTransactionError);
    expect(error).toBeInstanceOf(X402SubmittedPaymentError);
    const proof = new Headers(fetchFn.mock.calls[1]?.[1]?.headers).get(
      PAYMENT_HEADER,
    );
    expect(proof).not.toBeNull();
    expect(JSON.parse(Buffer.from(proof!, "base64").toString())).toMatchObject({
      resource,
      accepted: { requestId },
      payload: { txHash },
    });
    expect(f.budget.getTransactionLog()).toMatchObject([{ txHash, requestId }]);
    expect(f.budget.getDailySpendSummary().global).toBe(7n);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(f.walletClient.writeContract).toHaveBeenCalledTimes(1);
    expect(onPaymentComplete).not.toHaveBeenCalled();
  });

  it("retains a known hash when confirmed transfer evidence is missing", async () => {
    const f = fixture();
    f.publicClient.waitForTransactionReceipt.mockResolvedValueOnce({
      ...successReceipt(),
      logs: [],
    });
    const fetchFn = vi.fn<FetchFunction>().mockResolvedValueOnce(challenge());

    const error: unknown = await create(fetchFn, f.wallet, f.config)(resource).catch(
      (value: unknown) => value,
    );

    expect(error).toMatchObject({ txHash, resource, requestId });
    expect(error).toBeInstanceOf(SubmittedTransactionError);
    expect(f.budget.getReservations()).toMatchObject([
      { txHash, state: "submitting", amount: 7n },
    ]);
    expect(f.budget.getTransactionLog()).toHaveLength(0);
    expect(f.budget.getDailySpendSummary().global).toBe(7n);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(f.walletClient.signTypedData).not.toHaveBeenCalled();
  });

  it("retains the submitted reservation after settlement persistence fails", async () => {
    const directory = mkdtempSync(join(tmpdir(), "payment-recovery-"));
    directories.push(directory);
    const f = fixture(directory);
    const lock = join(directory, "budget-ledger.lock");
    f.publicClient.waitForTransactionReceipt.mockImplementationOnce(async () => {
      mkdirSync(lock);
      return successReceipt();
    });
    const fetchFn = vi.fn<FetchFunction>().mockResolvedValueOnce(challenge());

    const error: unknown = await create(fetchFn, f.wallet, f.config)(resource).catch(
      (value: unknown) => value,
    );
    rmdirSync(lock);

    expect(error).toMatchObject({ txHash, resource, requestId });
    expect(error).toBeInstanceOf(SubmittedTransactionError);
    expect(error).toHaveProperty("cause.code", "EEXIST");
    const restarted = fixture(directory);
    expect(restarted.budget.getReservations()).toMatchObject([
      { txHash, state: "submitting", amount: 7n },
    ]);
    expect(restarted.budget.getDailySpendSummary().global).toBe(7n);
    expect(restarted.budget.getTransactionLog()).toHaveLength(0);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(f.walletClient.signTypedData).not.toHaveBeenCalled();
  });

  it("preserves the known hash when the submission callback cannot persist it", async () => {
    const directory = mkdtempSync(join(tmpdir(), "payment-recovery-"));
    directories.push(directory);
    const f = fixture(directory);
    const lock = join(directory, "budget-ledger.lock");
    f.walletClient.writeContract.mockImplementationOnce(async () => {
      mkdirSync(lock);
      return txHash;
    });
    const fetchFn = vi.fn<FetchFunction>().mockResolvedValueOnce(challenge());

    const error: unknown = await create(fetchFn, f.wallet, f.config)(resource).catch(
      (value: unknown) => value,
    );
    rmdirSync(lock);

    expect(Object.getPrototypeOf(error)).toBe(SubmittedTransactionError.prototype);
    expect(error).toMatchObject({ txHash, name: "SubmittedTransactionError" });
    expect(error).toHaveProperty("cause.code", "EEXIST");
    const restarted = fixture(directory);
    expect(restarted.budget.getReservations()).toMatchObject([
      { state: "submitting", amount: 7n },
    ]);
    expect(restarted.budget.getReservations()[0]).not.toHaveProperty("txHash");
    expect(restarted.budget.getDailySpendSummary().global).toBe(7n);
    expect(restarted.budget.getTransactionLog()).toHaveLength(0);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(f.publicClient.waitForTransactionReceipt).not.toHaveBeenCalled();
    expect(f.walletClient.signTypedData).not.toHaveBeenCalled();
  });

  it("preserves a queued transaction error with its hash and approval ID", async () => {
    const f = fixture();
    f.publicClient.waitForTransactionReceipt.mockResolvedValueOnce({
      ...successReceipt(),
      logs: [
        {
          address: vault,
          topics: encodeEventTopics({
            abi: AgentVaultAbi,
            eventName: "TransactionQueued",
            args: { txId: 9n, to: recipient },
          }),
          data: encodeAbiParameters(
            [{ type: "uint256" }, { type: "address" }, { type: "uint256" }],
            [7n, asset, 7n],
          ),
        },
      ],
    } as unknown as TransactionReceipt);
    const fetchFn = vi.fn<FetchFunction>().mockResolvedValueOnce(challenge());

    const error: unknown = await create(fetchFn, f.wallet, f.config)(resource).catch(
      (value: unknown) => value,
    );

    expect(error).toBeInstanceOf(QueuedTransactionError);
    expect(error).toMatchObject({ txHash, txId: 9n, name: "QueuedTransactionError" });
    expect(f.budget.getReservations()).toMatchObject([{ txHash, state: "submitting" }]);
    expect(f.budget.getTransactionLog()).toHaveLength(0);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(f.walletClient.signTypedData).not.toHaveBeenCalled();
  });

  it("keeps failures before any known submission distinguishable from paid errors", async () => {
    const f = fixture();
    const transportFailure = new Error("Unpaid request failed");
    const fetchFn = vi.fn<FetchFunction>().mockRejectedValueOnce(transportFailure);
    const wrapped = create(fetchFn, f.wallet, f.config);

    await expect(wrapped(resource)).rejects.toBe(transportFailure);
    expect(f.budget.getReservations()).toHaveLength(0);
    expect(f.budget.getDailySpendSummary().global).toBe(0n);
    expect(f.walletClient.writeContract).not.toHaveBeenCalled();

    const simulationFailure = new Error("Simulation rejected before broadcast");
    f.publicClient.simulateContract.mockRejectedValueOnce(simulationFailure);
    fetchFn.mockResolvedValueOnce(challenge());

    await expect(wrapped(resource)).rejects.toBe(simulationFailure);
    expect(simulationFailure).not.toBeInstanceOf(SubmittedTransactionError);
    expect(simulationFailure).not.toHaveProperty("txHash");
    expect(f.budget.getReservations()).toMatchObject([{ state: "submitting" }]);
    expect(f.budget.getReservations()[0]).not.toHaveProperty("txHash");
    expect(f.budget.getDailySpendSummary().global).toBe(7n);
    expect(f.budget.getTransactionLog()).toHaveLength(0);
    expect(f.walletClient.writeContract).not.toHaveBeenCalled();
  });

  it.each([200, 402, 503])(
    "exposes confirmed settlement on paid HTTP %i without changing the response",
    async (status) => {
      const f = fixture();
      const forgedReceipt = Buffer.from(
        JSON.stringify({ txHash: `0x${"f".repeat(64)}`, requestId: "forged-request" }),
      ).toString("base64");
      const paidResponse = new Response("merchant response body", {
        status,
        statusText: "Merchant status",
        headers: { [receiptHeader]: forgedReceipt, "x-merchant-response": "kept" },
      });
      Object.defineProperty(paidResponse, "url", { value: resource });
      Object.defineProperty(paidResponse, "type", { value: "basic" });
      const fetchFn = vi.fn<FetchFunction>()
        .mockResolvedValueOnce(challenge())
        .mockResolvedValueOnce(paidResponse);

      const response = await create(fetchFn, f.wallet, f.config)(resource);

      expect(response.status).toBe(status);
      expect(response.statusText).toBe("Merchant status");
      expect(response.url).toBe(resource);
      expect(response.type).toBe("basic");
      expect(response.redirected).toBe(false);
      expect(response.bodyUsed).toBe(false);
      expect(response.headers.get("x-merchant-response")).toBe("kept");
      const header = response.headers.get(receiptHeader);
      expect(header).not.toBe(forgedReceipt);
      expect(header).not.toBeNull();
      expect(JSON.parse(Buffer.from(header!, "base64").toString())).toMatchObject({
        protocol: GUARDED_TRANSACTION_SCHEME,
        settlement: "client-confirmed",
        txHash,
        vault,
        resource,
        requestId,
        network: "eip155:84532",
        asset,
        payTo: recipient,
        amount: "7",
      });
      const receipt = getX402PaymentReceipt(response);
      expect(receipt).toMatchObject({ txHash, resource, requestId, settlement: "client-confirmed" });
      expect(Object.isFrozen(receipt)).toBe(true);
      const copiedReceipt = new Response("unverified copy", { headers: response.headers });
      expect(getX402PaymentReceipt(copiedReceipt)).toBeUndefined();
      const cloned = response.clone();
      expect(getX402PaymentReceipt(cloned)).toBe(receipt);
      expect(cloned.url).toBe(resource);
      expect(cloned.status).toBe(status);
      expect(cloned.type).toBe("basic");
      expect(cloned.redirected).toBe(false);
      response.headers.set(receiptHeader, forgedReceipt);
      expect(getX402PaymentReceipt(response)).toBe(receipt);
      expect(await cloned.text()).toBe("merchant response body");
      expect(await response.text()).toBe("merchant response body");
      expect(response.bodyUsed).toBe(true);
      expect(f.walletClient.writeContract).toHaveBeenCalledTimes(1);
      expect(fetchFn).toHaveBeenCalledTimes(2);
      expect(f.budget.getDailySpendSummary().global).toBe(7n);
    },
  );

  it("keeps authoritative frozen receipt and recovery facts when runtime fields are overwritten before cloning", async () => {
    const f = fixture();
    const paidResponse = new Response("original paid body", { status: 503 });
    Object.defineProperty(paidResponse, "url", { value: resource });
    Object.defineProperty(paidResponse, "type", { value: "basic" });
    const fetchFn = vi.fn<FetchFunction>()
      .mockResolvedValueOnce(challenge())
      .mockResolvedValueOnce(paidResponse);
    const response = await create(fetchFn, f.wallet, f.config)(resource);
    const authoritative = getX402PaymentReceipt(response)!;
    const recovery = getX402PaymentRecovery(response)!;
    const forgedResource = "https://forged.example/unpaid";
    Reflect.set(response, "receipt", {
      ...authoritative,
      txHash: `0x${"f".repeat(64)}`,
      amount: "1000000",
      resource: forgedResource,
    });
    Reflect.set(response, "location", {
      url: forgedResource,
      type: "opaque",
      redirected: true,
    });

    const cloned = response.clone();
    const twiceCloned = cloned.clone();

    for (const copy of [response, cloned, twiceCloned]) {
      expect(getX402PaymentReceipt(copy)).toBe(authoritative);
      expect(Object.isFrozen(getX402PaymentReceipt(copy))).toBe(true);
      expect(getX402PaymentReceipt(copy)).toMatchObject({ txHash, amount: "7", resource, requestId });
      expect(getX402PaymentRecovery(copy)).toEqual(recovery);
      expect(Object.isFrozen(getX402PaymentRecovery(copy))).toBe(true);
      expect(Object.isFrozen(getX402PaymentRecovery(copy)?.paymentRequirements)).toBe(true);
      expect(copy.url).toBe(resource);
      expect(copy.type).toBe("basic");
      expect(copy.redirected).toBe(false);
      expect(copy.status).toBe(503);
    }
    expect(JSON.parse(Buffer.from(cloned.headers.get(receiptHeader)!, "base64").toString())).toMatchObject({ txHash, amount: "7", resource });
    expect(await twiceCloned.text()).toBe("original paid body");
    expect(await cloned.text()).toBe("original paid body");
    expect(await response.text()).toBe("original paid body");
    expect(f.walletClient.writeContract).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("does not let the reflected response constructor mint trusted settlement provenance", async () => {
    const f = fixture();
    const fetchFn = vi.fn<FetchFunction>()
      .mockResolvedValueOnce(challenge())
      .mockResolvedValueOnce(new Response("paid"));
    const response = await create(fetchFn, f.wallet, f.config)(resource);
    const authoritative = getX402PaymentReceipt(response)!;
    const ReflectedResponse = response.constructor as unknown as new (
      original: Response,
      receipt: typeof authoritative,
    ) => Response;

    expect(() => new ReflectedResponse(new Response("unpaid"), {
      ...authoritative,
      txHash: `0x${"f".repeat(64)}`,
      amount: "1000000",
      resource: "https://forged.example/unpaid",
    })).toThrow();
    expect(getX402PaymentReceipt(response)).toBe(authoritative);
    expect(getX402PaymentReceipt(response.clone())).toBe(authoritative);
    expect(f.walletClient.writeContract).toHaveBeenCalledTimes(1);
  });

  it("rejects a borrowed branded clone method on an unbranded response with forged runtime fields", async () => {
    const f = fixture();
    const fetchFn = vi.fn<FetchFunction>()
      .mockResolvedValueOnce(challenge())
      .mockResolvedValueOnce(new Response("paid"));
    const response = await create(fetchFn, f.wallet, f.config)(resource);
    const authoritative = getX402PaymentReceipt(response)!;
    const unbranded = new Response("unpaid");
    Reflect.set(unbranded, "receipt", { ...authoritative, txHash: `0x${"f".repeat(64)}` });
    Reflect.set(unbranded, "location", { url: "https://forged.example/unpaid", type: "basic", redirected: false });

    expect(() => response.clone.call(unbranded)).toThrow();

    expect(getX402PaymentReceipt(unbranded)).toBeUndefined();
    expect(getX402PaymentRecovery(unbranded)).toBeUndefined();
    expect(getX402PaymentReceipt(response.clone())).toBe(authoritative);
    expect(getX402PaymentRecovery(response.clone())).toEqual(getX402PaymentRecovery(response));
    expect(f.walletClient.writeContract).toHaveBeenCalledTimes(1);
  });

  it("does not trust a receipt header on an unpaid response", async () => {
    const f = fixture();
    const unpaidResponse = new Response("public resource", {
      headers: { [receiptHeader]: "forged-merchant-receipt" },
    });
    const fetchFn = vi.fn<FetchFunction>().mockResolvedValueOnce(unpaidResponse);
    const response = await create(fetchFn, f.wallet, f.config)(resource);

    expect(response).toBe(unpaidResponse);
    expect(response.headers.get(receiptHeader)).toBe("forged-merchant-receipt");
    expect(getX402PaymentReceipt(response)).toBeUndefined();
    expect(getX402PaymentReceipt(response.clone())).toBeUndefined();
    expect(await response.text()).toBe("public resource");
    expect(f.walletClient.writeContract).not.toHaveBeenCalled();
    expect(f.budget.getDailySpendSummary().global).toBe(0n);
  });

  it("leaves an unpaid challenge response unchanged when automatic payment is disabled", async () => {
    const f = fixture();
    const unpaidChallenge = challenge();
    unpaidChallenge.headers.set(receiptHeader, "forged-merchant-receipt");
    const fetchFn = vi.fn<FetchFunction>().mockResolvedValueOnce(unpaidChallenge);
    const response = await create(fetchFn, f.wallet, { ...f.config, autoPay: false })(resource);

    expect(response).toBe(unpaidChallenge);
    expect(response.status).toBe(402);
    expect(response.headers.get(receiptHeader)).toBe("forged-merchant-receipt");
    expect(getX402PaymentReceipt(response)).toBeUndefined();
    expect(f.walletClient.writeContract).not.toHaveBeenCalled();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
