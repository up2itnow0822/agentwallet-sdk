// @ts-nocheck
/**
 * SpendingPolicy — Programmable spending guardrails for AI agents.
 *
 * Beats PolicyLayer.com to market with:
 *   - MerchantAllowlist  — allowlist-only merchant enforcement
 *   - RollingSpendCap    — time-windowed spend limits
 *   - DraftThenApprove   — human-in-the-loop for large transactions
 *   - AuditTrail         — immutable local log of every payment attempt
 *   - FailClosed         — policy errors always reject, never approve
 *
 * @module policy/SpendingPolicy
 */
// ─── Helpers ─────────────────────────────────────────────────────────────────
let _idCounter = 0;
function nextId(prefix) {
    return `${prefix}-${Date.now()}-${++_idCounter}`;
}
// ─── SpendingPolicy ───────────────────────────────────────────────────────────
export class SpendingPolicy {
    constructor(config) {
        this.config = config;
        this.allowlist = new Set((config.merchantAllowlist ?? []).map((m) => m.toLowerCase()));
        this.spendWindow = [];
        this.auditLog = [];
        this.drafts = new Map();
    }
    // ─── Public Interface ───────────────────────────────────────────────────────
    /**
     * FailClosed: wraps the actual check logic so that ANY unhandled error
     * produces a rejection rather than inadvertently approving a payment.
     */
    async check(payment) {
        try {
            return await this._check(payment);
        }
        catch (err) {
            const reason = `Policy engine error (fail-closed): ${err instanceof Error ? err.message : String(err)}`;
            const result = { status: 'rejected', reason };
            await this.log(payment, result).catch(() => { });
            return result;
        }
    }
    /**
     * Write a payment attempt to the immutable audit log.
     */
    async log(payment, result) {
        const entry = {
            id: nextId('audit'),
            timestamp: payment.timestamp ?? new Date().toISOString(),
            merchant: payment.merchant,
            amount: payment.amount,
            status: result.status,
            reason: result.reason,
            draftId: result.draftId,
        };
        this.auditLog.push(entry);
    }
    /** Return a copy of the current merchant allowlist. */
    getMerchantAllowlist() {
        return Array.from(this.allowlist);
    }
    /** Add a merchant address/domain to the allowlist at runtime. */
    addMerchant(address) {
        this.allowlist.add(address.toLowerCase());
    }
    /** Return the full, immutable audit log (copy). */
    getAuditLog() {
        return [...this.auditLog];
    }
    // ─── Draft queue management ─────────────────────────────────────────────────
    /** Approve a queued draft by its draftId. Returns false if not found. */
    approveDraft(draftId) {
        const draft = this.drafts.get(draftId);
        if (!draft)
            return false;
        draft.approved = true;
        return true;
    }
    /** Reject a queued draft by its draftId. Returns false if not found. */
    rejectDraft(draftId) {
        const draft = this.drafts.get(draftId);
        if (!draft)
            return false;
        draft.rejected = true;
        return true;
    }
    /** Return all pending (not yet approved or rejected) drafts. */
    getPendingDrafts() {
        return Array.from(this.drafts.values()).filter((d) => !d.approved && !d.rejected);
    }
    /** Return all drafts. */
    getAllDrafts() {
        return Array.from(this.drafts.values());
    }
    // ─── Private Logic ──────────────────────────────────────────────────────────
    async _check(payment) {
        // 1. MerchantAllowlist check (only enforced when allowlist is non-empty)
        if (this.allowlist.size > 0) {
            const merchant = payment.merchant.toLowerCase();
            if (!this.allowlist.has(merchant)) {
                const result = {
                    status: 'rejected',
                    reason: `Merchant "${payment.merchant}" is not on the allowlist.`,
                };
                await this.log(payment, result);
                return result;
            }
        }
        // 2. RollingSpendCap check
        if (this.config.rollingCap) {
            const { maxAmount, windowMs } = this.config.rollingCap;
            const now = Date.now();
            const windowStart = now - windowMs;
            // Purge entries outside the window
            this.spendWindow = this.spendWindow.filter((e) => e.ts >= windowStart);
            const spent = this.spendWindow.reduce((sum, e) => sum + e.amount, 0);
            if (spent + payment.amount > maxAmount) {
                const result = {
                    status: 'rejected',
                    reason: `Rolling spend cap exceeded: spent ${spent}, cap ${maxAmount}, attempted ${payment.amount}.`,
                };
                await this.log(payment, result);
                return result;
            }
        }
        // 3. DraftThenApprove check
        if (this.config.draftThreshold !== undefined &&
            payment.amount >= this.config.draftThreshold) {
            const draftId = nextId('draft');
            const draft = {
                draftId,
                payment,
                queuedAt: payment.timestamp ?? new Date().toISOString(),
                approved: false,
                rejected: false,
            };
            this.drafts.set(draftId, draft);
            const result = {
                status: 'draft',
                reason: `Amount ${payment.amount} meets or exceeds draft threshold ${this.config.draftThreshold}. Awaiting approval.`,
                draftId,
            };
            await this.log(payment, result);
            return result;
        }
        // 4. Approved — record spend in rolling window
        if (this.config.rollingCap) {
            this.spendWindow.push({ amount: payment.amount, ts: Date.now() });
        }
        const result = { status: 'approved' };
        await this.log(payment, result);
        return result;
    }
}
//# sourceMappingURL=SpendingPolicy.js.map