import { describe, it, expect } from "vitest";
import { SpendingPolicy } from "../policy/SpendingPolicy.js";
const payment = {
  merchant: "https://merchant.example",
  amount: 7n,
  recipient: "0x2222222222222222222222222222222222222222",
  asset: "0x3333333333333333333333333333333333333333",
  network: "eip155:84532",
  resource: "https://merchant.example/item",
} as const;
const config = {
  merchantAllowlist: [payment.merchant],
  rollingCap: { maxAmount: 10n, windowMs: 60000 },
  draftThreshold: 5n,
  authorizeDraft: (_draft: unknown, authorization: unknown) =>
    authorization === "owner-verified-proof",
};
describe("payment policy security", () => {
  it("rejects negative, zero and non-bigint amounts", async () => {
    const policy = new SpendingPolicy(config);
    for (const amount of [-1n, 0n, NaN, Infinity, 1])
      expect(
        (await policy.check({ ...payment, amount } as typeof payment)).status,
      ).toBe("rejected");
  });
  it("reserves drafts and binds an external authorization to immutable details once", async () => {
    const policy = new SpendingPolicy(config);
    const result = await policy.check(payment);
    expect(result.status).toBe("draft");
    expect((await policy.check(payment)).status).toBe("rejected");
    const draft = policy.getPendingDrafts()[0]!;
    expect(Object.isFrozen(draft)).toBe(true);
    expect(Object.isFrozen(draft.payment)).toBe(true);
    expect(policy.approveDraft(draft.draftId)).toBe(false);
    expect(policy.consumeDraft(draft.draftId, { ...payment, amount: 6n })).toBe(
      false,
    );
    expect(
      policy.consumeDraft(draft.draftId, payment, "owner-verified-proof"),
    ).toBe(true);
    expect(
      policy.consumeDraft(draft.draftId, payment, "owner-verified-proof"),
    ).toBe(false);
  });
  it("returns frozen audit snapshots and denies an empty allowlist", async () => {
    const policy = new SpendingPolicy({ ...config, merchantAllowlist: [] });
    expect((await policy.check(payment)).status).toBe("rejected");
    expect(Object.isFrozen(policy.getAuditLog()[0])).toBe(true);
  });
});
