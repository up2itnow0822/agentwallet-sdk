import type { Address, Hex, PublicClient, WalletClient } from 'viem';
/** Circle primary references: https://developers.circle.com/cctp/references/contract-addresses */
export const CCTP_DOMAIN_IDS = {
    ethereum: 0, optimism: 2, arbitrum: 3, base: 6,
    'ethereum-sepolia': 0, 'optimism-sepolia': 2, 'arbitrum-sepolia': 3, 'base-sepolia': 6,
} as const;
export type BridgeChain = keyof typeof CCTP_DOMAIN_IDS;
export const BRIDGE_CHAIN_IDS = {
    ethereum: 1, optimism: 10, arbitrum: 42161, base: 8453,
    'ethereum-sepolia': 11155111, 'optimism-sepolia': 11155420, 'arbitrum-sepolia': 421614, 'base-sepolia': 84532,
} as const;
export const BRIDGE_ENVIRONMENTS = {
    ethereum: 'mainnet', optimism: 'mainnet', arbitrum: 'mainnet', base: 'mainnet',
    'ethereum-sepolia': 'testnet', 'optimism-sepolia': 'testnet', 'arbitrum-sepolia': 'testnet', 'base-sepolia': 'testnet',
} as const;
/** Native Circle USDC: https://developers.circle.com/stablecoins/usdc-contract-addresses */
export const USDC_CONTRACT = {
    base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    'ethereum-sepolia': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    'arbitrum-sepolia': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    'optimism-sepolia': '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
} as const;
const messenger = '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', transmitter = '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64';
const testnetMessenger = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA', testnetTransmitter = '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275';
export const TOKEN_MESSENGER_V2 = {
    base: messenger, ethereum: messenger, optimism: messenger, arbitrum: messenger,
    'base-sepolia': testnetMessenger, 'ethereum-sepolia': testnetMessenger, 'optimism-sepolia': testnetMessenger, 'arbitrum-sepolia': testnetMessenger,
} as const;
export const MESSAGE_TRANSMITTER_V2 = {
    base: transmitter, ethereum: transmitter, optimism: transmitter, arbitrum: transmitter,
    'base-sepolia': testnetTransmitter, 'ethereum-sepolia': testnetTransmitter, 'optimism-sepolia': testnetTransmitter, 'arbitrum-sepolia': testnetTransmitter,
} as const;
export const FINALITY_THRESHOLD = { FAST: 1000, STANDARD: 2000, FINALIZED: 2000 } as const;
export const CIRCLE_ATTESTATION_API = 'https://iris-api.circle.com';
/** Hosts are selected from the source network, never caller input. */
export const CIRCLE_ATTESTATION_API_BY_ENVIRONMENT = {
    mainnet: CIRCLE_ATTESTATION_API, testnet: 'https://iris-api-sandbox.circle.com',
} as const;
export const MAX_ATTESTATION_POLLS = 60, ATTESTATION_POLL_INTERVAL_MS = 5000;
export interface DestinationClients {
    readonly publicClient: PublicClient;
    readonly walletClient: WalletClient;
}
export interface BridgeOptions {
    readonly destinationAddress: Address;
    readonly maxFee?: bigint;
    readonly minFinalityThreshold?: 1000 | 2000;
}
export interface BridgeRecord {
    readonly version: 1;
    readonly id: string;
    readonly vault: Address;
    readonly fromChain: BridgeChain;
    readonly toChain: BridgeChain;
    readonly recipient: Address;
    readonly amount: string;
    readonly maxFee: string;
    readonly minFinalityThreshold: 1000 | 2000;
    readonly createdAt: number;
    readonly status: 'prepared' | 'burn-submitted' | 'burned' | 'attested' | 'mint-submitting' | 'mint-submitted' | 'minted';
    readonly burnTxHash?: Hex;
    readonly sourceMessage?: Hex;
    readonly message?: Hex;
    readonly attestation?: Hex;
    readonly nonce?: Hex;
    readonly mintTxHash?: Hex;
}
/** Implementations must durably commit save() and serialize withLock() across all callers/processes. */
export interface BridgeStore {
    save(record: BridgeRecord): Promise<void>;
    load(id: string): Promise<BridgeRecord | undefined>;
    withLock<T>(id: string, run: () => Promise<T>): Promise<T>;
}
export interface BridgeConfig {
    readonly destinations: Partial<Record<BridgeChain, DestinationClients>>;
    readonly store: BridgeStore;
    readonly maxAttestationPolls?: number;
    readonly attestationPollIntervalMs?: number;
}
export interface AttestedMessage {
    readonly message: Hex;
    readonly attestation: Hex;
}
