/// <reference types="node" resolution-mode="require"/>
/**
 * [MAX-ADDED] x402 Payment Client for AgentWallet.
 *
 * Handles the full x402 payment flow:
 * 1. Detects 402 Payment Required responses
 * 2. Parses payment instructions from PAYMENT-REQUIRED header
 * 3. Validates against budget controls
 * 4. Executes USDC payment via AgentWallet contract
 * 5. Retries original request with payment proof
 */
export declare class X402Client {
    constructor(wallet: any, config?: {});
    /**
     * Make an x402-aware fetch request. Automatically handles 402 responses.
     */
    fetch(url: any, init: any): Promise<Response>;
    /**
     * Parse a 402 response to extract payment requirements.
     */
    parse402Response(response: any): Promise<any>;
    /**
     * Select the best compatible payment option from offered requirements.
     * Prefers: Base network, USDC, exact scheme.
     */
    selectPaymentOption(accepts: any): any;
    /**
     * Execute the payment via AgentWallet's agentTransferToken.
     */
    executePayment(req: any): Promise<{
        txHash: any;
    }>;
    /** Get the budget tracker for direct inspection */
    get budgetTracker(): any;
    /** Get transaction log */
    getTransactionLog(filter: any): any;
    /** Get daily spend summary */
    getDailySpendSummary(): any;
}
export declare class X402PaymentError extends Error {
    constructor(message: any, paymentRequirements: any);
}
export declare class X402BudgetExceededError extends Error {
    constructor(reason: any, url: any, paymentRequirements: any);
}
//# sourceMappingURL=client.d.ts.map