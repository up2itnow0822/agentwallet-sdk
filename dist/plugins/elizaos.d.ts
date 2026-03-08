/// <reference types="node" resolution-mode="require"/>
/**
 * Get or create the agent wallet singleton.
 */
export declare function getAgentWallet(config: any): any;
/**
 * Create an x402-enabled fetch function for the agent to pay APIs automatically.
 */
export declare function createAgentFetch(config: any): (input: any, init: any) => Promise<Response>;
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
declare const AgentWalletPlugin: {
    name: string;
    description: string;
    actions: never[];
    providers: {
        name: string;
        description: string;
        get(runtime: any): Promise<string>;
    }[];
    evaluators: never[];
};
export default AgentWalletPlugin;
export { AgentWalletPlugin };
//# sourceMappingURL=elizaos.d.ts.map