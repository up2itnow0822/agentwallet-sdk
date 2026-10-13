import { randomUUID } from "node:crypto";
import {
  decodeEventLog,
  decodeFunctionData,
  isAddress,
  keccak256,
  parseAbi,
  recoverTypedDataAddress,
  encodeFunctionData,
  zeroAddress,
  type Address,
  type Hash,
  type PublicClient,
  type Chain,
  type Transport,
} from "viem";
import { AgentVaultAbi } from "../contracts/AgentVaultAbi.js";
import { assertPositiveAmount } from "./budget.js";
import { PAYMENT_BINDING_TYPES } from "./client.js";
import {
  MerchantSettlementStore,
  type IssuedPaymentChallenge,
} from "./merchant-store.js";
import {
  GUARDED_TRANSACTION_SCHEME,
  type GuardedPaymentRequired,
  type GuardedPaymentRequirements,
} from "./types.js";
export interface GuardedPaymentMerchantConfig<
  TChain extends Chain | undefined = Chain | undefined,
> {
  readonly publicClient: PublicClient<Transport, TChain>;
  readonly vault: Address;
  readonly expectedCodeHash: Hash;
  readonly deploymentBlock: bigint;
  readonly chainId: number;
  readonly origin: string;
  readonly resource: string;
  readonly asset: Address;
  readonly recipient: Address;
  readonly amount: bigint;
  readonly confirmations: number;
  readonly durableDirectory: string;
  readonly challengeTtlMs?: number;
  /** Confirmation/proof window after mining: at least 30 seconds per required confirmation, at most 24 hours. */
  readonly proofTtlMs?: number;
}
export interface VerifiedGuardedPayment {
  readonly protocol: typeof GUARDED_TRANSACTION_SCHEME;
  readonly txHash: Hash;
  readonly requestId: string;
  readonly resource: string;
  readonly vault: Address;
  readonly signer: Address;
  readonly asset: Address;
  readonly recipient: Address;
  readonly amount: bigint;
  readonly network: `eip155:${number}`;
  readonly blockNumber: bigint;
  readonly confirmedAt: number;
}
interface PaymentProof {
  protocol: typeof GUARDED_TRANSACTION_SCHEME;
  resource: string;
  accepted: GuardedPaymentRequirements;
  payload: {
    txHash: Hash;
    vault: Address;
    signer: Address;
    signature: `0x${string}`;
  };
}
const TRANSFER_ABI = parseAbi([
  "event Transfer(address indexed from,address indexed to,uint256 value)",
]);
const CURVE_ORDER =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
function sameAddress(a: string | undefined | null, b: string): boolean {
  return typeof a === "string" && a.toLowerCase() === b.toLowerCase();
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function keys(
  value: Record<string, unknown>,
  allowed: readonly string[],
): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}
async function deadline<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Merchant chain evidence deadline exceeded")),
          5000,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
function canonicalSignature(value: unknown): value is `0x${string}` {
  if (
    typeof value !== "string" ||
    !/^0x[0-9a-fA-F]{130}$/.test(value) ||
    !["1b", "1c"].includes(value.slice(-2).toLowerCase())
  )
    return false;
  const r = BigInt(`0x${value.slice(2, 66)}`),
    s = BigInt(`0x${value.slice(66, 130)}`);
  return r > 0n && r < CURVE_ORDER && s > 0n && s <= CURVE_ORDER / 2n;
}
function decodeProof(header: string): PaymentProof {
  if (
    typeof header !== "string" ||
    header.length > 32768 ||
    header.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(header)
  )
    throw new Error("Malformed merchant payment proof");
  let value: unknown;
  try {
    const bytes = Buffer.from(header, "base64");
    if (bytes.toString("base64") !== header) throw new Error();
    value = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    ) as unknown;
  } catch {
    throw new Error("Malformed merchant payment proof");
  }
  if (
    !record(value) ||
    !keys(value, ["protocol", "resource", "accepted", "payload"]) ||
    value.protocol !== GUARDED_TRANSACTION_SCHEME ||
    typeof value.resource !== "string" ||
    !record(value.accepted) ||
    !record(value.payload)
  )
    throw new Error("Unsupported merchant payment proof");
  const p = value.accepted,
    proof = value.payload;
  if (
    !keys(p, [
      "scheme",
      "network",
      "asset",
      "amount",
      "payTo",
      "resource",
      "requestId",
      "expiresAt",
      "confirmations",
      "proofExpiresAt",
    ]) ||
    p.scheme !== GUARDED_TRANSACTION_SCHEME ||
    typeof p.network !== "string" ||
    !/^eip155:[1-9]\d*$/.test(p.network) ||
    typeof p.asset !== "string" ||
    !isAddress(p.asset) ||
    typeof p.payTo !== "string" ||
    !isAddress(p.payTo) ||
    typeof p.amount !== "string" ||
    !/^[1-9]\d{0,77}$/.test(p.amount) ||
    typeof p.resource !== "string" ||
    typeof p.requestId !== "string" ||
    !/^[A-Za-z0-9_-]{16,128}$/.test(p.requestId) ||
    !Number.isSafeInteger(p.expiresAt) ||
    Number(p.expiresAt) <= 0 ||
    !Number.isSafeInteger(p.confirmations) ||
    Number(p.confirmations) < 1 ||
    Number(p.confirmations) > 64 ||
    !Number.isSafeInteger(p.proofExpiresAt) ||
    Number(p.proofExpiresAt) < Number(p.expiresAt) + 30000 * Number(p.confirmations) ||
    Number(p.proofExpiresAt) > Number(p.expiresAt) + 86400000
  )
    throw new Error("Invalid merchant accepted payment details");
  assertPositiveAmount(BigInt(p.amount));
  if (
    !keys(proof, ["txHash", "vault", "signer", "signature"]) ||
    typeof proof.txHash !== "string" ||
    !/^0x[0-9a-fA-F]{64}$/.test(proof.txHash) ||
    typeof proof.vault !== "string" ||
    !isAddress(proof.vault) ||
    typeof proof.signer !== "string" ||
    !isAddress(proof.signer) ||
    !canonicalSignature(proof.signature)
  )
    throw new Error("Invalid merchant signature or transaction binding");
  return value as unknown as PaymentProof;
}
/** Merchant-owned custom settlement verifier. RPC, deployment manifest and store configuration are trusted owner inputs. */
export class GuardedPaymentMerchant<
  TChain extends Chain | undefined = Chain | undefined,
> {
  private readonly config: GuardedPaymentMerchantConfig;
  private readonly store: MerchantSettlementStore;
  private readonly ttl: number;
  private readonly proofTtl: number;
  constructor(config: GuardedPaymentMerchantConfig<TChain>) {
    const origin = new URL(config.origin),
      resource = new URL(config.resource);
    if (
      origin.protocol !== "https:" ||
      origin.origin !== config.origin ||
      origin.username ||
      origin.password ||
      resource.origin !== config.origin ||
      resource.href !== config.resource ||
      resource.username ||
      resource.password ||
      resource.hash ||
      config.resource.length > 2048
    )
      throw new Error("Merchant requires exact HTTPS origin/resource");
    for (const address of [config.vault, config.asset, config.recipient])
      if (!isAddress(address) || sameAddress(address, zeroAddress))
        throw new Error("Invalid merchant address");
    if (
      !/^0x[0-9a-fA-F]{64}$/.test(config.expectedCodeHash) ||
      !Number.isSafeInteger(config.chainId) ||
      config.chainId <= 0 ||
      typeof config.deploymentBlock !== "bigint" ||
      config.deploymentBlock < 0n ||
      !Number.isSafeInteger(config.confirmations) ||
      config.confirmations < 1 ||
      config.confirmations > 64
    )
      throw new Error("Invalid verified deployment/confirmation configuration");
    if (
      config.publicClient.chain &&
      config.publicClient.chain.id !== config.chainId
    )
      throw new Error("Merchant configured client chain mismatch");
    assertPositiveAmount(config.amount);
    this.ttl = config.challengeTtlMs ?? 120000;
    if (!Number.isSafeInteger(this.ttl) || this.ttl < 1000 || this.ttl > 300000)
      throw new Error("Invalid merchant challenge lifetime");
    this.proofTtl = config.proofTtlMs ?? 3600000;
    if (!Number.isSafeInteger(this.proofTtl) || this.proofTtl < 30000 * config.confirmations || this.proofTtl > 86400000)
      throw new Error("Invalid merchant confirmation/proof lifetime");
    this.config = Object.freeze({
      ...config,
      publicClient: config.publicClient as unknown as PublicClient,
    });
    this.store = new MerchantSettlementStore(config.durableDirectory);
  }
  get resource(): string {
    return this.config.resource;
  }
  private async verifiedHead(): Promise<bigint> {
    const [chainId, head] = await Promise.all([
      this.config.publicClient.getChainId(),
      this.config.publicClient.getBlockNumber({ cacheTime: 0 }),
    ]);
    if (chainId !== this.config.chainId || head < this.config.deploymentBlock)
      throw new Error("Merchant chain/deployment mismatch");
    await this.verifyVault(head);
    return head;
  }
  private async verifyVault(blockNumber: bigint): Promise<void> {
    const [code, version] = await Promise.all([
      this.config.publicClient.getBytecode({
        address: this.config.vault,
        blockNumber,
      }),
      this.config.publicClient.readContract({
        address: this.config.vault,
        abi: AgentVaultAbi,
        functionName: "securityVersion",
        blockNumber,
      }),
    ]);
    if (
      !code ||
      code === "0x" ||
      keccak256(code).toLowerCase() !==
        this.config.expectedCodeHash.toLowerCase() ||
      version !== 1n
    )
      throw new Error(
        "Merchant vault runtime/version is not the pinned deployment",
      );
  }
  async issueChallenge(): Promise<GuardedPaymentRequired> {
    const head = await deadline(this.verifiedHead());
    const now = Date.now();
    const payment: GuardedPaymentRequirements = Object.freeze({
      scheme: GUARDED_TRANSACTION_SCHEME,
      network: `eip155:${this.config.chainId}`,
      asset: this.config.asset,
      amount: this.config.amount.toString(),
      payTo: this.config.recipient,
      resource: this.config.resource,
      requestId: randomUUID(),
      confirmations: this.config.confirmations,
      expiresAt: now + this.ttl,
      proofExpiresAt: now + this.ttl + this.proofTtl,
    });
    this.store.issue(
      Object.freeze({
        payment,
        issuedAt: now,
        minimumBlock: (head + 1n).toString(),
      }),
    );
    return Object.freeze({
      protocol: GUARDED_TRANSACTION_SCHEME,
      resource: this.config.resource,
      accepts: Object.freeze([payment]),
    });
  }
  async verifyPayment(header: string): Promise<VerifiedGuardedPayment> {
    const proof = decodeProof(header),
      challenge = this.store.find(proof.accepted.requestId),
      payment = challenge.payment;
    if (
      proof.resource !== this.config.resource ||
      payment.resource !== this.config.resource ||
      proof.accepted.resource !== this.config.resource ||
      !sameAddress(proof.payload.vault, this.config.vault) ||
      proof.accepted.scheme !== payment.scheme ||
      proof.accepted.network !== payment.network ||
      payment.network !== `eip155:${this.config.chainId}` ||
      !sameAddress(proof.accepted.asset, payment.asset) ||
      !sameAddress(payment.asset, this.config.asset) ||
      !sameAddress(proof.accepted.payTo, payment.payTo) ||
      !sameAddress(payment.payTo, this.config.recipient) ||
      proof.accepted.amount !== payment.amount ||
      BigInt(payment.amount) !== this.config.amount ||
      proof.accepted.expiresAt !== payment.expiresAt ||
      proof.accepted.confirmations !== payment.confirmations ||
      payment.confirmations !== this.config.confirmations ||
      proof.accepted.proofExpiresAt !== payment.proofExpiresAt ||
      Date.now() < challenge.issuedAt
    )
      throw new Error(
        "Merchant proof does not match the exact issued challenge",
      );
    const evidence = await deadline(this.verifyEvidence(proof, challenge));
    this.store.consume(challenge, proof.payload.txHash);
    return Object.freeze({
      protocol: GUARDED_TRANSACTION_SCHEME,
      txHash: proof.payload.txHash,
      requestId: payment.requestId,
      resource: payment.resource,
      vault: this.config.vault,
      signer: proof.payload.signer,
      asset: payment.asset,
      recipient: payment.payTo,
      amount: BigInt(payment.amount),
      network: payment.network,
      blockNumber: evidence.blockNumber,
      confirmedAt: Date.now(),
    });
  }
  private async verifyEvidence(
    proof: PaymentProof,
    challenge: IssuedPaymentChallenge,
  ): Promise<{ blockNumber: bigint }> {
    const payment = challenge.payment;
    const signer = await recoverTypedDataAddress({
      domain: {
        name: "AgentVaultTransactionPayment",
        version: "1",
        chainId: this.config.chainId,
        verifyingContract: this.config.vault,
      },
      types: PAYMENT_BINDING_TYPES,
      primaryType: "PaymentBinding",
      message: {
        txHash: proof.payload.txHash,
        resource: payment.resource,
        requestId: payment.requestId,
        asset: payment.asset,
        payTo: payment.payTo,
        amount: BigInt(payment.amount),
        confirmations: BigInt(payment.confirmations),
        expiresAt: BigInt(payment.expiresAt),
        proofExpiresAt: BigInt(payment.proofExpiresAt),
      },
      signature: proof.payload.signature,
    });
    if (!sameAddress(signer, proof.payload.signer))
      throw new Error("Merchant payment signature is invalid");
    const [head, tx, receipt] = await Promise.all([
      this.verifiedHead(),
      this.config.publicClient.getTransaction({ hash: proof.payload.txHash }),
      this.config.publicClient.getTransactionReceipt({
        hash: proof.payload.txHash,
      }),
    ]);
    if (
      tx.hash.toLowerCase() !== proof.payload.txHash.toLowerCase() ||
      !sameAddress(tx.from, signer) ||
      !sameAddress(tx.to, this.config.vault) ||
      tx.chainId !== this.config.chainId ||
      tx.value !== 0n ||
      receipt.status !== "success" ||
      receipt.transactionHash.toLowerCase() !==
        proof.payload.txHash.toLowerCase() ||
      !sameAddress(receipt.from, signer) ||
      !sameAddress(receipt.to, this.config.vault) ||
      receipt.blockNumber < BigInt(challenge.minimumBlock) ||
      receipt.blockNumber < this.config.deploymentBlock ||
      head < receipt.blockNumber ||
      head - receipt.blockNumber + 1n < BigInt(this.config.confirmations) ||
      tx.blockHash !== receipt.blockHash ||
      tx.blockNumber !== receipt.blockNumber
    )
      throw new Error(
        "Merchant transaction or confirmed receipt evidence is invalid",
      );
    const call = decodeFunctionData({ abi: AgentVaultAbi, data: tx.input });
    if (
      call.functionName !== "agentTransferToken" ||
      !call.args ||
      !sameAddress(String(call.args[0]), payment.asset) ||
      !sameAddress(String(call.args[1]), payment.payTo) ||
      call.args[2] !== BigInt(payment.amount)
    )
      throw new Error(
        "Merchant transaction is not the exact guarded token payment",
      );
    const canonical = encodeExactPayment(payment);
    if (tx.input.toLowerCase() !== canonical.toLowerCase())
      throw new Error("Merchant transaction calldata is not canonical");
    const [block] = await Promise.all([
      this.config.publicClient.getBlock({ blockNumber: receipt.blockNumber }),
      this.verifyVault(receipt.blockNumber),
    ]);
    if (
      block.hash !== receipt.blockHash ||
      block.timestamp < BigInt(Math.floor(challenge.issuedAt / 1000)) ||
      block.timestamp > BigInt(Math.floor(payment.expiresAt / 1000)) ||
      block.timestamp > BigInt(Math.floor(Date.now() / 1000))
    )
      throw new Error(
        "Merchant payment block is stale, reorged or outside challenge lifetime",
      );
    const transfer = receipt.logs.some((log) => {
      if (
        !sameAddress(log.address, payment.asset) ||
        log.removed ||
        log.transactionHash?.toLowerCase() !==
          proof.payload.txHash.toLowerCase() ||
        log.blockHash !== receipt.blockHash
      )
        return false;
      try {
        const event = decodeEventLog({
          abi: TRANSFER_ABI,
          data: log.data,
          topics: log.topics,
          strict: true,
        });
        return (
          sameAddress(event.args.from, this.config.vault) &&
          sameAddress(event.args.to, payment.payTo) &&
          event.args.value === BigInt(payment.amount)
        );
      } catch {
        return false;
      }
    });
    if (!transfer)
      throw new Error(
        "Merchant receipt lacks the exact confirmed token transfer",
      );
    return { blockNumber: receipt.blockNumber };
  }
}
function encodeExactPayment(
  payment: GuardedPaymentRequirements,
): `0x${string}` {
  return encodeFunctionData({
    abi: AgentVaultAbi,
    functionName: "agentTransferToken",
    args: [payment.asset, payment.payTo, BigInt(payment.amount)],
  });
}
