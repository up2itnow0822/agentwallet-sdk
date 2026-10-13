import { describe, it, expect, vi, beforeEach } from "vitest";
import { base, mainnet } from "viem/chains";
import { encodePacked, encodeEventTopics, encodeAbiParameters, encodeFunctionData, pad, zeroAddress } from "viem";
import type { Hex } from "viem";
import type { BridgeRecord, BridgeStore } from "../bridge/types.js";
import { BridgeModule, FileBridgeStore, TOKEN_MESSENGER_V2, MESSAGE_TRANSMITTER_V2, USDC_CONTRACT, MessageSentEventAbi, MessageTransmitterV2Abi } from "../bridge/index.js";
import { validateMessage, messageNonce } from "../bridge/message.js";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const { execute, safeFetch } = vi.hoisted(() => ({ execute: vi.fn(), safeFetch: vi.fn() }));
vi.mock("../wallet/execution.js", () => ({ executeVaultOperation: execute }));
vi.mock("../identity/safe-fetch.js", () => ({ fetchPublicHttpsJson: safeFetch }));
const vault = "0x1111111111111111111111111111111111111111", recipient = "0x3333333333333333333333333333333333333333";
const burnHash = `0x${"12".repeat(32)}` as Hex, mintHash = `0x${"34".repeat(32)}` as Hex, nonce = `0x${"ab".repeat(32)}` as Hex, signature = `0x${"56".repeat(65)}` as Hex;
function message(attested = false, to = 0, receiver: Hex = pad(recipient, { size: 32 })): Hex {
    return encodePacked(["uint32", "uint32", "uint32", "bytes32", "bytes32", "bytes32", "bytes32", "uint32", "uint32", "uint32", "bytes32", "bytes32", "uint256", "bytes32", "uint256", "uint256", "uint256"], [1, 6, to, attested ? nonce : pad("0x00", { size: 32 }), pad(TOKEN_MESSENGER_V2.base, { size: 32 }), pad(TOKEN_MESSENGER_V2.ethereum, { size: 32 }), pad(zeroAddress, { size: 32 }), 2000, attested ? 2000 : 0, 1, pad(USDC_CONTRACT.base, { size: 32 }), receiver, 100n, pad(vault, { size: 32 }), 0n, 0n, 0n]).toLowerCase() as Hex;
}
function memoryStore() {
    const records = new Map<string, BridgeRecord>();
    const store: BridgeStore = { save: vi.fn(async (r) => {
            records.set(r.id, { ...r });
        }), load: vi.fn(async (id) => records.get(id)), withLock: async (_id, run) => run() };
    return { store, records };
}
function fixture() {
    const { store, records } = memoryStore();
    let nonceConsumed = false;
    const source = { address: vault, chain: base, contract: {}, confirmations: 1, expectedCodeHash: `0x${"ab".repeat(32)}`, publicClient: { getChainId: vi.fn().mockResolvedValue(8453), readContract: vi.fn().mockImplementation(({ functionName }: {
                functionName: string;
            }) => functionName === "tokenMessenger" ? TOKEN_MESSENGER_V2.base : 6), waitForTransactionReceipt: vi.fn() }, walletClient: { chain: base, account: { address: "0x2222222222222222222222222222222222222222" }, writeContract: vi.fn() } };
    const destination = { publicClient: { chain: mainnet, getChainId: vi.fn().mockResolvedValue(1), getTransaction: vi.fn(), getBytecode: vi.fn().mockResolvedValue("0xab"), getBalance: vi.fn().mockResolvedValue(1n), readContract: vi.fn().mockImplementation(({ functionName }: {
                functionName: string;
            }) => functionName === "localDomain" ? 0 : nonceConsumed ? 1n : 0n), simulateContract: vi.fn().mockResolvedValue({ result: true, request: { address: MESSAGE_TRANSMITTER_V2.ethereum, abi: [], functionName: "receiveMessage" } }), waitForTransactionReceipt: vi.fn().mockImplementation(async () => {nonceConsumed=true;return{status:'success',transactionHash:mintHash};}) }, walletClient: { chain: mainnet, account: { address: "0x2222222222222222222222222222222222222222" }, getChainId: vi.fn().mockResolvedValue(1), writeContract: vi.fn().mockResolvedValue(mintHash) } };
    const receipt = { status: "success", transactionHash:burnHash, logs: [{ address: MESSAGE_TRANSMITTER_V2.base as Hex, topics: encodeEventTopics({ abi: MessageSentEventAbi, eventName: "MessageSent" }), data: encodeAbiParameters([{ type: "bytes" }], [message()]) }] };
    execute.mockImplementation(async (_wallet, _name, _args, options) => {
        await options.onSubmitted(burnHash);
        return { txHash: burnHash, receipt };
    });
    safeFetch.mockResolvedValue({ sourceTxHash: burnHash, messages: [{ status: "complete", cctpVersion: 2, message: message(true), attestation: signature }] });
    const module = new BridgeModule(source as never, { destinations: { ethereum: destination }, store, maxAttestationPolls: 1 } as never);
    return { source, destination, store, records, module, receipt };
}
beforeEach(() => {
    vi.clearAllMocks();
});
describe("CCTP recoverable source burn and destination mint", () => {
    it.each(['mint', 'resume', 'recover'] as const)('keeps %s unresolved for a successful replacement receipt', async (path) => {
        const f = fixture(), record = await f.module.burn(100n, 'ethereum', {destinationAddress:recipient});
        if (path !== 'mint') {
            f.destination.publicClient.waitForTransactionReceipt.mockRejectedValueOnce(new Error('RPC timeout'));
            await expect(f.module.resume(record.id)).rejects.toMatchObject({txHash:mintHash});
        }
        f.destination.publicClient.waitForTransactionReceipt.mockResolvedValue({status:'success',transactionHash:`0x${'99'.repeat(32)}`});
        const attempt = path === 'mint' ? f.module.mint(record.id, {message:message(true),attestation:signature}) : path === 'resume' ? f.module.resume(record.id) : f.module.recoverMint(record.id);
        await expect(attempt).rejects.toMatchObject({recoveryId:record.id,txHash:mintHash});
        expect(f.records.get(record.id)?.status).toBe('mint-submitted');
        expect(f.destination.walletClient.writeContract).toHaveBeenCalledTimes(1);
    });
    it.each(['mint', 'resume', 'recover'] as const)('keeps %s unresolved when a matching successful receipt did not consume the nonce', async (path) => {
        const f = fixture(), record = await f.module.burn(100n, 'ethereum', {destinationAddress:recipient});
        if (path !== 'mint') {
            f.destination.publicClient.waitForTransactionReceipt.mockRejectedValueOnce(new Error('RPC timeout'));
            await expect(f.module.resume(record.id)).rejects.toMatchObject({txHash:mintHash});
        }
        f.destination.publicClient.waitForTransactionReceipt.mockResolvedValue({status:'success',transactionHash:mintHash});
        f.destination.publicClient.readContract.mockImplementation(({functionName}:{functionName:string})=>functionName==='localDomain'?0:0n);
        const attempt = path === 'mint' ? f.module.mint(record.id, {message:message(true),attestation:signature}) : path === 'resume' ? f.module.resume(record.id) : f.module.recoverMint(record.id);
        await expect(attempt).rejects.toMatchObject({recoveryId:record.id,txHash:mintHash});
        expect(f.records.get(record.id)?.status).toBe('mint-submitted');
        expect(f.destination.walletClient.writeContract).toHaveBeenCalledTimes(1);
    });
    it('does not reset the submitted mint for a reverted receipt belonging to another transaction', async () => {
        const f = fixture(), record = await f.module.burn(100n, 'ethereum', {destinationAddress:recipient});
        f.destination.publicClient.waitForTransactionReceipt.mockRejectedValueOnce(new Error('RPC timeout'));
        await expect(f.module.resume(record.id)).rejects.toMatchObject({txHash:mintHash});
        f.destination.publicClient.waitForTransactionReceipt.mockResolvedValue({status:'reverted',transactionHash:`0x${'99'.repeat(32)}`});
        await expect(f.module.recoverMint(record.id)).rejects.toMatchObject({recoveryId:record.id,txHash:mintHash});
        expect(f.records.get(record.id)?.status).toBe('mint-submitted');
    });
    it('retains the submitted source state for a replacement burn receipt even with copied source logs', async () => {
        const f = fixture();
        execute.mockImplementationOnce(async (_w,_n,_a,options)=>{await options.onSubmitted(burnHash);throw new Error('RPC timeout');});
        await expect(f.module.burn(100n,'ethereum',{destinationAddress:recipient})).rejects.toMatchObject({txHash:burnHash});
        const record=[...f.records.values()][0]!;
        f.source.publicClient.waitForTransactionReceipt.mockResolvedValue({...f.receipt,transactionHash:mintHash});
        await expect(f.module.recoverBurn(record.id)).rejects.toMatchObject({recoveryId:record.id,txHash:burnHash});
        expect(f.records.get(record.id)?.status).toBe('burn-submitted');
    });
    it.each([
        ['recover', 'success'], ['recover', 'reverted'],
        ['resume', 'success'], ['resume', 'reverted'],
    ] as const)('reconciles %s/%s without funding an already-submitted mint again', async (path, status) => {
        const f = fixture(), record = await f.module.burn(100n, 'ethereum', {destinationAddress:recipient});
        f.destination.publicClient.waitForTransactionReceipt.mockRejectedValueOnce(new Error('RPC timeout'));
        await expect(f.module.resume(record.id)).rejects.toMatchObject({txHash:mintHash});
        const fundingChecks = f.destination.publicClient.getBalance.mock.calls.length;
        f.destination.publicClient.getBalance.mockResolvedValue(0n);
        if (status === 'reverted') f.destination.publicClient.waitForTransactionReceipt.mockResolvedValue({status,transactionHash:mintHash});
        const attempt = path === 'recover' ? f.module.recoverMint(record.id) : f.module.resume(record.id);
        if (status === 'reverted' && path === 'resume') {
            await expect(attempt).rejects.toMatchObject({recoveryId:record.id,txHash:mintHash});
            expect(f.records.get(record.id)?.status).toBe('mint-submitted');
        } else {
            await expect(attempt).resolves.toMatchObject({status:status==='success'?'minted':'attested'});
        }
        expect(f.destination.publicClient.getBalance).toHaveBeenCalledTimes(fundingChecks);
        expect(f.destination.walletClient.writeContract).toHaveBeenCalledTimes(1);
    });
    it('revalidates previously marked terminal mints instead of trusting a false persisted completion', async () => {
        const f = fixture(), record = await f.module.burn(100n, 'ethereum', {destinationAddress:recipient});
        f.destination.publicClient.waitForTransactionReceipt.mockRejectedValueOnce(new Error('RPC timeout'));
        await expect(f.module.resume(record.id)).rejects.toMatchObject({txHash:mintHash});
        f.records.set(record.id,{...f.records.get(record.id)!,status:'minted'});
        f.destination.publicClient.waitForTransactionReceipt.mockResolvedValue({status:'success',transactionHash:mintHash});
        await expect(f.module.resume(record.id)).rejects.toMatchObject({recoveryId:record.id,txHash:mintHash});
        expect(f.destination.walletClient.writeContract).toHaveBeenCalledTimes(1);
    });
    it("commits source burn before polling, queries transaction hash, and mints the modified attested message with a destination client", async () => {
        const f = fixture();
        safeFetch.mockImplementation(async (url) => {
            expect([...f.records.values()][0]!.status).toBe("burned");
            expect(url).toBe(`https://iris-api.circle.com/v2/messages/6?transactionHash=${burnHash}`);
            return { sourceTxHash: burnHash, messages: [{ status: "complete", cctpVersion: 2, message: message(true), attestation: signature }] };
        });
        const result = await f.module.bridge(100n, "ethereum", { destinationAddress: recipient });
        expect(result.status).toBe("minted");
        expect(result.nonce).toBe(nonce);
        expect(messageNonce(message(true))).toBe(nonce);
        expect(f.destination.publicClient.simulateContract).toHaveBeenCalledWith(expect.objectContaining({ args: [message(true), signature] }));
        expect(f.source.walletClient.writeContract).not.toHaveBeenCalled();
        expect(f.destination.walletClient.writeContract).toHaveBeenCalledTimes(1);
        expect(execute).toHaveBeenCalledWith(f.source, "agentBridge", [USDC_CONTRACT.base, 100n, 0, pad(recipient, { size: 32 }), 0n, 2000], expect.any(Object));
    });
    it("persists a submitted source hash on confirmation failure and resumes without another burn", async () => {
        const f = fixture();
        execute.mockImplementationOnce(async (_w, _n, _a, options) => {
            await options.onSubmitted(burnHash);
            throw new Error("confirmation timeout");
        });
        await expect(f.module.burn(100n, "ethereum", { destinationAddress: recipient })).rejects.toThrow(/reconciliation/);
        const r = [...f.records.values()][0]!;
        expect(r.burnTxHash).toBe(burnHash);
        expect(r.status).toBe("burn-submitted");
        f.source.publicClient.waitForTransactionReceipt.mockResolvedValue(f.receipt);
        await f.module.recoverBurn(r.id);
        await f.module.resume(r.id);
        expect(execute).toHaveBeenCalledTimes(1);
    });
    it.each(["wrong-domain", "wrong-recipient", "malformed", "fake-signature", "replay", "wrong-source-hash"])("rejects %s attestation without a destination write", async (scenario) => {
        const f = fixture();
        const r = await f.module.burn(100n, "ethereum", { destinationAddress: recipient });
        let msg: unknown = message(true);
        if (scenario === "wrong-domain") {
            msg = message(true, 3);
        }
        if (scenario === "wrong-recipient") {
            msg = message(true, 0, pad(vault, { size: 32 }));
        }
        if (scenario === "malformed") {
            msg = "0x01";
        }
        if (scenario === "fake-signature") {
            f.destination.publicClient.simulateContract.mockRejectedValue(new Error("invalid attester signature"));
        }
        if (scenario === "replay") {
            f.destination.publicClient.readContract.mockImplementation(({ functionName }: {
                functionName: string;
            }) => functionName === "localDomain" ? 0 : 1n);
        }
        safeFetch.mockResolvedValue({ sourceTxHash: scenario === "wrong-source-hash" ? mintHash : burnHash, messages: [{ status: "complete", cctpVersion: 2, message: msg, attestation: signature }] });
        await expect(f.module.resume(r.id)).rejects.toThrow();
        expect(f.destination.walletClient.writeContract).not.toHaveBeenCalled();
        expect(f.records.get(r.id)?.burnTxHash).toBe(burnHash);
    });
    it("rejects destination chain mismatch and unfunded gas signer before source burn", async () => {
        const f = fixture();
        f.destination.walletClient.getChainId.mockResolvedValue(8453);
        await expect(f.module.burn(100n, "ethereum", { destinationAddress: recipient })).rejects.toThrow(/chain/);
        expect(execute).not.toHaveBeenCalled();
        f.destination.walletClient.getChainId.mockResolvedValue(1);
        f.destination.publicClient.getBalance.mockResolvedValue(0n);
        await expect(f.module.burn(100n, "ethereum", { destinationAddress: recipient })).rejects.toThrow(/gas/);
        expect(execute).not.toHaveBeenCalled();
    });
    it("never polls or burns when durable intent persistence fails", async () => {
        const f = fixture();
        vi.mocked(f.store.save).mockRejectedValue(new Error("disk full"));
        await expect(f.module.burn(100n, "ethereum", { destinationAddress: recipient })).rejects.toThrow(/disk full/);
        expect(execute).not.toHaveBeenCalled();
        expect(safeFetch).not.toHaveBeenCalled();
    });
    it("rejects source log from a forged emitter", async () => {
        const f = fixture();
        f.receipt.logs[0]!.address = vault;
        await expect(f.module.burn(100n, "ethereum", { destinationAddress: recipient })).rejects.toThrow(/reconciliation/);
        expect([...f.records.values()][0]?.burnTxHash).toBe(burnHash);
    });
    it("preserves uncertain mint hash and reconciles a restart without another mint", async () => {
        const f = fixture();
        f.destination.publicClient.waitForTransactionReceipt.mockRejectedValueOnce(new Error("RPC timeout"));
        const r = await f.module.burn(100n, "ethereum", { destinationAddress: recipient });
        await expect(f.module.resume(r.id)).rejects.toMatchObject({txHash:mintHash,recoveryId:r.id,cause:{message:"RPC timeout"}});
        expect(f.records.get(r.id)?.status).toBe("mint-submitted");
        await f.module.resume(r.id);
        expect(f.destination.walletClient.writeContract).toHaveBeenCalledTimes(1);
        expect(f.records.get(r.id)?.status).toBe("minted");
    });
    it("allows explicit reconciliation of a reverted mint without reburning", async () => {
        const f = fixture();
        f.destination.publicClient.waitForTransactionReceipt.mockResolvedValueOnce({ status: "reverted",transactionHash:mintHash });
        const r = await f.module.burn(100n, "ethereum", { destinationAddress: recipient });
        await expect(f.module.resume(r.id)).rejects.toMatchObject({txHash:mintHash,recoveryId:r.id,cause:{message:expect.stringMatching(/reverted/)}});
        f.destination.publicClient.waitForTransactionReceipt.mockResolvedValueOnce({ status: "reverted",transactionHash:mintHash });
        await f.module.recoverMint(r.id);
        await f.module.resume(r.id);
        expect(execute).toHaveBeenCalledTimes(1);
        expect(f.destination.walletClient.writeContract).toHaveBeenCalledTimes(2);
    });
    it('does not resubmit a mint when broadcast outcome has no returned hash',async()=>{
        const f=fixture(),r=await f.module.burn(100n,'ethereum',{destinationAddress:recipient});
        f.destination.walletClient.writeContract.mockRejectedValueOnce(new Error('broadcast timeout'));
        await expect(f.module.resume(r.id)).rejects.toMatchObject({recoveryId:r.id});
        await expect(f.module.resume(r.id)).rejects.toThrow(/reconcil|unknown/i);
        expect(f.destination.walletClient.writeContract).toHaveBeenCalledTimes(1);
    });
    it('exposes recovery id and mint hash if persistence fails after gas submission', async()=> {
        const f=fixture(); const r=await f.module.burn(100n,'ethereum',{destinationAddress:recipient});
        let failed=false; vi.mocked(f.store.save).mockImplementation(async record=>{if(record.status==='mint-submitted'&&!failed){failed=true;throw new Error('disk full')}f.records.set(record.id,record)});
        await expect(f.module.resume(r.id)).rejects.toMatchObject({recoveryId:r.id,txHash:mintHash});
        f.destination.publicClient.getTransaction.mockResolvedValue({to:MESSAGE_TRANSMITTER_V2.ethereum,input:encodeFunctionData({abi:MessageTransmitterV2Abi,functionName:'receiveMessage',args:[message(true),signature]})});
        const recovered=await f.module.recoverMint(r.id,mintHash);
        expect(recovered.status).toBe('minted'); expect(f.destination.walletClient.writeContract).toHaveBeenCalledTimes(1);
    });
    it("rejects source malformed message and preserves immutable fields", () => {
        const f = fixture();
        const record = { version: 1, id: "1", vault, fromChain: "base", toChain: "ethereum", recipient, amount: "100", maxFee: "0", minFinalityThreshold: 2000, createdAt: 0, status: "burned", sourceMessage: message() } as const;
        expect(() => validateMessage(record, "0x01", false)).toThrow();
        expect(() => validateMessage(record, message(true, 0, pad(vault, { size: 32 })), true)).toThrow();
        expect(validateMessage(record, message(true), true)).toBe(message(true));
    });
    it('rejects corrupted recovery state that falsely claims a completed mint',async()=>{
        const f=fixture(),record=await f.module.burn(100n,'ethereum',{destinationAddress:recipient});
        f.records.set(record.id,{...record,status:'minted'});
        await expect(f.module.resume(record.id)).rejects.toThrow(/recovery|incomplete/i);
        expect(f.destination.walletClient.writeContract).not.toHaveBeenCalled();
    });
    it("durably survives a new store instance and serializes competing recovery", async () => {
        const dir = await mkdtemp(join(tmpdir(), "agentbridge-"));
        try {
            const f = fixture();
            const record = await f.module.burn(100n, "ethereum", { destinationAddress: recipient });
            const a = new FileBridgeStore(dir), b = new FileBridgeStore(dir);
            await a.save(record);
            expect(await b.load(record.id)).toEqual(record);
            let release!: () => void;
            const held = a.withLock(record.id, async () => new Promise<void>(r => {
                release = r;
            }));
            while (!release)
                await new Promise(r => setImmediate(r));
            await expect(b.withLock(record.id, async () => undefined)).rejects.toThrow(/locked/);
            release();
            await held;
        }
        finally {
            await rm(dir, { recursive: true, force: true });
        }
    });
});

describe('recovery record schema validation', () => {
    it.each(['amount-number', 'fee-number', 'timestamp', 'unexpected-field'])('rejects malformed %s stored fields before polling', async (scenario) => {
        const f = fixture(), record = await f.module.burn(100n, 'ethereum', {destinationAddress: recipient});
        const altered: Record<string, unknown> = {...record};
        if (scenario === 'amount-number') altered.amount = 100;
        if (scenario === 'fee-number') altered.maxFee = 0;
        if (scenario === 'timestamp') altered.createdAt = Number.NaN;
        if (scenario === 'unexpected-field') altered.attestationApiUrl = 'https://example.com';
        f.records.set(record.id, altered as unknown as BridgeRecord);
        await expect(f.module.resume(record.id)).rejects.toThrow(/record|recovery/i);
        expect(safeFetch).not.toHaveBeenCalled();
        expect(f.destination.walletClient.writeContract).not.toHaveBeenCalled();
    });
});
