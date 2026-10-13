import { isAddress } from "viem";
import type { Address } from "viem";
import type { AgentWallet } from "../types.js";
import { verifyGuardedWallet } from "../wallet/execution.js";
import { X402Client } from "../x402/client.js";
import type { X402ClientConfig } from "../x402/types.js";
export interface AgentPluginConfig {
    readonly wallet: AgentWallet;
    readonly payment?: X402ClientConfig;
}
export interface AgentWalletCapabilities {
    readonly address: Address;
    readonly chainId: number;
    readonly fetch: X402Client["fetch"];
}
interface ScopeState {
    readonly config: AgentPluginConfig;
    readonly publicClient: AgentWallet["publicClient"];
    readonly walletClient: AgentWallet["walletClient"];
    readonly identity: string;
    readonly paymentFingerprint: string;
    readonly payment: X402ClientConfig | undefined;
    readonly capabilities: AgentWalletCapabilities;
}
const scopes = new WeakMap<object, ScopeState>();
const roles = [{ type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }, { type: "function", name: "isOperatorActive", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "bool" }] }] as const;
async function verifyOperator(wallet: AgentWallet) {
    await verifyGuardedWallet(wallet);
    const signer = wallet.walletClient.account!.address;
    const owner = await wallet.publicClient.readContract({ address: wallet.address, abi: roles, functionName: "owner" });
    if (owner.toLowerCase() === signer.toLowerCase()) {
        throw new Error("AI runtime must use a non-owner gas operator; owner credentials are prohibited");
    }
    const active = await wallet.publicClient.readContract({ address: wallet.address, abi: roles, functionName: "isOperatorActive", args: [signer] });
    if (!active) {
        throw new Error("AI runtime gas signer is not an active vault operator");
    }
}
function fingerprint(config: AgentPluginConfig) {
    return JSON.stringify(config.payment ?? {}, (_key, value: unknown) => typeof value === "bigint" ? `${value}n` : value);
}
function state(config: AgentPluginConfig, scope: object): ScopeState {
    const wallet = config?.wallet;
    if (!wallet?.address || !isAddress(wallet.address) || !wallet.contract || !wallet.expectedCodeHash || !wallet.publicClient || !wallet.walletClient || !wallet.walletClient.account) {
        throw new Error("Eliza plugin v5 requires an explicit guarded AgentWallet; private key settings are unsupported");
    }
    if (Object.keys(config).some(k => !["wallet", "payment"].includes(k))) {
        throw new Error("Unsupported plugin configuration; owner credentials must stay outside runtime");
    }
    if (wallet.publicClient.chain?.id !== wallet.chain.id || wallet.walletClient.chain?.id !== wallet.chain.id) {
        throw new Error("Plugin public and gas signing RPC clients must use the same wallet chain");
    }
    const identity = `${wallet.address.toLowerCase()}:${wallet.chain.id}:${wallet.walletClient.account.address.toLowerCase()}:${wallet.expectedCodeHash}`;
    const paymentFingerprint = fingerprint(config);
    const previous = scopes.get(scope);
    if (previous) {
        if (previous.identity !== identity || previous.publicClient !== wallet.publicClient || previous.walletClient !== wallet.walletClient || previous.payment !== config.payment || previous.paymentFingerprint !== paymentFingerprint) {
            throw new Error("Wallet/payment configuration changed in an active runtime scope; create a new scope");
        }
        return previous;
    }
    const client = new X402Client(wallet, config.payment ?? {});
    const capabilities = Object.freeze({ address: wallet.address, chainId: wallet.chain.id, fetch: async (...args: Parameters<X402Client["fetch"]>) => {
            await verifyOperator(wallet);
            return client.fetch(...args);
        } });
    const next = { config, publicClient: wallet.publicClient, walletClient: wallet.walletClient, identity, paymentFingerprint, payment: config.payment, capabilities };
    scopes.set(scope, next);
    return next;
}
export function getAgentWallet(config: AgentPluginConfig, scope: object = config): AgentWalletCapabilities {
    return state(config, scope).capabilities;
}
export function createAgentFetch(config: AgentPluginConfig, scope: object = config): X402Client["fetch"] {
    return state(config, scope).capabilities.fetch;
}
export interface AgentRuntime {
    agentWalletConfig?: AgentPluginConfig;
    agentWallet?: AgentWalletCapabilities;
    x402Fetch?: X402Client["fetch"];
}
export const AgentWalletPlugin = {
    name: "@elizaos/plugin-agentwallet",
    description: "Owner-controlled guarded agent vault capabilities; gas signer stays with the host",
    actions: [],
    providers: [{ name: "agentWallet", description: "Provides scoped guarded payment capability without exporting credentials", async get(runtime: AgentRuntime): Promise<string> {
                if (!runtime.agentWalletConfig) {
                    return "AgentWallet not configured: host must supply agentWalletConfig with a guarded wallet and explicit payment policy.";
                }
                await verifyOperator(runtime.agentWalletConfig.wallet);
                const capabilities = getAgentWallet(runtime.agentWalletConfig, runtime);
                runtime.agentWallet = capabilities;
                runtime.x402Fetch = capabilities.fetch;
                return `Guarded AgentWallet ready on chain ${capabilities.chainId}. Payments follow the host policy and owner vault limits.`;
            } }],
    evaluators: [],
};
export default AgentWalletPlugin;
