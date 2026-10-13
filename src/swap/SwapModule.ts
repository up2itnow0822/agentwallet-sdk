import { isAddress, zeroAddress } from "viem";
import type { Address } from "viem";
import type { AgentWallet } from "../types.js";
import { executeVaultOperation } from "../wallet/execution.js";
import { UniswapV3QuoterV2Abi } from "./abi.js";
import { DEFAULT_SLIPPAGE_BPS, UNISWAP_V3_DEPLOYMENTS } from "./types.js";
import type { QuoteOptions, SwapConfig, SwapOptions, SwapQuote, SwapResult } from "./types.js";
const FEE_TIERS = [100, 500, 3000, 10000] as const;
const routerView = [{ type: "function", name: "router", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }] as const;
function positive(amount: bigint) {
    if (typeof amount !== "bigint" || amount <= 0n || amount >= 2n ** 256n) {
        throw new Error("Swap amount must be a nonzero uint256 bigint");
    }
}
function slippage(value: number, max = 500) {
    if (!Number.isInteger(value) || value < 0 || value > max) {
        throw new Error(`Slippage must be 0..${max} basis points`);
    }
}
function knownOptions(value: object, keys: readonly string[]) {
    if (Object.keys(value).some(k => !keys.includes(k))) {
        throw new Error("Unsupported swap option; fees and EOA execution are removed in v5");
    }
}
export function calcProtocolFee(amount: bigint, feeBps = 0): bigint {
    positive(amount);
    if (feeBps !== 0) {
        throw new Error("SDK protocol fees are disabled; owner policy governs spending");
    }
    return 0n;
}
export function applySlippage(amount: bigint, slippageBps: number): bigint {
    positive(amount);
    slippage(slippageBps);
    return amount * BigInt(10000 - slippageBps) / 10000n;
}
export function calcDeadline(deadlineSecs: number): bigint {
    if (!Number.isInteger(deadlineSecs) || deadlineSecs < 1 || deadlineSecs > 3600) {
        throw new Error("Deadline duration must be 1..3600 seconds");
    }
    return BigInt(Math.floor(Date.now() / 1000) + deadlineSecs);
}
export class SwapModule {
    private readonly wallet: AgentWallet;
    private readonly maxSlippageBps: number;
    constructor(wallet: AgentWallet, config: SwapConfig = {}) {
        if (!wallet?.address || !isAddress(wallet.address) || !wallet.chain || !wallet.publicClient || !wallet.walletClient || !wallet.contract || !wallet.expectedCodeHash) {
            throw new Error("SwapModule v5 requires a guarded AgentWallet; raw EOA clients are unsupported");
        }
        knownOptions(config, ["maxSlippageBps"]);
        this.maxSlippageBps = config.maxSlippageBps ?? 500;
        slippage(this.maxSlippageBps);
        if (!UNISWAP_V3_DEPLOYMENTS[wallet.chain.id]) {
            throw new Error("Unsupported swap chain; only Base and Base Sepolia are configured");
        }
        this.wallet = wallet;
    }
    private validate(tokenIn: Address, tokenOut: Address, amount: bigint, options: QuoteOptions) {
        positive(amount);
        for (const token of [tokenIn, tokenOut])
            if (!isAddress(token) || token.toLowerCase() === zeroAddress) {
                throw new Error("Swap requires ERC20 token addresses");
            }
        if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
            throw new Error("Swap pair must contain different tokens");
        }
        slippage(options.slippageBps ?? DEFAULT_SLIPPAGE_BPS, this.maxSlippageBps);
        const tiers = options.feeTiers ?? FEE_TIERS;
        if (!Array.isArray(tiers) || tiers.length < 1 || tiers.length > 4 || tiers.some(f => !FEE_TIERS.includes(f as (typeof FEE_TIERS)[number]))) {
            throw new Error("Invalid Uniswap fee tiers");
        }
    }
    async getQuote(tokenIn: Address, tokenOut: Address, amountIn: bigint, options: QuoteOptions = {}): Promise<SwapQuote> {
        knownOptions(options, ["slippageBps", "feeTiers"]);
        options = Object.freeze({ ...options, feeTiers: options.feeTiers ? Object.freeze([...options.feeTiers]) : undefined });
        this.validate(tokenIn, tokenOut, amountIn, options);
        const deployment = UNISWAP_V3_DEPLOYMENTS[this.wallet.chain.id]!;
        if (await this.wallet.publicClient.getChainId() !== this.wallet.chain.id) {
            throw new Error("Quote RPC chain mismatch");
        }
        const router = await this.wallet.publicClient.readContract({ address: this.wallet.address, abi: routerView, functionName: "router" });
        if (router.toLowerCase() !== deployment.ROUTER.toLowerCase()) {
            throw new Error("Vault router does not match trusted chain deployment");
        }
        let best: {
            amountOut: bigint;
            fee: number;
            gasEstimate: bigint;
        } | undefined;
        for (const fee of options.feeTiers ?? FEE_TIERS) {
            try {
                const { result } = await this.wallet.publicClient.simulateContract({ address: deployment.QUOTER_V2, abi: UniswapV3QuoterV2Abi, functionName: "quoteExactInputSingle", account: this.wallet.address, args: [{ tokenIn, tokenOut, amount: amountIn, fee, sqrtPriceLimitX96: 0n }] });
                const [amountOut, , , gasEstimate] = result;
                if (amountOut > 0n && (!best || amountOut > best.amountOut)) {
                    best = { amountOut, fee, gasEstimate };
                }
            }
            catch {
            }
        }
        if (!best) {
            throw new Error("No usable Uniswap V3 quote on configured chain");
        }
        const minimum = applySlippage(best.amountOut, options.slippageBps ?? DEFAULT_SLIPPAGE_BPS);
        if (minimum === 0n) {
            throw new Error("Swap output floor rounds to zero");
        }
        return Object.freeze({ tokenIn, tokenOut, amountInRaw: amountIn, amountInNet: amountIn, feeAmount: 0n, amountOut: best.amountOut, amountOutMinimum: minimum, poolFeeTier: best.fee, gasEstimate: best.gasEstimate });
    }
    async swap(tokenIn: Address, tokenOut: Address, amountIn: bigint, options: SwapOptions = {}): Promise<SwapResult> {
        knownOptions(options, ["slippageBps", "feeTiers", "deadlineSecs"]);
        const deadline = calcDeadline(options.deadlineSecs ?? 300);
        const quote = await this.getQuote(tokenIn, tokenOut, amountIn, { slippageBps: options.slippageBps, feeTiers: options.feeTiers });
        if (deadline <= BigInt(Math.floor(Date.now() / 1000))) {
            throw new Error("Swap deadline expired while quoting");
        }
        const result = await executeVaultOperation(this.wallet, "agentSwap", [tokenIn, tokenOut, amountIn, quote.amountOutMinimum, quote.poolFeeTier, deadline]);
        return { ...result, quote, approvalRequired: false };
    }
    executeSwap(tokenIn: Address, tokenOut: Address, amountIn: bigint, options: SwapOptions = {}) {
        return this.swap(tokenIn, tokenOut, amountIn, options);
    }
    getConfig() {
        return Object.freeze({ maxSlippageBps: this.maxSlippageBps, feeBps: 0 });
    }
}
export function attachSwap(wallet: AgentWallet, config: SwapConfig = {}) {
    const swapModule = new SwapModule(wallet, config);
    return { ...wallet, swapModule, swap: swapModule.swap.bind(swapModule), executeSwap: swapModule.executeSwap.bind(swapModule), getQuote: swapModule.getQuote.bind(swapModule) };
}
