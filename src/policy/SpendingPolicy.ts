import { randomUUID } from "node:crypto";
import { isAddress, type Address } from "viem";

export interface PolicyPayment {
  readonly merchant: string;
  readonly amount: bigint;
  readonly recipient: Address;
  readonly asset: Address;
  readonly network: string;
  readonly resource: string;
}
export type PolicyResult = Readonly<{
  status: "approved" | "rejected" | "draft";
  reason?: string;
  draftId?: string;
}>;
export interface PolicyDraft {
  readonly draftId: string;
  readonly payment: PolicyPayment;
  readonly queuedAt: number;
  readonly state: "pending" | "consumed" | "rejected";
}
export interface PolicyAuditEntry {
  readonly id: string;
  readonly timestamp: number;
  readonly payment: PolicyPayment;
  readonly result: PolicyResult;
}
export interface SpendingPolicyConfig {
  readonly merchantAllowlist: readonly string[];
  readonly rollingCap: {
    readonly maxAmount: bigint;
    readonly windowMs: number;
  };
  readonly draftThreshold?: bigint;
  readonly historyLimit?: number;
  /** Must independently verify owner authorization over every draft detail and ID. Never give this verifier to the agent. */
  readonly authorizeDraft?: (
    draft: PolicyDraft,
    authorization: unknown,
  ) => boolean;
}
const validAmount = (value: unknown): value is bigint =>
  typeof value === "bigint" && value > 0n && value < 2n ** 256n;
function immutablePayment(payment: PolicyPayment): PolicyPayment {
  if (
    !validAmount(payment.amount) ||
    !isAddress(payment.recipient) ||
    !isAddress(payment.asset) ||
    !/^eip155:[1-9]\d*$/.test(payment.network)
  )
    throw new Error("Invalid payment details");
  const merchant = new URL(payment.merchant);
  const resource = new URL(payment.resource);
  if (
    merchant.protocol !== "https:" ||
    merchant.origin !== payment.merchant ||
    merchant.username ||
    merchant.password ||
    resource.origin !== merchant.origin ||
    resource.username ||
    resource.password ||
    resource.hash
  )
    throw new Error("Invalid payment origin/resource");
  return Object.freeze({
    merchant: payment.merchant,
    amount: payment.amount,
    recipient: payment.recipient.toLowerCase() as Address,
    asset: payment.asset.toLowerCase() as Address,
    network: payment.network,
    resource: resource.href,
  });
}
function equalPayment(a: PolicyPayment, b: PolicyPayment): boolean {
  return (
    a.merchant === b.merchant &&
    a.amount === b.amount &&
    a.recipient === b.recipient &&
    a.asset === b.asset &&
    a.network === b.network &&
    a.resource === b.resource
  );
}
/** Supplemental in-process policy, not an asset security boundary. AgentVault enforces actual spending. */
export class SpendingPolicy {
  private readonly config: SpendingPolicyConfig;
  private readonly allowlist: ReadonlySet<string>;
  private readonly drafts = new Map<string, PolicyDraft>();
  private readonly spends: { amount: bigint; timestamp: number }[] = [];
  private readonly audit: PolicyAuditEntry[] = [];
  private readonly historyLimit: number;
  constructor(config: SpendingPolicyConfig) {
    if (
      !validAmount(config.rollingCap?.maxAmount) ||
      !Number.isSafeInteger(config.rollingCap.windowMs) ||
      config.rollingCap.windowMs <= 0 ||
      (config.draftThreshold !== undefined &&
        !validAmount(config.draftThreshold))
    )
      throw new Error("Invalid finite policy limits");
    this.historyLimit = config.historyLimit ?? 1000;
    if (
      !Number.isSafeInteger(this.historyLimit) ||
      this.historyLimit < 1 ||
      this.historyLimit > 10000
    )
      throw new Error("Invalid history limit");
    this.config = Object.freeze({
      ...config,
      rollingCap: Object.freeze({ ...config.rollingCap }),
      merchantAllowlist: Object.freeze([...config.merchantAllowlist]),
    });
    this.allowlist = new Set(config.merchantAllowlist);
  }
  async check(input: PolicyPayment): Promise<PolicyResult> {
    let payment: PolicyPayment;
    try {
      payment = immutablePayment(input);
    } catch {
      return Object.freeze({
        status: "rejected",
        reason: "Invalid payment details",
      });
    }
    const now = Date.now();
    while (
      this.spends.length &&
      this.spends[0]!.timestamp <= now - this.config.rollingCap.windowMs
    )
      this.spends.shift();
    const pending = [...this.drafts.values()]
      .filter((d) => d.state === "pending")
      .reduce((n, d) => n + d.payment.amount, 0n);
    const spent = this.spends.reduce((n, s) => n + s.amount, 0n);
    let result: PolicyResult;
    if (!this.allowlist.has(payment.merchant))
      result = { status: "rejected", reason: "Merchant not authorized" };
    else if (this.spends.length >= this.historyLimit)
      result = { status: "rejected", reason: "Spend history capacity reached" };
    else if (
      spent + pending + payment.amount >
      this.config.rollingCap.maxAmount
    )
      result = { status: "rejected", reason: "Rolling spend cap exceeded" };
    else if (
      this.config.draftThreshold !== undefined &&
      payment.amount >= this.config.draftThreshold
    ) {
      if (this.drafts.size >= this.historyLimit)
        result = { status: "rejected", reason: "Draft capacity reached" };
      else {
        const draftId = randomUUID();
        this.drafts.set(
          draftId,
          Object.freeze({ draftId, payment, queuedAt: now, state: "pending" }),
        );
        result = {
          status: "draft",
          draftId,
          reason: "Independent owner authorization required",
        };
      }
    } else {
      this.spends.push({ amount: payment.amount, timestamp: now });
      result = { status: "approved" };
    }
    result = Object.freeze(result);
    this.audit.push(
      Object.freeze({ id: randomUUID(), timestamp: now, payment, result }),
    );
    if (this.audit.length > this.historyLimit) this.audit.shift();
    return result;
  }
  /** Legacy mutable approval flags are intentionally unsupported. */
  approveDraft(_draftId: string): false {
    return false;
  }
  consumeDraft(
    draftId: string,
    input: PolicyPayment,
    authorization?: unknown,
  ): boolean {
    const draft = this.drafts.get(draftId);
    if (!draft || draft.state !== "pending" || !this.config.authorizeDraft)
      return false;
    try {
      const payment = immutablePayment(input);
      if (
        !equalPayment(draft.payment, payment) ||
        this.config.authorizeDraft(draft, authorization) !== true
      )
        return false;
      // The verifier is synchronous; recheck in case a reentrant verifier consumed/rejected the draft.
      if (this.drafts.get(draftId) !== draft) return false;
      this.drafts.set(draftId, Object.freeze({ ...draft, state: "consumed" }));
      this.spends.push({ amount: draft.payment.amount, timestamp: Date.now() });
      return true;
    } catch {
      return false;
    }
  }
  rejectDraft(draftId: string): boolean {
    const draft = this.drafts.get(draftId);
    if (!draft || draft.state !== "pending") return false;
    this.drafts.set(draftId, Object.freeze({ ...draft, state: "rejected" }));
    return true;
  }
  getMerchantAllowlist(): readonly string[] {
    return Object.freeze([...this.allowlist]);
  }
  getAuditLog(): readonly PolicyAuditEntry[] {
    return Object.freeze([...this.audit]);
  }
  getPendingDrafts(): readonly PolicyDraft[] {
    return Object.freeze(
      [...this.drafts.values()].filter((d) => d.state === "pending"),
    );
  }
  getAllDrafts(): readonly PolicyDraft[] {
    return Object.freeze([...this.drafts.values()]);
  }
}
