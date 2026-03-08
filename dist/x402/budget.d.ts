/**
 * [MAX-ADDED] In-memory budget tracker for x402 payments.
 * Enforces per-service caps, daily limits, and per-request maximums.
 * On-chain spend limits are ALSO enforced by the AgentWallet contract —
 * this is an additional client-side layer for granular service-level control.
 */
export declare class X402BudgetTracker {
    constructor(config?: {});
    /**
     * Check if a payment is within budget limits.
     * Returns { allowed: true } or { allowed: false, reason: string }.
     */
    checkBudget(service: any, amount: any): {
        allowed: boolean;
        reason: string;
    } | {
        allowed: boolean;
        reason?: undefined;
    };
    /**
     * Record a completed payment.
     */
    recordPayment(log: any): void;
    /**
     * Get transaction history, optionally filtered.
     */
    getTransactionLog(filter: any): any;
    /**
     * Get current daily spend summary.
     */
    getDailySpendSummary(): {
        global: any;
        byService: {};
        resetsAt: any;
    };
    /**
     * Add or update a service budget at runtime.
     */
    setServiceBudget(budget: any): void;
    findServiceBudget(service: any): any;
    maybeResetDaily(): void;
    startOfDay(): number;
}
//# sourceMappingURL=budget.d.ts.map