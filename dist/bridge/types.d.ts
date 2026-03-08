/** CCTP V2 domain IDs (Circle's internal chain identifiers) */
export declare const CCTP_DOMAIN_IDS: {
    ethereum: number;
    optimism: number;
    arbitrum: number;
    base: number;
};
/** EVM chain IDs for supported bridge chains */
export declare const BRIDGE_CHAIN_IDS: {
    ethereum: number;
    optimism: number;
    arbitrum: number;
    base: number;
};
/** USDC contract addresses per chain */
export declare const USDC_CONTRACT: {
    base: string;
    ethereum: string;
    optimism: string;
    arbitrum: string;
};
/**
 * CCTP V2 TokenMessengerV2 addresses (source chain — where burn happens).
 */
export declare const TOKEN_MESSENGER_V2: {
    base: string;
    ethereum: string;
    optimism: string;
    arbitrum: string;
};
/** CCTP V2 MessageTransmitterV2 addresses (destination chain — where mint happens) */
export declare const MESSAGE_TRANSMITTER_V2: {
    base: string;
    ethereum: string;
    optimism: string;
    arbitrum: string;
};
/**
 * CCTP V2 minFinalityThreshold values.
 * - FAST (0): ~12 seconds. Circle fast attestation.
 * - FINALIZED (1000): Full on-chain finality.
 */
export declare const FINALITY_THRESHOLD: {
    FAST: number;
    FINALIZED: number;
};
/** Circle IRIS attestation API base URL */
export declare const CIRCLE_ATTESTATION_API = "https://iris-api.circle.com";
/** Max attestation polling attempts before timeout */
export declare const MAX_ATTESTATION_POLLS = 60;
/** Polling interval for attestation (milliseconds) */
export declare const ATTESTATION_POLL_INTERVAL_MS = 5000;
//# sourceMappingURL=types.d.ts.map