import { beforeEach, describe, expect, it, vi } from "vitest";
import { base, baseSepolia, sepolia, arbitrumSepolia, optimismSepolia } from "viem/chains";
import { encodePacked, encodeEventTopics, encodeAbiParameters, pad, zeroAddress } from "viem";
import type { Address, Chain, Hex } from "viem";
import { BridgeModule, BRIDGE_CHAIN_IDS, CCTP_DOMAIN_IDS, MESSAGE_TRANSMITTER_V2, MessageSentEventAbi, TOKEN_MESSENGER_V2, USDC_CONTRACT } from "../bridge/index.js";
import type { BridgeChain, BridgeRecord, BridgeStore } from "../bridge/types.js";
const { execute, safeFetch } = vi.hoisted(() => ({ execute: vi.fn(), safeFetch: vi.fn() }));
vi.mock("../wallet/execution.js", () => ({ executeVaultOperation: execute }));
vi.mock("../identity/safe-fetch.js", () => ({ fetchPublicHttpsJson: safeFetch }));
const vault = "0x1111111111111111111111111111111111111111", recipient = "0x3333333333333333333333333333333333333333";
const burnHash = `0x${"12".repeat(32)}` as Hex, mintHash = `0x${"34".repeat(32)}` as Hex, nonce = `0x${"ab".repeat(32)}` as Hex, signature = `0x${"56".repeat(65)}` as Hex;
const messenger = "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA", transmitter = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275";
const networks = [["base-sepolia", baseSepolia, 6, "0x036CbD53842c5426634e7929541eC2318f3dCF7e"], ["ethereum-sepolia", sepolia, 0, "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"], ["arbitrum-sepolia", arbitrumSepolia, 3, "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"], ["optimism-sepolia", optimismSepolia, 2, "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"]] as const;
function message(sourceDomain: number, destinationDomain: number, token: Address, attested = false): Hex {
    return encodePacked(["uint32", "uint32", "uint32", "bytes32", "bytes32", "bytes32", "bytes32", "uint32", "uint32", "uint32", "bytes32", "bytes32", "uint256", "bytes32", "uint256", "uint256", "uint256"], [1, sourceDomain, destinationDomain, attested ? nonce : pad("0x00", { size: 32 }), pad(messenger, { size: 32 }), pad(messenger, { size: 32 }), pad(zeroAddress, { size: 32 }), 2000, attested ? 2000 : 0, 1, pad(token, { size: 32 }), pad(recipient, { size: 32 }), 100n, pad(vault, { size: 32 }), 0n, 0n, 0n]).toLowerCase() as Hex;
}
function fixture(sourceChain: Chain = baseSepolia, sourceDomain = 6, token: Address = networks[0][3], destinationChain: Chain = sepolia, destinationDomain = 0) {
    let nonceConsumed = false;
    const records = new Map<string, BridgeRecord>();
    const store: BridgeStore = { save: vi.fn(async (record) => {
            records.set(record.id, { ...record });
        }), load: vi.fn(async (id) => records.get(id)), withLock: async (_id, run) => run() };
    const source = { address: vault, chain: sourceChain, contract: {}, confirmations: 1, expectedCodeHash: `0x${"ab".repeat(32)}`, publicClient: { getChainId: vi.fn().mockResolvedValue(sourceChain.id), readContract: vi.fn().mockImplementation(({ functionName }: {
                functionName: string;
            }) => functionName === "tokenMessenger" ? messenger : sourceDomain) }, walletClient: { chain: sourceChain, account: { address: "0x2222222222222222222222222222222222222222" }, writeContract: vi.fn() } };
    const destination = { publicClient: { chain: destinationChain, getChainId: vi.fn().mockResolvedValue(destinationChain.id), getBytecode: vi.fn().mockResolvedValue("0xab"), getBalance: vi.fn().mockResolvedValue(1n), readContract: vi.fn().mockImplementation(({ functionName }: {
                functionName: string;
            }) => functionName === "localDomain" ? destinationDomain : nonceConsumed ? 1n : 0n), simulateContract: vi.fn().mockResolvedValue({ result: true, request: { address: transmitter, abi: [], functionName: "receiveMessage" } }), waitForTransactionReceipt: vi.fn().mockImplementation(async()=>{nonceConsumed=true;return{status:'success',transactionHash:mintHash};}) }, walletClient: { chain: destinationChain, account: { address: "0x2222222222222222222222222222222222222222" }, getChainId: vi.fn().mockResolvedValue(destinationChain.id), writeContract: vi.fn().mockResolvedValue(mintHash) } };
    const receipt = { status: "success", transactionHash:burnHash, logs: [{ address: transmitter, topics: encodeEventTopics({ abi: MessageSentEventAbi, eventName: "MessageSent" }), data: encodeAbiParameters([{ type: "bytes" }], [message(sourceDomain, destinationDomain, token)]) }] };
    execute.mockImplementation(async (_wallet, _name, _args, options) => {
        await options.onSubmitted(burnHash);
        return { txHash: burnHash, receipt };
    });
    safeFetch.mockResolvedValue({ sourceTxHash: burnHash, messages: [{ status: "complete", cctpVersion: 2, message: message(sourceDomain, destinationDomain, token, true), attestation: signature }] });
    return { source, destination, store, records };
}
beforeEach(() => vi.clearAllMocks());
describe("explicit CCTP testnet environments", () => {
    it("pins four testnet chain/domain/token/deployment entries to primary Circle addresses", () => {
        for (const [name, chain, domain, token] of networks) {
            expect(BRIDGE_CHAIN_IDS[name as BridgeChain]).toBe(chain.id);
            expect(CCTP_DOMAIN_IDS[name as BridgeChain]).toBe(domain);
            expect(USDC_CONTRACT[name as BridgeChain]?.toLowerCase()).toBe(token.toLowerCase());
            expect(TOKEN_MESSENGER_V2[name as BridgeChain]).toBe(messenger);
            expect(MESSAGE_TRANSMITTER_V2[name as BridgeChain]).toBe(transmitter);
        }
    });
    it("rejects mainnet source to testnet destination before burn or destination RPC", async () => {
        const f = fixture(base);
        const module = new BridgeModule(f.source as never, { store: f.store, destinations: { "ethereum-sepolia": f.destination } } as never);
        await expect(module.burn(100n, "ethereum-sepolia" as BridgeChain, { destinationAddress: recipient })).rejects.toThrow(/environment|mainnet.*testnet/i);
        expect(execute).not.toHaveBeenCalled();
        expect(f.destination.publicClient.getChainId).not.toHaveBeenCalled();
        expect(f.store.save).not.toHaveBeenCalled();
    });
    it.each(networks)("completes a shaped %s testnet burn and dedicated destination mint using only sandbox attestation", async (name, chain, domain, token) => {
        const toName = name === "ethereum-sepolia" ? "base-sepolia" : "ethereum-sepolia", toChain = name === "ethereum-sepolia" ? baseSepolia : sepolia, toDomain = name === "ethereum-sepolia" ? 6 : 0;
        const f = fixture(chain, domain, token, toChain, toDomain);
        const module = new BridgeModule(f.source as never, { store: f.store, destinations: { [toName]: f.destination }, maxAttestationPolls: 1 } as never);
        const record = await module.bridge(100n, toName as BridgeChain, { destinationAddress: recipient });
        expect(record.status).toBe("minted");
        expect(record.fromChain).toBe(name);
        expect(record.toChain).toBe(toName);
        expect(execute).toHaveBeenCalledWith(f.source, "agentBridge", [token, 100n, toDomain, pad(recipient, { size: 32 }), 0n, 2000], expect.any(Object));
        expect(safeFetch).toHaveBeenCalledWith(`https://iris-api-sandbox.circle.com/v2/messages/${domain}?transactionHash=${burnHash}`, expect.objectContaining({ maxRedirects: 0 }));
        expect(f.destination.walletClient.writeContract).toHaveBeenCalledTimes(1);
        expect(f.source.walletClient.writeContract).not.toHaveBeenCalled();
    });
    it("rejects a testnet source to mainnet destination and corrupted mixed-environment recovery", async () => {
        const f = fixture();
        const module = new BridgeModule(f.source as never, { store: f.store, destinations: { "ethereum-sepolia": f.destination, ethereum: f.destination } } as never);
        await expect(module.burn(100n, "ethereum", { destinationAddress: recipient })).rejects.toThrow(/environment|testnet.*mainnet/i);
        expect(execute).not.toHaveBeenCalled();
        const record = await module.burn(100n, "ethereum-sepolia" as BridgeChain, { destinationAddress: recipient });
        f.records.set(record.id, { ...record, toChain: "ethereum" });
        await expect(module.resume(record.id)).rejects.toThrow(/environment|recovery/i);
        expect(safeFetch).not.toHaveBeenCalled();
    });
    it("rejects chain metadata pretending a mainnet chain is a testnet", () => {
        const f = fixture({ ...base, testnet: true });
        expect(() => new BridgeModule(f.source as never, { store: f.store, destinations: {} })).toThrow(/environment|metadata/i);
    });
});
