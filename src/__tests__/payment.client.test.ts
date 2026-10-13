import { afterEach, describe, expect, it, vi } from "vitest";
import { X402Client } from "../x402/client.js";
import { wrapWithX402 } from "../x402/middleware.js";
import { MemoryBudgetStore } from "../x402/budget.js";
import {
  GUARDED_TRANSACTION_SCHEME,
  PAYMENT_REQUIRED_HEADER,
  PAYMENT_HEADER,
  type X402ClientConfig,
} from "../x402/types.js";
import type { AgentWallet } from "../types.js";
import {
  executeVaultOperation,
  QueuedTransactionError,
  SubmittedTransactionError,
} from "../wallet/execution.js";
import { encodeEventTopics, encodeAbiParameters, parseAbi } from "viem";
vi.mock("../wallet/execution.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../wallet/execution.js")>()),
  executeVaultOperation: vi.fn(),
}));
const wallet = {
  address: "0x1111111111111111111111111111111111111111",
  chain: { id: 84532 },
  confirmations: 1,
  walletClient: {
    account: { address: "0x5555555555555555555555555555555555555555" },
    signTypedData: async () => `0x${"6".repeat(130)}`,
  },
} as unknown as AgentWallet;
const recipient = "0x2222222222222222222222222222222222222222";
const asset = "0x3333333333333333333333333333333333333333";
const hash = `0x${"4".repeat(64)}` as const;
const resource = "https://merchant.example/item";
const transferAbi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);
const successReceipt = () => ({
  status: "success",
  transactionHash: hash,
  logs: [
    {
      address: asset,
      topics: encodeEventTopics({
        abi: transferAbi,
        eventName: "Transfer",
        args: { from: wallet.address, to: recipient },
      }),
      data: encodeAbiParameters([{ type: "uint256" }], [7n]),
    },
  ],
});
function challenge(overrides: Record<string, unknown> = {}): Response {
  const payment = {
    scheme: GUARDED_TRANSACTION_SCHEME,
    network: "eip155:84532",
    asset,
    amount: "7",
    payTo: recipient,
    resource,
    requestId: "merchant-request-id-123",
    confirmations: 1,
    expiresAt: Date.now() + 60000,
    proofExpiresAt: Date.now() + 3660000,
    ...overrides,
  };
  return new Response(null, {
    status: 402,
    headers: {
      [PAYMENT_REQUIRED_HEADER]: Buffer.from(
        JSON.stringify({
          protocol: GUARDED_TRANSACTION_SCHEME,
          resource,
          accepts: [payment],
        }),
      ).toString("base64"),
    },
  });
}
const config = (): X402ClientConfig => ({
  autoPay: true,
  approvedServices: [
    {
      origin: "https://merchant.example",
      recipient,
      asset,
      network: "eip155:84532" as const,
    },
  ],
  globalDailyLimit: 10n,
  globalPerRequestMax: 10n,
  serviceBudgets: [
    {
      service: "https://merchant.example",
      dailyLimit: 10n,
      maxPerRequest: 10n,
    },
  ],
  memoryStore: new MemoryBudgetStore(),
});
afterEach(() => vi.resetAllMocks());
describe("payment guarded client", () => {
  it("defaults to no automatic spending and uses supplied fetch without globals", async () => {
    const fn = vi.fn(async () => challenge());
    const { autoPay: _autoPay, ...passiveConfig } = config();
    const wrapped = wrapWithX402(fn, wallet, passiveConfig);
    expect((await wrapped(resource)).status).toBe(402);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(executeVaultOperation).not.toHaveBeenCalled();
  });
  it("rejects ordinary exact protocol, wrong resource/recipient/chain and unsafe redirects", async () => {
    for (const override of [
      { scheme: "exact" },
      { resource: resource + "/other" },
      { payTo: wallet.address },
      { network: "eip155:1" },
      { amount: "-1" },
      { amount: "1.5" },
      { expiresAt: Infinity },
    ]) {
      const client = new X402Client(wallet, {
        ...config(),
        fetchFn: async () => challenge(override),
      });
      await expect(client.fetch(resource)).rejects.toThrow();
    }
    const client = new X402Client(wallet, {
      ...config(),
      fetchFn: async () =>
        new Response(null, {
          status: 302,
          headers: { location: "https://attacker.example" },
        }),
    });
    await expect(client.fetch(resource)).rejects.toThrow();
    expect(executeVaultOperation).not.toHaveBeenCalled();
  });
  it("reserves before asynchronous approvals across shared clients and binds receipt proof", async () => {
    let approve!: (value: boolean) => void;
    const onBeforePayment = () =>
      new Promise<boolean>((resolve) => {
        approve = resolve;
      });
    const shared = config();
    const fetchFn = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit) =>
        new Headers(init?.headers).has(PAYMENT_HEADER)
          ? new Response("paid")
          : challenge(),
    );
    vi.mocked(executeVaultOperation).mockResolvedValue({
      txHash: hash,
      receipt: successReceipt(),
    } as Awaited<ReturnType<typeof executeVaultOperation>>);
    const a = new X402Client(wallet, { ...shared, fetchFn, onBeforePayment });
    const b = new X402Client(wallet, { ...shared, fetchFn });
    const first = a.fetch(resource);
    await vi.waitFor(() => expect(approve).toBeTypeOf("function"));
    await expect(b.fetch(resource)).rejects.toThrow("Budget");
    approve(true);
    expect(await (await first).text()).toBe("paid");
    expect(executeVaultOperation).toHaveBeenCalledTimes(1);
    expect(executeVaultOperation).toHaveBeenCalledWith(
      wallet,
      "agentTransferToken",
      [asset, recipient, 7n],
      expect.objectContaining({ onSubmitted: expect.any(Function) }),
    );
    expect(a.getDailySpendSummary().global).toBe(7n);
    await expect(a.fetch(resource)).rejects.toThrow();
    expect(executeVaultOperation).toHaveBeenCalledTimes(1);
    expect(Object.isFrozen(a.getTransactionLog()[0])).toBe(true);
  });
  it("refuses successful queued/missing transfer receipts as payment proofs", async () => {
    const fetchFn = vi.fn(async () => challenge());
    vi.mocked(executeVaultOperation).mockResolvedValue({
      txHash: hash,
      receipt: { status: "success", transactionHash: hash, logs: [] },
    } as unknown as Awaited<ReturnType<typeof executeVaultOperation>>);
    const client = new X402Client(wallet, { ...config(), fetchFn });
    await expect(client.fetch(resource)).rejects.toThrow(
      "confirmed ERC20 transfer",
    );
    expect(client.getTransactionLog()).toHaveLength(0);
    expect(client.getDailySpendSummary().global).toBe(7n);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
  it("does not complete or retry a reverted receipt", async () => {
    const fetchFn = vi.fn(async () => challenge());
    vi.mocked(executeVaultOperation).mockResolvedValue({
      txHash: hash,
      receipt: { status: "reverted" },
    } as Awaited<ReturnType<typeof executeVaultOperation>>);
    const client = new X402Client(wallet, { ...config(), fetchFn });
    await expect(client.fetch(resource)).rejects.toThrow("receipt failed");
    expect(client.getTransactionLog()).toHaveLength(0);
    expect(client.getDailySpendSummary().global).toBe(7n);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
  it("preserves Request headers and forces secure redirect behavior", async () => {
    const fetchFn = vi.fn(
      async (_input: string | URL | Request, init?: RequestInit) =>
        new Headers(init?.headers).has(PAYMENT_HEADER)
          ? new Response("paid")
          : challenge(),
    );
    vi.mocked(executeVaultOperation).mockResolvedValue({
      txHash: hash,
      receipt: successReceipt(),
    } as Awaited<ReturnType<typeof executeVaultOperation>>);
    const client = new X402Client(wallet, { ...config(), fetchFn });
    await client.fetch(
      new Request(resource, {
        headers: { authorization: "Bearer disposable-test" },
        redirect: "follow",
      }),
    );
    const retry = fetchFn.mock.calls[1]!;
    expect(new Headers(retry[1]?.headers).get("authorization")).toBe(
      "Bearer disposable-test",
    );
    expect(retry[1]?.redirect).toBe("error");
    const proof = JSON.parse(
      Buffer.from(
        new Headers(retry[1]?.headers).get(PAYMENT_HEADER)!,
        "base64",
      ).toString(),
    ) as {
      protocol: string;
      resource: string;
      payload: {
        txHash: string;
        vault: string;
        signer: string;
        signature: string;
      };
    };
    expect(proof.protocol).toBe(GUARDED_TRANSACTION_SCHEME);
    expect(proof.resource).toBe(resource);
    expect(proof.payload.txHash).toBe(hash);
    expect(proof.payload.vault).toBe(wallet.address);
    expect(proof.payload.signature).toMatch(/^0x/);
  });
  it("retains unknown/failed submissions and does not retry or record completion", async () => {
    const fetchFn = vi.fn(async () => challenge());
    vi.mocked(executeVaultOperation).mockRejectedValue(
      new Error("submission outcome unknown"),
    );
    const client = new X402Client(wallet, { ...config(), fetchFn });
    await expect(client.fetch(resource)).rejects.toThrow("unknown");
    expect(client.getDailySpendSummary().global).toBe(7n);
    expect(client.getTransactionLog()).toHaveLength(0);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
  it.each([
    new SubmittedTransactionError("Receipt outcome unknown", hash),
    new QueuedTransactionError(hash, 9n),
  ])("preserves the original submitted error object: $name", async (error) => {
    const fetchFn = vi.fn(async () => challenge());
    vi.mocked(executeVaultOperation).mockRejectedValueOnce(error);
    const client = new X402Client(wallet, { ...config(), fetchFn });
    await expect(client.fetch(resource)).rejects.toBe(error);
    expect(client.getDailySpendSummary().global).toBe(7n);
    expect(client.getTransactionLog()).toHaveLength(0);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
