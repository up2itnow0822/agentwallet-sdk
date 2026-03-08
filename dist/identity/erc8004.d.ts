export declare const ERC8004IdentityRegistryAbi: ({
    name: string;
    type: string;
    stateMutability: string;
    inputs: ({
        name: string;
        type: string;
        components?: undefined;
    } | {
        name: string;
        type: string;
        components: {
            name: string;
            type: string;
        }[];
    })[];
    outputs: {
        name: string;
        type: string;
    }[];
} | {
    name: string;
    type: string;
    inputs: {
        name: string;
        type: string;
        indexed: boolean;
    }[];
    stateMutability?: undefined;
    outputs?: undefined;
})[];
export declare const METADATA_KEYS: {
    AGENT_WALLET: string;
    MODEL: string;
    MODEL_PROVIDER: string;
    VERSION: string;
    CAPABILITIES: string;
    FRAMEWORK: string;
};
export declare const REGISTRATION_FILE_TYPE = "https://eips.ethereum.org/EIPS/eip-8004#registration-v1";
export declare const KNOWN_REGISTRY_ADDRESSES: {
    'base-sepolia': string;
};
export declare class ERC8004Client {
    constructor(config: any);
    getReadContract(): {
        [x: string]: any;
        address: any;
        abi: ({
            name: string;
            type: string;
            stateMutability: string;
            inputs: ({
                name: string;
                type: string;
                components?: undefined;
            } | {
                name: string;
                type: string;
                components: {
                    name: string;
                    type: string;
                }[];
            })[];
            outputs: {
                name: string;
                type: string;
            }[];
        } | {
            name: string;
            type: string;
            inputs: {
                name: string;
                type: string;
                indexed: boolean;
            }[];
            stateMutability?: undefined;
            outputs?: undefined;
        })[];
    };
    getWriteContract(walletClient: any): {
        [x: string]: any;
        address: any;
        abi: ({
            name: string;
            type: string;
            stateMutability: string;
            inputs: ({
                name: string;
                type: string;
                components?: undefined;
            } | {
                name: string;
                type: string;
                components: {
                    name: string;
                    type: string;
                }[];
            })[];
            outputs: {
                name: string;
                type: string;
            }[];
        } | {
            name: string;
            type: string;
            inputs: {
                name: string;
                type: string;
                indexed: boolean;
            }[];
            stateMutability?: undefined;
            outputs?: undefined;
        })[];
    };
    registerAgent(walletClient: any, metadata: any, agentURI: any, onChainMetadata: any): Promise<{
        txHash: any;
        agentId: bigint | null;
    }>;
    lookupAgentIdentity(agentId: any): Promise<{
        agentId: any;
        owner: any;
        agentURI: any;
        agentWallet: any;
        registrationFile: any;
        modelMetadata: {} | null;
    }>;
    lookupAgentByOwner(ownerAddress: any, fromBlock?: bigint): Promise<{
        agentId: any;
        owner: any;
        agentURI: any;
        agentWallet: any;
        registrationFile: any;
        modelMetadata: {} | null;
    } | null>;
    updateAgentURI(walletClient: any, agentId: any, newURI: any): Promise<any>;
    getOnChainMetadata(agentId: any, key: any): Promise<any>;
    setOnChainMetadata(walletClient: any, agentId: any, key: any, value: any): Promise<any>;
    setModelMetadata(walletClient: any, agentId: any, model: any): Promise<any[]>;
    readModelMetadata(agentId: any): Promise<{} | null>;
    getAgentWallet(agentId: any): Promise<any>;
    setAgentWallet(walletClient: any, agentId: any, newWallet: any, deadline: any, signature: any): Promise<any>;
    unsetAgentWallet(walletClient: any, agentId: any): Promise<any>;
}
export declare function buildDataURI(registrationFile: any): string;
export declare function parseDataURI(uri: any): any;
export declare function resolveAgentURI(uri: any): Promise<any>;
export declare function validateRegistrationFile(file: any): string[];
export declare function formatAgentRegistry(chainId: any, registryAddress: any): string;
//# sourceMappingURL=erc8004.d.ts.map