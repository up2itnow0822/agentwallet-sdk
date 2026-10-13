/**
 * ERC-8004: Trustless Agents — Identity Registry Integration
 *
 * Implements the Identity Registry component of ERC-8004, which provides every
 * AI agent with a portable, censorship-resistant on-chain identifier using ERC-721
 * with URIStorage extension.
 *
 * Spec: https://eips.ethereum.org/EIPS/eip-8004
 * Draft interface checked 2026-10-12; deployment configuration is always explicit.
 * Key Principle: Non-custodial. All signing happens locally via WalletClient.
 */
import { createPublicClient, getContract, http, decodeEventLog, isAddress, zeroAddress, type Address, type Hex, type WalletClient, type PublicClient, type Chain } from 'viem';
import { fetchPublicHttpsJson } from './safe-fetch.js';
import { base, baseSepolia, mainnet, arbitrum, polygon } from 'viem/chains';
// ─── ABI ─────────────────────────────────────────────────────────────────────
export const ERC8004IdentityRegistryAbi = [
    {
        name: 'register', type: 'function', stateMutability: 'nonpayable',
        inputs: [{ name: 'agentURI', type: 'string' }],
        outputs: [{ name: 'agentId', type: 'uint256' }],
    },
    {
        name: 'register', type: 'function', stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentURI', type: 'string' },
            { name: 'metadata', type: 'tuple[]', components: [
                    { name: 'metadataKey', type: 'string' },
                    { name: 'metadataValue', type: 'bytes' },
                ] },
        ],
        outputs: [{ name: 'agentId', type: 'uint256' }],
    },
    {
        name: 'register', type: 'function', stateMutability: 'nonpayable',
        inputs: [], outputs: [{ name: 'agentId', type: 'uint256' }],
    },
    {
        name: 'setAgentURI', type: 'function', stateMutability: 'nonpayable',
        inputs: [{ name: 'agentId', type: 'uint256' }, { name: 'newURI', type: 'string' }],
        outputs: [],
    },
    {
        name: 'tokenURI', type: 'function', stateMutability: 'view',
        inputs: [{ name: 'agentId', type: 'uint256' }],
        outputs: [{ name: '', type: 'string' }],
    },
    {
        name: 'getMetadata', type: 'function', stateMutability: 'view',
        inputs: [{ name: 'agentId', type: 'uint256' }, { name: 'metadataKey', type: 'string' }],
        outputs: [{ name: '', type: 'bytes' }],
    },
    {
        name: 'setMetadata', type: 'function', stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentId', type: 'uint256' },
            { name: 'metadataKey', type: 'string' },
            { name: 'metadataValue', type: 'bytes' },
        ],
        outputs: [],
    },
    {
        name: 'getAgentWallet', type: 'function', stateMutability: 'view',
        inputs: [{ name: 'agentId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }],
    },
    {
        name: 'setAgentWallet', type: 'function', stateMutability: 'nonpayable',
        inputs: [
            { name: 'agentId', type: 'uint256' }, { name: 'newWallet', type: 'address' },
            { name: 'deadline', type: 'uint256' }, { name: 'signature', type: 'bytes' },
        ],
        outputs: [],
    },
    {
        name: 'unsetAgentWallet', type: 'function', stateMutability: 'nonpayable',
        inputs: [{ name: 'agentId', type: 'uint256' }], outputs: [],
    },
    {
        name: 'ownerOf', type: 'function', stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }],
    },
    {
        name: 'Registered', type: 'event', inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'agentURI', type: 'string', indexed: false },
            { name: 'owner', type: 'address', indexed: true },
        ],
    },
    {
        name: 'URIUpdated', type: 'event', inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'newURI', type: 'string', indexed: false },
            { name: 'updatedBy', type: 'address', indexed: true },
        ],
    },
    {
        name: 'MetadataSet', type: 'event', inputs: [
            { name: 'agentId', type: 'uint256', indexed: true },
            { name: 'indexedMetadataKey', type: 'string', indexed: true },
            { name: 'metadataKey', type: 'string', indexed: false },
            { name: 'metadataValue', type: 'bytes', indexed: false },
        ],
    },
] as const;
// ─── Constants ───────────────────────────────────────────────────────────────
export const METADATA_KEYS = {
    AGENT_WALLET: 'agentWallet',
    MODEL: 'agentModel',
    MODEL_PROVIDER: 'agentModelProvider',
    VERSION: 'agentVersion',
    CAPABILITIES: 'agentCapabilities',
    FRAMEWORK: 'agentFramework',
};
export const REGISTRATION_FILE_TYPE = 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';
export const KNOWN_REGISTRY_ADDRESSES: Readonly<Partial<Record<keyof typeof CHAINS, Address>>> = Object.freeze({});
const CHAINS = {
    base, 'base-sepolia': baseSepolia, ethereum: mainnet, arbitrum, polygon,
};
export interface ERC8004Config { chain: keyof typeof CHAINS; registryAddress: Address; rpcUrl: string }
export interface AgentRegistrationFile { type?: string; name: string; description: string; image?: string; services?: {name:string;endpoint:string;version?:string}[]; registrations?: {agentId:number;agentRegistry:string}[]; [key:string]: unknown }
export interface ModelMetadata { model?: string; provider?: string; version?: string; framework?: string; capabilities?: string[] }
// ─── Client ──────────────────────────────────────────────────────────────────
export class ERC8004Client {
    readonly chain: Chain;
    readonly publicClient: PublicClient;
    constructor(readonly config: ERC8004Config) {
        if (!isAddress(config.registryAddress) || config.registryAddress.toLowerCase() === zeroAddress) throw new Error('Provide an explicit nonzero ERC-8004 registry deployment');
        if (!config.rpcUrl) throw new Error('Provide a trusted RPC URL');
        const chain = CHAINS[config.chain];
        if (!chain)
            throw new Error(`ERC8004Client: Unsupported chain "${config.chain}"`);
        this.chain = chain;
        this.publicClient = createPublicClient({ chain: chain as Chain, transport: http(config.rpcUrl) }) as PublicClient;
    }
    getReadContract() {
        return getContract({
            address: this.config.registryAddress,
            abi: ERC8004IdentityRegistryAbi,
            client: this.publicClient,
        });
    }
    getWriteContract(walletClient: WalletClient) {
        return getContract({
            address: this.config.registryAddress,
            abi: ERC8004IdentityRegistryAbi,
            client: { public: this.publicClient, wallet: walletClient },
        });
    }
    async registerAgent(walletClient: WalletClient, metadata: AgentRegistrationFile, agentURI?: string, onChainMetadata?: Record<string,string>) {
        if (!walletClient.account)
            throw new Error('ERC8004Client: WalletClient has no account');
        const registrationFile = { type: REGISTRATION_FILE_TYPE, ...metadata };
        const resolvedURI = agentURI ?? buildDataURI(registrationFile);
        const contract = this.getWriteContract(walletClient);
        let txHash;
        if (onChainMetadata && Object.keys(onChainMetadata).length > 0) {
            const entries = encodeMetadataEntries(onChainMetadata);
            txHash = await contract.write.register([resolvedURI, entries], {
                account: walletClient.account, chain: this.chain,
            });
        }
        else {
            txHash = await contract.write.register([resolvedURI], {
                account: walletClient.account, chain: this.chain,
            });
        }
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status !== 'success') throw new Error('ERC-8004 registration reverted');
        let agentId: bigint | undefined;
        for (const log of receipt.logs) {
            if (log.address.toLowerCase() !== this.config.registryAddress.toLowerCase()) continue;
            try {
                const event = decodeEventLog({abi: ERC8004IdentityRegistryAbi, eventName:'Registered', data:log.data, topics:log.topics});
                if (event.args.owner.toLowerCase() === walletClient.account.address.toLowerCase()) agentId = event.args.agentId;
            } catch { /* Other registry events */ }
        }
        if (agentId === undefined) throw new Error('Confirmed registration lacks matching Registered event');
        return {txHash,agentId,receipt};
    }
    async lookupAgentIdentity(agentId: bigint) {
        const contract = this.getReadContract();
        const [owner, agentURI, agentWallet] = await Promise.all([
            contract.read.ownerOf([agentId]),
            contract.read.tokenURI([agentId]),
            contract.read.getAgentWallet([agentId]),
        ]);
        let registrationFile: AgentRegistrationFile | null = null;
        try {
            registrationFile = await resolveAgentURI(agentURI);
        }
        catch { /* unavailable */ }
        const modelMetadata = await this.readModelMetadata(agentId);
        return {
            agentId, owner: owner, agentURI: agentURI,
            agentWallet: agentWallet, registrationFile, modelMetadata,
        };
    }
    async lookupAgentByOwner(ownerAddress: Address, fromBlock = 0n) {
        const logs = await this.publicClient.getLogs({
            address: this.config.registryAddress,
            event: {
                type: 'event', name: 'Registered',
                inputs: [
                    { name: 'agentId', type: 'uint256', indexed: true },
                    { name: 'agentURI', type: 'string', indexed: false },
                    { name: 'owner', type: 'address', indexed: true },
                ],
            },
            args: { owner: ownerAddress },
            fromBlock, toBlock: 'latest',
        });
        if (logs.length === 0)
            return null;
        const latestLog = logs[logs.length - 1];
        const agentId = BigInt(latestLog.args?.agentId ?? 0);
        return this.lookupAgentIdentity(agentId);
    }
    async updateAgentURI(walletClient: WalletClient, agentId: bigint, newURI: string) {
        if (!walletClient.account)
            throw new Error('ERC8004Client: WalletClient has no account');
        const contract = this.getWriteContract(walletClient);
        return contract.write.setAgentURI([agentId, newURI], {
            account: walletClient.account, chain: this.chain,
        });
    }
    async getOnChainMetadata(agentId: bigint, key: string) {
        const contract = this.getReadContract();
        const value = await contract.read.getMetadata([agentId, key]);
        return value === '0x' || value === null ? null : value;
    }
    async setOnChainMetadata(walletClient: WalletClient, agentId: bigint, key: string, value: string) {
        if (!walletClient.account)
            throw new Error('ERC8004Client: WalletClient has no account');
        if (key === METADATA_KEYS.AGENT_WALLET) {
            throw new Error('ERC8004Client: "agentWallet" is reserved — use setAgentWallet() instead');
        }
        const contract = this.getWriteContract(walletClient);
        const hexValue = stringToHex(value);
        return contract.write.setMetadata([agentId, key, hexValue], {
            account: walletClient.account, chain: this.chain,
        });
    }
    async setModelMetadata(walletClient: WalletClient, agentId: bigint, model: ModelMetadata) {
        const hashes = [];
        const entries: [string,string][] = [];
        if (model.model)
            entries.push([METADATA_KEYS.MODEL, model.model]);
        if (model.provider)
            entries.push([METADATA_KEYS.MODEL_PROVIDER, model.provider]);
        if (model.version)
            entries.push([METADATA_KEYS.VERSION, model.version]);
        if (model.framework)
            entries.push([METADATA_KEYS.FRAMEWORK, model.framework]);
        if (model.capabilities?.length)
            entries.push([METADATA_KEYS.CAPABILITIES, JSON.stringify(model.capabilities)]);
        for (const [key, val] of entries) {
            const hash = await this.setOnChainMetadata(walletClient, agentId, key, val);
            hashes.push(hash);
        }
        return hashes;
    }
    async readModelMetadata(agentId: bigint) {
        const keys = [METADATA_KEYS.MODEL, METADATA_KEYS.MODEL_PROVIDER, METADATA_KEYS.VERSION, METADATA_KEYS.FRAMEWORK, METADATA_KEYS.CAPABILITIES];
        const values = await Promise.all(keys.map((k) => this.getOnChainMetadata(agentId, k)));
        const [modelHex, providerHex, versionHex, frameworkHex, capabilitiesHex] = values;
        if (!modelHex && !providerHex && !versionHex && !frameworkHex && !capabilitiesHex)
            return null;
        const result: ModelMetadata = {};
        if (modelHex)
            result.model = hexToString(modelHex);
        if (providerHex)
            result.provider = hexToString(providerHex);
        if (versionHex)
            result.version = hexToString(versionHex);
        if (frameworkHex)
            result.framework = hexToString(frameworkHex);
        if (capabilitiesHex) {
            const parsed: unknown = JSON.parse(hexToString(capabilitiesHex));
            if (!Array.isArray(parsed) || parsed.some(value => typeof value !== 'string')) throw new Error('On-chain capabilities must be a JSON string array');
            result.capabilities = parsed as string[];
        }
        return result;
    }
    async getAgentWallet(agentId: bigint) {
        const contract = this.getReadContract();
        return contract.read.getAgentWallet([agentId]);
    }
    async setAgentWallet(walletClient: WalletClient, agentId: bigint, newWallet: Address, deadline: bigint, signature: Hex) {
        if (!walletClient.account)
            throw new Error('ERC8004Client: WalletClient has no account');
        const contract = this.getWriteContract(walletClient);
        return contract.write.setAgentWallet([agentId, newWallet, deadline, signature], {
            account: walletClient.account, chain: this.chain,
        });
    }
    async unsetAgentWallet(walletClient: WalletClient, agentId: bigint) {
        if (!walletClient.account)
            throw new Error('ERC8004Client: WalletClient has no account');
        const contract = this.getWriteContract(walletClient);
        return contract.write.unsetAgentWallet([agentId], {
            account: walletClient.account, chain: this.chain,
        });
    }
}
// ─── Standalone helpers ───────────────────────────────────────────────────────
export function buildDataURI(registrationFile: AgentRegistrationFile): string {
    const json = JSON.stringify({...registrationFile,type:REGISTRATION_FILE_TYPE});
    if (Buffer.byteLength(json) > 1_048_576) throw new Error('Registration exceeds byte limit');
    return 'data:application/json;base64,'+Buffer.from(json).toString('base64');
}
export function parseDataURI(uri: string): AgentRegistrationFile {
    const prefix = 'data:application/json;base64,';
    if (!uri.startsWith(prefix)) throw new Error('Only JSON base64 data URIs supported');
    const payload = uri.slice(prefix.length);
    if (payload.length > 1_398_104 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(payload)) throw new Error('Invalid or oversized registration');
    const decoded = Buffer.from(payload,'base64');
    if (decoded.length > 1_048_576) throw new Error('Registration exceeds byte limit');
    return checkedRegistration(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(decoded)) as unknown);
}
export async function resolveAgentURI(uri: string): Promise<AgentRegistrationFile> {
    if (uri.startsWith('data:')) return parseDataURI(uri);
    return checkedRegistration(await fetchPublicHttpsJson(uri));
}
function checkedRegistration(file: unknown): AgentRegistrationFile {
    const errors = validateRegistrationFile(file);
    if (errors.length) throw new Error('Invalid registration: '+errors.join('; '));
    return file as AgentRegistrationFile;
}
export function validateRegistrationFile(file: unknown): string[] {
    if (!file || typeof file !== 'object' || Array.isArray(file)) return ['registration must be an object'];
    const value = file as Record<string,unknown>, errors: string[] = [];
    if (value.type !== REGISTRATION_FILE_TYPE) errors.push('invalid registration type');
    if (typeof value.name !== 'string' || !value.name.trim()) errors.push('name is required');
    if (typeof value.description !== 'string') errors.push('description is required');
    for (const key of ['services','registrations']) {
        if (value[key] === undefined) continue;
        const items = value[key];
        if (!Array.isArray(items)) { errors.push(key+' must be an array'); continue; }
        for (const item of items) {
            if (!item || typeof item !== 'object') { errors.push('invalid '+key+' item'); continue; }
            if (key === 'services' && (typeof item.name !== 'string' || typeof item.endpoint !== 'string')) errors.push('invalid service');
            if (key === 'registrations' && (!Number.isSafeInteger(item.agentId) || item.agentId < 0 || typeof item.agentRegistry !== 'string')) errors.push('invalid registry');
        }
    }
    return errors;
}
export function formatAgentRegistry(chainId: number, registryAddress: Address) {
    return `eip155:${chainId}:${registryAddress}`;
}
// ─── Internal utilities ───────────────────────────────────────────────────────
function stringToHex(str: string): Hex {
    const bytes = new TextEncoder().encode(str);
    const hexStr = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    return ('0x' + hexStr) as Hex;
}
function hexToString(hex: Hex): string {
    const stripped = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array((stripped.match(/.{1,2}/g) ?? []).map((byte) => parseInt(byte, 16)));
    return new TextDecoder('utf-8').decode(bytes);
}
function encodeMetadataEntries(entries: Record<string,string>) {
    if ('agentWallet' in entries) throw new Error('agentWallet metadata is reserved');
    return Object.entries(entries).map(([key, value]) => ({
        metadataKey: key,
        metadataValue: stringToHex(value),
    }));
}
