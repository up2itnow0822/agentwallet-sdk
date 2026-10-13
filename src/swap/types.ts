import type { Address, TransactionReceipt, Hex } from 'viem';
/** Primary deployment source: https://developers.uniswap.org/docs/protocols/v3/deployments/v3-base-deployments */
export const BASE_TOKENS = { USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', WETH: '0x4200000000000000000000000000000000000006', cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', WNATIVE: '0x4200000000000000000000000000000000000006' } as const;
export const UNISWAP_V3_BASE = { ROUTER: '0x2626664c2603336E57B271c5C0b26F421741e481', QUOTER_V2: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a' } as const;
export const UNISWAP_V3_DEPLOYMENTS: Readonly<Record<number, {
    ROUTER: Address;
    QUOTER_V2: Address;
}>> = { 8453: UNISWAP_V3_BASE, 84532: { ROUTER: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4', QUOTER_V2: '0xC5290058841028F1614F3A6F0F5816cAd0df5E27' } };
export const PROTOCOL_FEE_BPS = 0;
export const DEFAULT_SLIPPAGE_BPS = 50;
export interface SwapConfig {
    readonly maxSlippageBps?: number;
}
export interface QuoteOptions {
    readonly slippageBps?: number;
    readonly feeTiers?: readonly number[];
}
export interface SwapOptions extends QuoteOptions {
    readonly deadlineSecs?: number;
}
export interface SwapQuote {
    readonly tokenIn: Address;
    readonly tokenOut: Address;
    readonly amountInRaw: bigint;
    readonly amountInNet: bigint;
    readonly feeAmount: bigint;
    readonly amountOut: bigint;
    readonly amountOutMinimum: bigint;
    readonly poolFeeTier: number;
    readonly gasEstimate: bigint;
}
export interface SwapResult {
    readonly txHash: Hex;
    readonly receipt: TransactionReceipt;
    readonly quote: SwapQuote;
    readonly approvalRequired: false;
}
