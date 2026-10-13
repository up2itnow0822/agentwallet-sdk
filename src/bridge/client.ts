import { randomUUID } from "node:crypto";
import { decodeEventLog, encodeFunctionData, isAddress, pad, zeroAddress } from "viem";
import type { Hex, TransactionReceipt } from "viem";
import type { AgentWallet } from "../types.js";
import { executeVaultOperation } from "../wallet/execution.js";
import { fetchPublicHttpsJson } from "../identity/safe-fetch.js";
import { MessageSentEventAbi, MessageTransmitterV2Abi, ERC20BridgeAbi } from "./abis.js";
import { validateMessage, validateAttestation, messageNonce } from "./message.js";
import { CCTP_DOMAIN_IDS, BRIDGE_CHAIN_IDS, BRIDGE_ENVIRONMENTS, USDC_CONTRACT, TOKEN_MESSENGER_V2, MESSAGE_TRANSMITTER_V2, FINALITY_THRESHOLD, CIRCLE_ATTESTATION_API_BY_ENVIRONMENT, MAX_ATTESTATION_POLLS, ATTESTATION_POLL_INTERVAL_MS } from "./types.js";
import type { BridgeChain, BridgeConfig, BridgeOptions, BridgeRecord, DestinationClients, AttestedMessage } from "./types.js";
const sourceViews = [{ type: "function", name: "tokenMessenger", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }, { type: "function", name: "sourceDomain", stateMutability: "view", inputs: [], outputs: [{ type: "uint32" }] }] as const;
function amount(value: bigint, zero = false) {
    if (typeof value !== "bigint" || value < (zero ? 0n : 1n) || value >= 2n ** 256n) {
        throw new Error("Bridge amount/fee must be uint256 bigint");
    }
}
function hash(value: unknown): asserts value is Hex {
    if (typeof value !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
        throw new Error("Invalid transaction hash");
    }
}
export class BridgeError extends Error {
    constructor(readonly code: string, message: string, readonly recoveryId?: string, options?: ErrorOptions, readonly txHash?: Hex) {
        super(`[BridgeModule:${code}] ${message}`, options);
        this.name = "BridgeError";
    }
}
export class BridgeModule {
    readonly fromChain: BridgeChain;
    private readonly config: BridgeConfig;
    constructor(private readonly wallet: AgentWallet, config: BridgeConfig) {
        if (!wallet?.address || !isAddress(wallet.address) || !wallet.chain || !wallet.publicClient || !wallet.walletClient || !wallet.contract || !wallet.expectedCodeHash) {
            throw new BridgeError("GUARDED_WALLET_REQUIRED", "Bridge v5 requires a guarded AgentWallet; raw EOA capital clients are unsupported");
        }
        const chain = (Object.keys(BRIDGE_CHAIN_IDS) as BridgeChain[]).find(c => BRIDGE_CHAIN_IDS[c] === wallet.chain.id);
        if (!chain) {
            throw new BridgeError("UNSUPPORTED_CHAIN", "Only Ethereum, Optimism, Arbitrum and Base mainnet/Sepolia networks are configured");
        }
        if (Boolean(wallet.chain.testnet) !== (BRIDGE_ENVIRONMENTS[chain] === 'testnet')) {
            throw new BridgeError("ENVIRONMENT_MISMATCH", "Wallet chain metadata does not match its configured CCTP environment");
        }
        this.fromChain = chain;
        if (!config?.store?.save || !config.store.load || !config.store.withLock || !config.destinations) {
            throw new BridgeError("RECOVERY_REQUIRED", "Durable store and dedicated destination clients are required before burn");
        }
        if (Object.keys(config).some(k => !["store", "destinations", "maxAttestationPolls", "attestationPollIntervalMs"].includes(k))) {
            throw new Error("Unsupported bridge config; only official Circle API is supported");
        }
        const polls = config.maxAttestationPolls ?? MAX_ATTESTATION_POLLS, interval = config.attestationPollIntervalMs ?? ATTESTATION_POLL_INTERVAL_MS;
        if (!Number.isInteger(polls) || polls < 1 || polls > 60 || !Number.isInteger(interval) || interval < 500 || interval > 30000) {
            throw new Error("Invalid attestation polling bounds");
        }
        this.config = { ...config, destinations: { ...config.destinations }, maxAttestationPolls: polls, attestationPollIntervalMs: interval };
    }
    private async preflight(toChain: BridgeChain): Promise<DestinationClients> {
        if (!Object.hasOwn(CCTP_DOMAIN_IDS, toChain) || toChain === this.fromChain) {
            throw new BridgeError("UNSUPPORTED_CHAIN", "Source and supported destination chains must differ");
        }
        if (BRIDGE_ENVIRONMENTS[toChain] !== BRIDGE_ENVIRONMENTS[this.fromChain]) {
            throw new BridgeError("ENVIRONMENT_MISMATCH", "Source and destination must use the same CCTP environment; mainnet/testnet routes are prohibited");
        }
        const destination = this.config.destinations[toChain];
        if (!destination?.walletClient?.account || !destination.publicClient) {
            throw new BridgeError("DESTINATION_REQUIRED", "Dedicated destination public and gas signing clients are required");
        }
        const { publicClient, walletClient } = destination;
        const chainId = BRIDGE_CHAIN_IDS[toChain];
        if (publicClient === this.wallet.publicClient || walletClient === this.wallet.walletClient || publicClient.chain?.id !== chainId || walletClient.chain?.id !== chainId || Boolean(publicClient.chain?.testnet) !== (BRIDGE_ENVIRONMENTS[toChain] === 'testnet') || Boolean(walletClient.chain?.testnet) !== (BRIDGE_ENVIRONMENTS[toChain] === 'testnet') || await publicClient.getChainId() !== chainId || await walletClient.getChainId() !== chainId) {
            throw new BridgeError("CHAIN_MISMATCH", "Destination clients and transports must match the destination chain");
        }
        const code = await publicClient.getBytecode({ address: MESSAGE_TRANSMITTER_V2[toChain] });
        if (!code || code === "0x") {
            throw new Error("Destination Circle transmitter is not deployed");
        }
        const domain = await publicClient.readContract({ address: MESSAGE_TRANSMITTER_V2[toChain], abi: MessageTransmitterV2Abi, functionName: "localDomain" });
        if (domain !== CCTP_DOMAIN_IDS[toChain]) {
            throw new Error("Destination CCTP domain mismatch");
        }
        if (await publicClient.getBalance({ address: walletClient.account!.address }) === 0n) {
            throw new Error("Destination gas signer has no native gas balance");
        }
        return destination;
    }
    private validateRecord(record: BridgeRecord) {
        const fields = ['version', 'id', 'vault', 'fromChain', 'toChain', 'recipient', 'amount', 'maxFee', 'minFinalityThreshold', 'createdAt', 'status', 'burnTxHash', 'sourceMessage', 'message', 'attestation', 'nonce', 'mintTxHash'];
        const decimal = /^(0|[1-9]\d{0,77})$/;
        if (!record || typeof record !== 'object' || Object.keys(record).some(key => !fields.includes(key)) || record.version !== 1 || typeof record.id !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(record.id) || !Number.isSafeInteger(record.createdAt) || record.createdAt < 0 || typeof record.vault !== 'string' || !isAddress(record.vault) || record.vault.toLowerCase() !== this.wallet.address.toLowerCase() || record.fromChain !== this.fromChain || !Object.hasOwn(CCTP_DOMAIN_IDS, record.toChain) || record.toChain === this.fromChain || !isAddress(record.recipient) || record.recipient.toLowerCase() === zeroAddress || typeof record.amount !== 'string' || !decimal.test(record.amount) || typeof record.maxFee !== 'string' || !decimal.test(record.maxFee) || ![1000, 2000].includes(record.minFinalityThreshold) || !["prepared", "burn-submitted", "burned", "attested", "mint-submitting", "mint-submitted", "minted"].includes(record.status)) {
            throw new Error("Invalid bridge recovery record or wallet binding");
        }
        if (BRIDGE_ENVIRONMENTS[record.toChain] !== BRIDGE_ENVIRONMENTS[this.fromChain]) {
            throw new Error("Bridge recovery record contains a mixed CCTP environment");
        }
        amount(BigInt(record.amount));
        amount(BigInt(record.maxFee), true);
        if (BigInt(record.maxFee) >= BigInt(record.amount)) {
            throw new Error("Bridge fee must be smaller than amount");
        }
        if (record.burnTxHash !== undefined) {
            hash(record.burnTxHash);
        }
        if (record.mintTxHash !== undefined) {
            hash(record.mintTxHash);
        }
        if (record.sourceMessage !== undefined) {
            validateMessage(record, record.sourceMessage, false);
        }
        if (!['attested', 'mint-submitting', 'mint-submitted', 'minted'].includes(record.status) && [record.message, record.attestation, record.nonce, record.mintTxHash].some(value => value !== undefined)) {
            throw new Error('Bridge recovery record has unexpected destination fields');
        }
        if (record.status === 'prepared' && (record.burnTxHash !== undefined || record.sourceMessage !== undefined)) {
            throw new Error('Bridge recovery prepared record has unexpected source fields');
        }
        if (record.status === 'burn-submitted' && record.sourceMessage !== undefined) {
            throw new Error('Bridge recovery submitted record has unexpected source message');
        }
        if (record.status !== "prepared" && !record.burnTxHash) {
            throw new Error("Incomplete bridge recovery source submission");
        }
        if (!["prepared", "burn-submitted"].includes(record.status) && !record.sourceMessage) {
            throw new Error("Incomplete bridge recovery source message");
        }
        if (["attested", "mint-submitting", "mint-submitted", "minted"].includes(record.status)) {
            if (!record.message || !record.attestation || !record.nonce) {
                throw new Error("Incomplete bridge recovery attestation");
            }
            const message = validateMessage(record, record.message, true);
            validateAttestation(record.attestation);
            if (record.nonce?.toLowerCase() !== messageNonce(message)) {
                throw new Error("Incomplete bridge recovery nonce");
            }
        }
        if (["mint-submitted", "minted"].includes(record.status) && !record.mintTxHash) {
            throw new Error("Incomplete bridge recovery destination submission");
        }
    }
    private async load(id: string) {
        const record = await this.config.store.load(id);
        if (!record || record.id !== id) {
            throw new Error("Bridge recovery record not found");
        }
        this.validateRecord(record);
        return Object.freeze({ ...record });
    }
    private extract(record: BridgeRecord, receipt: TransactionReceipt): Hex {
        const messages: Hex[] = [];
        for (const log of receipt.logs) {
            if (log.address.toLowerCase() !== MESSAGE_TRANSMITTER_V2[this.fromChain].toLowerCase()) {
                continue;
            }
            try {
                const decoded = decodeEventLog({ abi: MessageSentEventAbi, data: log.data, topics: log.topics, strict: true });
                messages.push(validateMessage(record, decoded.args.message, false));
            }
            catch {
            }
        }
        if (messages.length !== 1) {
            throw new Error("Expected exactly one matching Circle V2 MessageSent event");
        }
        return messages[0]!;
    }
    async burn(value: bigint, toChain: BridgeChain, options: BridgeOptions): Promise<BridgeRecord> {
        amount(value);
        if (!options || Object.keys(options).some(k => !["destinationAddress", "maxFee", "minFinalityThreshold"].includes(k)) || !isAddress(options.destinationAddress) || options.destinationAddress.toLowerCase() === zeroAddress) {
            throw new Error("Explicit owner-approved destination address required; API overrides are unsupported");
        }
        options = Object.freeze({ ...options });
        const maxFee = options.maxFee ?? 0n;
        amount(maxFee, true);
        if (maxFee >= value) {
            throw new Error("Bridge fee must be smaller than amount");
        }
        const finality = options.minFinalityThreshold ?? FINALITY_THRESHOLD.STANDARD;
        if (![1000, 2000].includes(finality)) {
            throw new Error("Finality must be 1000 fast or 2000 standard");
        }
        await this.preflight(toChain);
        if (await this.wallet.publicClient.getChainId() !== this.wallet.chain.id) {
            throw new Error("Source RPC chain mismatch");
        }
        const [messenger, domain] = await Promise.all([this.wallet.publicClient.readContract({ address: this.wallet.address, abi: sourceViews, functionName: "tokenMessenger" }), this.wallet.publicClient.readContract({ address: this.wallet.address, abi: sourceViews, functionName: "sourceDomain" })]);
        if (messenger.toLowerCase() !== TOKEN_MESSENGER_V2[this.fromChain].toLowerCase() || domain !== CCTP_DOMAIN_IDS[this.fromChain]) {
            throw new Error("Source vault CCTP deployment/domain mismatch");
        }
        let record: BridgeRecord = Object.freeze({ version: 1, id: randomUUID(), vault: this.wallet.address, fromChain: this.fromChain, toChain, recipient: options.destinationAddress, amount: value.toString(), maxFee: maxFee.toString(), minFinalityThreshold: finality, createdAt: Date.now(), status: "prepared" });
        await this.config.store.save(record);
        try {
            const result = await executeVaultOperation(this.wallet, "agentBridge", [USDC_CONTRACT[this.fromChain], value, CCTP_DOMAIN_IDS[toChain], pad(options.destinationAddress, { size: 32 }), maxFee, finality], { onSubmitted: async (txHash) => {
                    record = Object.freeze({ ...record, status: "burn-submitted", burnTxHash: txHash });
                    await this.config.store.save(record);
                } });
            record = Object.freeze({ ...record, burnTxHash: result.txHash });
            const sourceMessage = this.extract(record, result.receipt);
            record = Object.freeze({ ...record, status: "burned", sourceMessage });
            await this.config.store.save(record);
            return record;
        }
        catch (error) {
            throw new BridgeError("BURN_RECOVERY", "Burn outcome requires reconciliation; keep the recovery id and never repeat the burn blindly", record.id, { cause: error }, record.burnTxHash);
        }
    }
    async recoverBurn(id: string, txHash?: Hex): Promise<BridgeRecord> {
        return this.config.store.withLock(id, async () => {
            let record = await this.load(id);
            if (!["prepared", "burn-submitted", "burned"].includes(record.status)) {
                throw new Error("Burn already has destination activity; cannot reset recovery");
            }
            const burnHash = record.burnTxHash ?? txHash;
            hash(burnHash);
            if (record.burnTxHash && txHash && record.burnTxHash.toLowerCase() !== txHash.toLowerCase()) {
                throw new Error("Burn recovery hash mismatch");
            }
            const receipt = await this.wallet.publicClient.waitForTransactionReceipt({ hash: burnHash });
            if (receipt.status !== "success") {
                throw new Error("Burn transaction reverted");
            }
            const sourceMessage = this.extract(record, receipt);
            record = Object.freeze({ ...record, burnTxHash: burnHash, sourceMessage, status: "burned" });
            await this.config.store.save(record);
            return record;
        });
    }
    async bridge(value: bigint, toChain: BridgeChain, options: BridgeOptions) {
        const record = await this.burn(value, toChain, options);
        return this.resume(record.id);
    }
    private async poll(record: BridgeRecord): Promise<AttestedMessage> {
        if (!record.burnTxHash || !record.sourceMessage) {
            throw new Error("Recover the burn receipt before polling");
        }
        const host = CIRCLE_ATTESTATION_API_BY_ENVIRONMENT[BRIDGE_ENVIRONMENTS[this.fromChain]];
        const url = `${host}/v2/messages/${CCTP_DOMAIN_IDS[this.fromChain]}?transactionHash=${record.burnTxHash}`;
        for (let attempt = 0; attempt < this.config.maxAttestationPolls!; attempt++) {
            let response: unknown;
            try {
                response = await fetchPublicHttpsJson(url, { maxBytes: 262144, timeoutMs: 10000, maxRedirects: 0 });
            }
            catch (error) {
                if (!String(error).includes("HTTP 404")) {
                    throw error;
                }
            }
            if (response !== undefined) {
                if (!response || typeof response !== "object") {
                    throw new Error("Malformed Circle response");
                }
                const payload = response as Record<string, unknown>;
                if (typeof payload.sourceTxHash !== "string" || payload.sourceTxHash.toLowerCase() !== record.burnTxHash.toLowerCase() || !Array.isArray(payload.messages) || payload.messages.length > 100) {
                    throw new Error("Circle response has wrong burn transaction or malformed messages");
                }
                const matches: AttestedMessage[] = [];
                for (const item of payload.messages) {
                    if (!item || typeof item !== "object") {
                        throw new Error("Malformed Circle message status");
                    }
                    const entry = item as Record<string, unknown>;
                    if (entry.status === "pending_confirmations" || entry.status === "pending") {
                        continue;
                    }
                    if (entry.status !== "complete") {
                        throw new Error("Circle attestation is in an unsupported/error state");
                    }
                    if (entry.cctpVersion !== 2) {
                        continue;
                    }
                    let message: Hex;
                    try {
                        message = validateMessage(record, entry.message, true);
                    }
                    catch {
                        continue;
                    }
                    matches.push({ message, attestation: validateAttestation(entry.attestation) });
                }
                if (matches.length > 1) {
                    throw new Error("Ambiguous Circle attestation messages");
                }
                if (matches.length === 1) {
                    return matches[0]!;
                }
                if (payload.messages.some((item: Record<string, unknown>) => item?.status === "complete")) {
                    throw new Error("No attested V2 message matches the source burn");
                }
            }
            if (attempt + 1 < this.config.maxAttestationPolls!) {
                await new Promise(resolve => setTimeout(resolve, this.config.attestationPollIntervalMs));
            }
        }
        throw new BridgeError("ATTESTATION_TIMEOUT", "Burn remains recoverable; resume with the saved id", record.id);
    }
    async waitForAttestation(id: string): Promise<AttestedMessage> {
        return this.poll(await this.load(id));
    }
    private async mintRecord(record: BridgeRecord, attested: AttestedMessage): Promise<BridgeRecord> {
        const destination = await this.preflight(record.toChain), message = validateMessage(record, attested.message, true), attestation = validateAttestation(attested.attestation), nonce = messageNonce(message);
        const { publicClient, walletClient } = destination;
        const address = MESSAGE_TRANSMITTER_V2[record.toChain];
        const used = await publicClient.readContract({ address, abi: MessageTransmitterV2Abi, functionName: "usedNonces", args: [nonce] });
        if (used !== 0n) {
            throw new Error("CCTP nonce has already been received; reconcile destination receipt");
        }
        const simulation = await publicClient.simulateContract({ address, abi: MessageTransmitterV2Abi, functionName: "receiveMessage", args: [message, attestation], account: walletClient.account! });
        if (simulation.result !== true) {
            throw new Error("Circle attestation rejected by destination transmitter");
        }
        record = Object.freeze({ ...record, status: "attested", message, attestation, nonce });
        await this.config.store.save(record);
        record = Object.freeze({...record, status: "mint-submitting"});
        await this.config.store.save(record);
        let txHash: Hex | undefined;
        try {
            txHash = await walletClient.writeContract({ ...simulation.request, account: walletClient.account!, chain: walletClient.chain! });
            record = Object.freeze({ ...record, status: "mint-submitted", mintTxHash: txHash });
            await this.config.store.save(record);
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
            if (receipt.status !== "success") {
                throw new Error("Mint reverted; reconcile before retrying");
            }
            record = Object.freeze({ ...record, status: "minted" });
            await this.config.store.save(record);
        } catch (error) {
            throw new BridgeError("MINT_RECOVERY", "Mint was submitted; retain its hash and reconcile before retrying", record.id, {cause: error}, txHash);
        }
        return record;
    }
    async mint(id: string, attested: AttestedMessage): Promise<BridgeRecord> {
        return this.config.store.withLock(id, async () => {
            const record = await this.load(id);
            if (record.status === "minted" || record.status === "mint-submitted" || record.status === "mint-submitting") {
                throw new Error("Bridge mint already submitted; reconcile with resume");
            }
            return this.mintRecord(record, attested);
        });
    }
    async recoverMint(id: string, submittedHash?: Hex): Promise<BridgeRecord> {
        return this.config.store.withLock(id, async () => {
            let record = await this.load(id);
            if (record.status !== "mint-submitted" && !(["attested", "mint-submitting"].includes(record.status) && submittedHash)) {
                throw new Error("Only a submitted mint can be reconciled");
            }
            const txHash = record.mintTxHash ?? submittedHash;
            hash(txHash);
            if (record.mintTxHash && submittedHash && record.mintTxHash.toLowerCase() !== submittedHash.toLowerCase()) {
                throw new Error("Mint recovery hash mismatch");
            }
            const destination = await this.preflight(record.toChain);
            if (!record.mintTxHash) {
                const message = validateMessage(record, record.message, true);
                const attestation = validateAttestation(record.attestation);
                const transaction = await destination.publicClient.getTransaction({hash: txHash});
                const input = encodeFunctionData({abi: MessageTransmitterV2Abi, functionName: "receiveMessage", args: [message, attestation]});
                if (transaction.to?.toLowerCase() !== MESSAGE_TRANSMITTER_V2[record.toChain].toLowerCase() || transaction.input.toLowerCase() !== input.toLowerCase()) {
                    throw new Error("Mint recovery transaction does not match the saved attested burn");
                }
                record = Object.freeze({...record, status: "mint-submitted", mintTxHash: txHash});
                await this.config.store.save(record);
            }
            const receipt = await destination.publicClient.waitForTransactionReceipt({ hash: txHash });
            if (receipt.status === "success") {
                record = Object.freeze({ ...record, status: "minted" });
            }
            else
                record = Object.freeze({ ...record, status: "attested", mintTxHash: undefined });
            await this.config.store.save(record);
            return record;
        });
    }
    async resume(id: string): Promise<BridgeRecord> {
        return this.config.store.withLock(id, async () => {
            let record = await this.load(id);
            if (record.status === "minted") {
                return record;
            }
            if (record.status === "mint-submitting") {
                throw new BridgeError("MINT_RECOVERY", "Mint broadcast outcome is unknown; reconcile its hash before retrying", id);
            }
            if (record.status === "mint-submitted") {
                const destination = await this.preflight(record.toChain);
                hash(record.mintTxHash);
                const receipt = await destination.publicClient.waitForTransactionReceipt({ hash: record.mintTxHash });
                if (receipt.status !== "success") {
                    throw new Error("Previous mint reverted; explicit mint recovery is required");
                }
                record = Object.freeze({ ...record, status: "minted" });
                await this.config.store.save(record);
                return record;
            }
            return this.mintRecord(record, await this.poll(record));
        });
    }
    async getUsdcBalance() {
        return this.wallet.publicClient.readContract({ address: USDC_CONTRACT[this.fromChain], abi: ERC20BridgeAbi, functionName: "balanceOf", args: [this.wallet.address] });
    }
    async getUsdcAllowance() {
        return this.wallet.publicClient.readContract({ address: USDC_CONTRACT[this.fromChain], abi: ERC20BridgeAbi, functionName: "allowance", args: [this.wallet.address, TOKEN_MESSENGER_V2[this.fromChain]] });
    }
}
export function createBridge(wallet: AgentWallet, config: BridgeConfig) {
    return new BridgeModule(wallet, config);
}
export { CCTP_DOMAIN_IDS, BRIDGE_CHAIN_IDS, USDC_CONTRACT, TOKEN_MESSENGER_V2, MESSAGE_TRANSMITTER_V2, FINALITY_THRESHOLD };
