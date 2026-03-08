import { CCTP_DOMAIN_IDS, BRIDGE_CHAIN_IDS, USDC_CONTRACT, TOKEN_MESSENGER_V2, MESSAGE_TRANSMITTER_V2, FINALITY_THRESHOLD } from './types.js';
export declare class BridgeModule {
    constructor(walletClient: any, fromChain?: string, options?: {});
    bridge(amount: any, toChain: any, options?: {}): Promise<{
        burnTxHash: any;
        mintTxHash: any;
        amount: any;
        fromChain: any;
        toChain: any;
        recipient: any;
        nonce: bigint;
        elapsedMs: number;
    }>;
    burn(amount: any, toChain: any, options?: {}): Promise<{
        burnTxHash: any;
        nonce: bigint;
        messageHash: `0x${string}`;
        messageBytes: string;
        sourceDomain: any;
        destinationDomain: any;
    }>;
    waitForAttestation(messageHash: any, apiUrl?: string): Promise<any>;
    mint(messageBytes: any, attestation: any, toChain: any, destinationRpcUrl: any): Promise<any>;
    getUsdcBalance(): Promise<any>;
    getUsdcAllowance(): Promise<any>;
    approveUsdc(amount: any): Promise<void>;
    depositForBurn(amount: any, toChain: any, recipient: any, minFinalityThreshold: any, maxFee: any): Promise<{
        burnTxHash: any;
        nonce: bigint;
        messageHash: `0x${string}`;
        messageBytes: string;
        sourceDomain: any;
        destinationDomain: any;
    }>;
    extractMessageSent(receipt: any): {
        messageBytes: string;
        messageHash: `0x${string}`;
        nonce: bigint;
    };
    pollForAttestation(messageHash: any, fromChain: any, apiUrl: any): Promise<any>;
    receiveMessage(messageBytes: any, attestation: any, toChain: any, destinationRpcUrl: any): Promise<any>;
    validateBridgeParams(amount: any, toChain: any): void;
    sleep(ms: any): Promise<unknown>;
}
export declare class BridgeError extends Error {
    constructor(code: any, message: any);
}
export declare function createBridge(walletClient: any, fromChain?: string, options?: {}): BridgeModule;
export { CCTP_DOMAIN_IDS, BRIDGE_CHAIN_IDS, USDC_CONTRACT, TOKEN_MESSENGER_V2, MESSAGE_TRANSMITTER_V2, FINALITY_THRESHOLD, };
//# sourceMappingURL=client.d.ts.map