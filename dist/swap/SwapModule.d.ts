/** Calculate protocol fee: floor(amount * feeBps / 100_000) */
export declare function calcProtocolFee(amount: any, feeBps: any): bigint;
/** Apply slippage: floor(amount * (10_000 - slippageBps) / 10_000) */
export declare function applySlippage(amount: any, slippageBps: any): bigint;
/** Encode deadline: block.timestamp + deadlineSecs */
export declare function calcDeadline(deadlineSecs: any): bigint;
export declare class SwapModule {
    constructor(publicClient: any, walletClient: any, accountAddress: any, config: any);
    getQuote(tokenIn: any, tokenOut: any, amountIn: any, options?: {}): Promise<{
        tokenIn: any;
        tokenOut: any;
        amountInRaw: any;
        amountInNet: bigint;
        feeAmount: bigint;
        amountOut: any;
        amountOutMinimum: bigint;
        poolFeeTier: any;
        effectiveRate: number;
        gasEstimate: any;
    }>;
    ensureApproval(token: any, spender: any, amount: any): Promise<any>;
    transferFee(token: any, feeAmount: any, feeWallet: any): Promise<any>;
    swap(tokenIn: any, tokenOut: any, amountIn: any, options?: {}): Promise<{
        txHash: any;
        feeTxHash: any;
        quote: {
            tokenIn: any;
            tokenOut: any;
            amountInRaw: any;
            amountInNet: bigint;
            feeAmount: bigint;
            amountOut: any;
            amountOutMinimum: bigint;
            poolFeeTier: any;
            effectiveRate: number;
            gasEstimate: any;
        };
        approvalRequired: boolean;
        approvalTxHash: any;
    }>;
    getConfig(): any;
    setFeeWallet(address: any): void;
}
export declare function attachSwap(wallet: any, config: any): any;
//# sourceMappingURL=SwapModule.d.ts.map