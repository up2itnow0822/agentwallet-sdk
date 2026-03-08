export declare const ABSTRACT_CHAIN_IDS: {
    mainnet: number;
    testnet: number;
};
/** USDC on Abstract Mainnet (official Bridged USDC) */
export declare const ABSTRACT_USDC: {
    2741: string;
    11124: string;
};
/** Abstract's approved payment facilitator contracts */
export declare const ABSTRACT_APPROVED_FACILITATORS: string[];
/**
 * Adapter for Abstract's delegated payment facilitator x402 model.
 *
 * Instead of signing a direct payment transaction, the agent signs an EIP-712
 * permit authorizing a facilitator contract to execute the payment on its behalf.
 * This is Abstract's model — the agent's keys never touch the chain directly.
 *
 * @example
 * ```typescript
 * const adapter = new AbstractDelegatedFacilitatorAdapter(walletClient, {
 *   facilitatorAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
 * });
 *
 * const result = await adapter.signPaymentPermit({
 *   amount: 1_000_000n, // 1 USDC (6 decimals)
 *   payTo: '0xmerchant...',
 *   nonce: 0n,
 *   resource: 'https://api.example.com/resource',
 * });
 * ```
 */
export declare class AbstractDelegatedFacilitatorAdapter {
    constructor(walletClient: any, config: any, chainId?: number);
    /**
     * Sign an EIP-712 delegated payment permit for the Abstract facilitator.
     * This replaces direct tx signing — the permit is submitted to the facilitator contract.
     */
    signPaymentPermit(params: any): Promise<{
        permitSignature: any;
        permitData: `0x${string}`;
        permit: {
            facilitator: any;
            token: any;
            amount: any;
            payTo: any;
            nonce: any;
            deadline: bigint;
            resource: any;
        };
        chainId: any;
    }>;
    /**
     * Build the x402 payment payload for Abstract's delegated facilitator model.
     * This payload replaces the standard txHash payload in the X-PAYMENT header.
     */
    buildX402Payload(params: any): Promise<{
        scheme: string;
        chainId: any;
        facilitator: any;
        token: any;
        amount: any;
        payTo: any;
        nonce: any;
        deadline: string;
        resource: any;
        permitSignature: any;
        permitData: `0x${string}`;
    }>;
    /** Check if a chain ID is an Abstract chain */
    static isAbstractChain(chainId: any): boolean;
    /** Get the network string for x402 payment requirements (e.g. "abstract:2741") */
    static getNetworkString(chainId: any): string;
}
/**
 * Abstract chain IDs to add to SUPPORTED_CHAINS in the main SDK.
 * These route through AbstractDelegatedFacilitatorAdapter for x402 payments.
 */
export declare const ABSTRACT_SUPPORTED_CHAINS: {
    'abstract:2741': {
        chainId: number;
        name: string;
        rpcUrl: string;
        nativeCurrency: {
            name: string;
            symbol: string;
            decimals: number;
        };
        blockExplorer: string;
        x402Model: string;
        usdc: any;
    };
    'abstract-testnet:11124': {
        chainId: number;
        name: string;
        rpcUrl: string;
        nativeCurrency: {
            name: string;
            symbol: string;
            decimals: number;
        };
        blockExplorer: string;
        x402Model: string;
        usdc: any;
    };
};
//# sourceMappingURL=index.d.ts.map