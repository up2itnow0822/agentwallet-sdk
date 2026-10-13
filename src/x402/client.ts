import {
  decodeEventLog,
  parseAbi,
  isAddress,
  zeroAddress,
  type Address,
} from "viem";
import type { AgentWallet } from "../types.js";
import { executeVaultOperation } from "../wallet/execution.js";
import { fetchPublicPaymentResource } from "./transport.js";
import {
  X402BudgetTracker,
  assertPositiveAmount,
  type PaymentLog,
} from "./budget.js";
import {
  GUARDED_TRANSACTION_SCHEME,
  PAYMENT_HEADER,
  PAYMENT_REQUIRED_HEADER,
  type ApprovedPaymentService,
  type GuardedPaymentRequired,
  type GuardedPaymentRequirements,
  type X402ClientConfig,
  type FetchFunction,
} from "./types.js";

const TRANSFER_ABI = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);
export const PAYMENT_BINDING_TYPES = Object.freeze({
  PaymentBinding: Object.freeze(
    [
      { name: "txHash", type: "bytes32" },
      { name: "resource", type: "string" },
      { name: "requestId", type: "string" },
      { name: "asset", type: "address" },
      { name: "payTo", type: "address" },
      { name: "amount", type: "uint256" },
    ].map((field) => Object.freeze(field)),
  ),
});
function safeOrigin(value: string): string {
  const u = new URL(value);
  if (u.protocol !== "https:" || u.username || u.password || u.hash)
    throw new Error("HTTPS origin without credentials or fragment required");
  return u.origin;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** HTTP 402 guarded transaction settlement, explicitly separate from standard x402 exact authorization. */
export class X402Client {
  private readonly wallet: AgentWallet;
  private readonly config: X402ClientConfig;
  private readonly services: ReadonlyMap<string, ApprovedPaymentService>;
  private readonly fetchFn: FetchFunction;
  private readonly budget?: X402BudgetTracker;
  constructor(wallet: AgentWallet, config: X402ClientConfig = {}) {
    if (
      !isAddress(wallet.address) ||
      !Number.isSafeInteger(wallet.chain.id) ||
      wallet.chain.id <= 0
    )
      throw new Error("Invalid guarded wallet");
    this.wallet = Object.freeze({
      ...wallet,
      chain: Object.freeze({ ...wallet.chain }),
    });
    this.config = Object.freeze({ ...config });
    this.fetchFn = config.fetchFn ?? fetchPublicPaymentResource;
    this.services = new Map(
      (config.approvedServices ?? []).map((s) => {
        if (
          safeOrigin(s.origin) !== s.origin ||
          !isAddress(s.asset) ||
          s.asset.toLowerCase() === zeroAddress ||
          !isAddress(s.recipient) ||
          s.recipient.toLowerCase() === zeroAddress ||
          s.network !== `eip155:${wallet.chain.id}`
        )
          throw new Error("Invalid explicitly approved service");
        return [s.origin, Object.freeze({ ...s })];
      }),
    );
    if (
      this.services.size !== (config.approvedServices?.length ?? 0) ||
      this.services.size > 1000
    )
      throw new Error("Duplicate/too many service permissions");
    if (config.autoPay === true) {
      const permissions = [...this.services.values()];
      const asset = permissions[0]?.asset;
      if (
        !asset ||
        permissions.some(
          (s) => s.asset.toLowerCase() !== asset.toLowerCase(),
        ) ||
        config.globalDailyLimit === undefined ||
        config.globalPerRequestMax === undefined ||
        !config.serviceBudgets ||
        config.serviceBudgets.some((s) => !this.services.has(s.service)) ||
        config.serviceBudgets.length !== this.services.size
      )
        throw new Error(
          "Automatic payments require exact services, single asset and explicit finite budgets",
        );
      this.budget = new X402BudgetTracker({
        scope: { wallet: wallet.address, chainId: wallet.chain.id, asset },
        globalDailyLimit: config.globalDailyLimit,
        globalPerRequestMax: config.globalPerRequestMax,
        serviceBudgets: config.serviceBudgets,
        durableDirectory: config.durableDirectory,
        memoryStore: config.memoryStore,
      });
    }
  }
  private validateResponse(response: Response, resource: string): void {
    if (
      response.redirected ||
      (response.status >= 300 && response.status < 400) ||
      (response.url && response.url !== resource)
    )
      throw new Error(
        "Payment client refuses redirected or resource-mismatched responses",
      );
  }
  async fetch(
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> {
    const resource = new URL(
      input instanceof Request ? input.url : input.toString(),
    ).href;
    const service = safeOrigin(resource);
    if (!this.services.has(service))
      throw new Error("Request origin is not explicitly approved");
    const method = (
      init?.method ?? (input instanceof Request ? input.method : "GET")
    ).toUpperCase();
    if (method !== "GET" && method !== "HEAD")
      throw new Error("Guarded payment retries support GET/HEAD only");
    const originalHeaders = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    if (
      originalHeaders.has(PAYMENT_HEADER) ||
      originalHeaders.has("PAYMENT-SIGNATURE") ||
      originalHeaders.has("X-PAYMENT")
    )
      throw new Error("Caller-supplied payment proof is not allowed");
    const response = await this.fetchFn(
      input instanceof Request ? input.clone() : input,
      { ...init, redirect: "error" },
    );
    this.validateResponse(response, resource);
    if (response.status !== 402 || this.config.autoPay !== true)
      return response;
    const required = this.parse402Response(response);
    const selected = this.selectPaymentOption(required, resource);
    const amount = BigInt(selected.amount);
    const budget = this.budget!;
    let reservation: string;
    try {
      reservation = budget.reserve(service, amount, selected);
    } catch (error) {
      throw new X402BudgetExceededError(
        error instanceof Error ? error.message : "Denied",
        resource,
        selected,
      );
    }
    let submitting = false;
    try {
      if (
        this.config.onBeforePayment &&
        (await this.config.onBeforePayment(selected, resource)) !== true
      ) {
        budget.release(reservation);
        return response;
      }
      if (selected.expiresAt <= Date.now())
        throw new X402PaymentError(
          "Payment challenge expired during approval",
          selected,
        );
      budget.markSubmitting(reservation);
      submitting = true;
      const result = await executeVaultOperation(
        this.wallet,
        "agentTransferToken",
        [selected.asset, selected.payTo, amount],
        { onSubmitted: (txHash) => budget.markSubmitted(reservation, txHash) },
      );
      if (result.receipt.status !== "success")
        throw new X402PaymentError("Payment receipt failed", selected);
      const transferred =
        result.receipt.transactionHash === result.txHash &&
        result.receipt.logs.some((log) => {
          if (log.address.toLowerCase() !== selected.asset.toLowerCase())
            return false;
          try {
            const event = decodeEventLog({
              abi: TRANSFER_ABI,
              data: log.data,
              topics: log.topics,
              strict: true,
            });
            return (
              event.args.from.toLowerCase() ===
                this.wallet.address.toLowerCase() &&
              event.args.to.toLowerCase() === selected.payTo.toLowerCase() &&
              event.args.value === amount
            );
          } catch {
            return false;
          }
        });
      if (!transferred)
        throw new X402PaymentError(
          "No confirmed ERC20 transfer from vault to authorized recipient",
          selected,
        );
      const log: PaymentLog = Object.freeze({
        timestamp: Math.floor(Date.now() / 1000),
        service,
        url: resource,
        amount,
        token: selected.asset,
        recipient: selected.payTo,
        txHash: result.txHash,
        requestId: selected.requestId,
        network: selected.network,
        scheme: GUARDED_TRANSACTION_SCHEME,
        success: true,
      });
      budget.complete(reservation, log);
      const account = this.wallet.walletClient.account;
      if (!account)
        throw new X402PaymentError(
          "Missing gas operator account for resource binding",
          selected,
        );
      const signature = await this.wallet.walletClient.signTypedData({
        account,
        domain: {
          name: "AgentVaultTransactionPayment",
          version: "1",
          chainId: this.wallet.chain.id,
          verifyingContract: this.wallet.address,
        },
        types: PAYMENT_BINDING_TYPES,
        primaryType: "PaymentBinding",
        message: {
          txHash: result.txHash,
          resource,
          requestId: selected.requestId,
          asset: selected.asset,
          payTo: selected.payTo,
          amount,
        },
      });
      const payload = {
        protocol: GUARDED_TRANSACTION_SCHEME,
        resource,
        accepted: selected,
        payload: {
          txHash: result.txHash,
          vault: this.wallet.address,
          signer: account.address,
          signature,
        },
      };
      const retryHeaders = new Headers(originalHeaders);
      retryHeaders.set(
        PAYMENT_HEADER,
        Buffer.from(JSON.stringify(payload), "utf8").toString("base64"),
      );
      const retry = await this.fetchFn(
        input instanceof Request ? input.clone() : input,
        { ...init, headers: retryHeaders, redirect: "error" },
      );
      this.validateResponse(retry, resource);
      // Callback failures must never trigger another payment or change settled accounting.
      try {
        this.config.onPaymentComplete?.(log);
      } catch {
        /* observer only */
      }
      return retry;
    } catch (error) {
      if (!submitting) budget.release(reservation);
      // Once execution begins, even a transport/simulation failure is conservatively retained.
      throw error;
    }
  }
  parse402Response(response: Response): GuardedPaymentRequired {
    const header = response.headers.get(PAYMENT_REQUIRED_HEADER);
    if (!header)
      throw new X402PaymentError(
        "Standard x402 exact is unsupported by guarded transaction settlement; custom challenge header required",
      );
    if (
      header.length > 32768 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(header) ||
      header.length % 4 !== 0
    )
      throw new X402PaymentError("Malformed or oversized payment challenge");
    let value: unknown;
    try {
      const bytes = Buffer.from(header, "base64");
      if (bytes.toString("base64") !== header) throw new Error();
      value = JSON.parse(bytes.toString("utf8")) as unknown;
    } catch {
      throw new X402PaymentError("Malformed payment challenge");
    }
    if (
      !record(value) ||
      value.protocol !== GUARDED_TRANSACTION_SCHEME ||
      typeof value.resource !== "string" ||
      !Array.isArray(value.accepts) ||
      value.accepts.length < 1 ||
      value.accepts.length > 16
    )
      throw new X402PaymentError("Unsupported or invalid payment challenge");
    const accepts = value.accepts.map(
      (req: unknown): GuardedPaymentRequirements => {
        if (
          !record(req) ||
          req.scheme !== GUARDED_TRANSACTION_SCHEME ||
          req.network !== `eip155:${this.wallet.chain.id}` ||
          typeof req.asset !== "string" ||
          !isAddress(req.asset) ||
          typeof req.payTo !== "string" ||
          !isAddress(req.payTo) ||
          typeof req.amount !== "string" ||
          !/^[1-9]\d{0,77}$/.test(req.amount) ||
          typeof req.resource !== "string" ||
          typeof req.requestId !== "string" ||
          !/^[A-Za-z0-9_-]{16,128}$/.test(req.requestId) ||
          typeof req.expiresAt !== "number" ||
          !Number.isSafeInteger(req.expiresAt) ||
          req.expiresAt <= Date.now() ||
          req.expiresAt > Date.now() + 300000
        )
          throw new X402PaymentError("Invalid payment option");
        assertPositiveAmount(BigInt(req.amount));
        return Object.freeze({
          scheme: GUARDED_TRANSACTION_SCHEME,
          network: req.network as `eip155:${number}`,
          asset: req.asset as Address,
          payTo: req.payTo as Address,
          amount: req.amount,
          resource: req.resource,
          requestId: req.requestId,
          expiresAt: req.expiresAt,
        });
      },
    );
    return Object.freeze({
      protocol: GUARDED_TRANSACTION_SCHEME,
      resource: value.resource,
      accepts: Object.freeze(accepts),
    });
  }
  selectPaymentOption(
    required: GuardedPaymentRequired,
    resource: string,
  ): GuardedPaymentRequirements {
    if (required.resource !== resource)
      throw new X402PaymentError("Payment challenge resource mismatch");
    const permitted = this.services.get(safeOrigin(resource));
    const options = required.accepts.filter(
      (req) =>
        req.resource === resource &&
        req.network === permitted?.network &&
        req.asset.toLowerCase() === permitted.asset.toLowerCase() &&
        req.payTo.toLowerCase() === permitted.recipient.toLowerCase(),
    );
    if (!options.length)
      throw new X402PaymentError(
        "Recipient, asset, network or resource is not authorized",
      );
    options.sort((a, b) =>
      BigInt(a.amount) < BigInt(b.amount)
        ? -1
        : BigInt(a.amount) > BigInt(b.amount)
          ? 1
          : 0,
    );
    return options[0]!;
  }
  get budgetTracker(): X402BudgetTracker {
    if (!this.budget) throw new Error("Automatic payments disabled");
    return this.budget;
  }
  getTransactionLog(filter?: {
    readonly service?: string;
    readonly since?: number;
  }): readonly PaymentLog[] {
    return this.budget?.getTransactionLog(filter) ?? Object.freeze([]);
  }
  getDailySpendSummary(): Readonly<{
    global: bigint;
    byService: Readonly<Record<string, bigint>>;
    resetsAt: number;
  }> {
    return (
      this.budget?.getDailySpendSummary() ??
      Object.freeze({ global: 0n, byService: Object.freeze({}), resetsAt: 0 })
    );
  }
}
export class X402PaymentError extends Error {
  constructor(
    message: string,
    readonly paymentRequirements?: GuardedPaymentRequirements,
  ) {
    super(`Guarded payment error: ${message}`);
    this.name = "X402PaymentError";
  }
}
export class X402BudgetExceededError extends Error {
  constructor(
    readonly reason: string,
    readonly url: string,
    readonly paymentRequirements: GuardedPaymentRequirements,
  ) {
    super(`Budget exceeded: ${reason}`);
    this.name = "X402BudgetExceededError";
  }
}
