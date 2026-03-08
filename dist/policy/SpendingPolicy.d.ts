export declare class SpendingPolicy {
    constructor(config: any);
    /**
     * FailClosed: wraps the actual check logic so that ANY unhandled error
     * produces a rejection rather than inadvertently approving a payment.
     */
    check(payment: any): Promise<{
        status: string;
    }>;
    /**
     * Write a payment attempt to the immutable audit log.
     */
    log(payment: any, result: any): Promise<void>;
    /** Return a copy of the current merchant allowlist. */
    getMerchantAllowlist(): unknown[];
    /** Add a merchant address/domain to the allowlist at runtime. */
    addMerchant(address: any): void;
    /** Return the full, immutable audit log (copy). */
    getAuditLog(): any[];
    /** Approve a queued draft by its draftId. Returns false if not found. */
    approveDraft(draftId: any): boolean;
    /** Reject a queued draft by its draftId. Returns false if not found. */
    rejectDraft(draftId: any): boolean;
    /** Return all pending (not yet approved or rejected) drafts. */
    getPendingDrafts(): unknown[];
    /** Return all drafts. */
    getAllDrafts(): unknown[];
    _check(payment: any): Promise<{
        status: string;
    }>;
}
//# sourceMappingURL=SpendingPolicy.d.ts.map