// @ts-nocheck
import { createWallet, createX402Fetch, } from '../index.js';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
let walletInstance = null;
/**
 * Get or create the agent wallet singleton.
 */
export function getAgentWallet(config) {
    if (!walletInstance) {
        const account = privateKeyToAccount(config.privateKey);
        const rpcUrls = {
            base: 'https://mainnet.base.org',
            'base-sepolia': 'https://sepolia.base.org',
            ethereum: 'https://eth.llamarpc.com',
            arbitrum: 'https://arb1.arbitrum.io/rpc',
            polygon: 'https://polygon-rpc.com',
            etherlink: 'https://node.mainnet.etherlink.com',
        };
        const chain = config.chain ?? 'base';
        const walletClient = createWalletClient({
            account,
            transport: http(config.rpcUrl ?? rpcUrls[chain] ?? rpcUrls.base),
        });
        walletInstance = createWallet({
            accountAddress: config.accountAddress,
            chain,
            walletClient,
        });
    }
    return walletInstance;
}
/**
 * Create an x402-enabled fetch function for the agent to pay APIs automatically.
 */
export function createAgentFetch(config) {
    const wallet = getAgentWallet(config);
    return createX402Fetch(wallet, {
        globalDailyLimit: config.x402DailyLimit ?? 50000000n, // 50 USDC default
    });
}
/**
 * ElizaOS Plugin definition for agentwallet-sdk.
 *
 * Usage in your Eliza character config:
 *
 * ```json
 * {
 *   "plugins": ["@elizaos/plugin-agentwallet"],
 *   "settings": {
 *     "AGENT_PRIVATE_KEY": "0x...",
 *     "AGENT_ACCOUNT_ADDRESS": "0x...",
 *     "AGENT_CHAIN": "base",
 *     "X402_DAILY_LIMIT": "50000000"
 *   }
 * }
 * ```
 */
const AgentWalletPlugin = {
    name: '@elizaos/plugin-agentwallet',
    description: 'Non-custodial agent wallet for ElizaOS — x402 payments, CCTP cross-chain, on-chain spend limits. Agent holds its own keys.',
    actions: [],
    providers: [
        {
            name: 'agentWallet',
            description: 'Provides agent wallet and x402 fetch capability to the runtime',
            async get(runtime) {
                const privateKey = runtime.getSetting('AGENT_PRIVATE_KEY');
                const accountAddress = runtime.getSetting('AGENT_ACCOUNT_ADDRESS');
                const chain = (runtime.getSetting('AGENT_CHAIN') ?? 'base');
                const dailyLimitStr = runtime.getSetting('X402_DAILY_LIMIT');
                const x402DailyLimit = dailyLimitStr ? BigInt(dailyLimitStr) : 50000000n;
                if (!privateKey || !accountAddress) {
                    return 'AgentWallet not configured: AGENT_PRIVATE_KEY and AGENT_ACCOUNT_ADDRESS required.';
                }
                const config = { privateKey, accountAddress, chain, x402DailyLimit };
                const wallet = getAgentWallet(config);
                const x402Fetch = createAgentFetch(config);
                // Expose on runtime for actions to use
                runtime.agentWallet = wallet;
                runtime.x402Fetch = x402Fetch;
                return `AgentWallet ready — non-custodial, keys stay local. Chain: ${chain}. x402 daily limit: ${x402DailyLimit / 1000000n} USDC.`;
            },
        },
    ],
    evaluators: [],
};
export default AgentWalletPlugin;
export { AgentWalletPlugin };
//# sourceMappingURL=elizaos.js.map