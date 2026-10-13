import {
  createPublicClient, custom, decodeEventLog, decodeFunctionData,
  getContractAddress, keccak256, toHex, type Address, type Hex,
  type TransactionReceipt,
} from "viem";
import { address, chains } from "./security";
import { erc20Abi, vaultAbi } from "./abi";
import { MessageTransmitterV2Abi } from "../../../src/bridge/abis";
import { messageNonce } from "../../../src/bridge/message";
import type { Provider } from "./wallet";

export const intentStorageKey = "agentwallet-public-intents-v1";
export const intentChanged = "agentwallet-public-intents-changed";
const originLock = "agentwallet-public-intents-v1";
export type IntentKind = "vault" | "source" | "deployment" | "mint";
export type IntentStatus = "unknown" | "confirmed" | "reverted" | "rejected";
const metaFields = [
  "owner", "operator", "vaultRuntimeHash", "sourceHash", "amount", "recipient",
  "destinationDomain", "mintNonce", "token", "transmitter", "transmitterHash",
  "balanceBefore", "expectedCredit",
] as const;
export type IntentMeta = Partial<Record<typeof metaFields[number], string>>;
export interface PublicIntent {
  id: string;
  kind: IntentKind;
  status: IntentStatus;
  chainId: number;
  from: Address;
  to?: Address;
  value: string;
  nonce: string;
  dataHash: Hex;
  label: string;
  createdAt: string;
  meta: IntentMeta;
  hash?: Hex;
  contractAddress?: Address;
  queueId?: string;
}
export interface BroadcastRequest {
  kind: IntentKind;
  chainId: number;
  from: Address;
  to?: Address;
  value?: bigint;
  data: Hex;
  gas: bigint;
  label: string;
  meta: IntentMeta;
  assertCurrent?: () => void;
  onClaimed?: (intent: PublicIntent) => void;
}
export class IntentSubmissionError extends Error {
  constructor(message: string, readonly intentId: string, readonly hash?: Hex) {
    super(message);
    this.name = "IntentSubmissionError";
  }
}
export function walletRejected(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && error.code === 4001;
}
function failure(error: unknown) {
  return (error instanceof Error ? error.message : String(error)).slice(0, 650);
}
function uint(value: unknown): string {
  if (typeof value !== "string" || !/^(0|[1-9]\d{0,77})$/.test(value) || BigInt(value) >= 2n ** 256n)
    throw Error("Recovery journal contains an invalid public integer.");
  return value;
}
function hash(value: unknown): Hex {
  if (typeof value !== "string" || !/^0x[\da-f]{64}$/i.test(value))
    throw Error("Recovery journal contains an invalid public hash.");
  return value.toLowerCase() as Hex;
}
function publicAddress(value: unknown): Address {
  if (typeof value !== "string") throw Error("Recovery journal address is invalid.");
  return address(value).toLowerCase() as Address;
}
function metadata(value: unknown): IntentMeta {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Recovery journal public metadata is invalid.");
  const raw = value as Record<string, unknown>;
  const result: IntentMeta = {};
  for (const [field, item] of Object.entries(raw)) {
    if (!metaFields.some((allowed) => allowed === field) || typeof item !== "string" || item.length > 160)
      throw Error("Recovery journal contains unsupported metadata.");
    let checked = item;
    if (["owner", "operator", "token", "transmitter"].includes(field)) checked = publicAddress(item);
    else if (["vaultRuntimeHash", "sourceHash", "mintNonce", "transmitterHash"].includes(field)) checked = hash(item);
    else if (["balanceBefore", "expectedCredit", "destinationDomain"].includes(field)) checked = uint(item);
    else if (field === "recipient" && !/^0x(?:[\da-f]{40}|[\da-f]{64})$/i.test(item))
      throw Error("Recovery journal recipient is invalid.");
    result[field as typeof metaFields[number]] = checked;
  }
  return result;
}
function entry(value: unknown): PublicIntent {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("Recovery journal entry is invalid.");
  const v = value as Record<string, unknown>;
  const fields = ["id", "kind", "status", "chainId", "from", "to", "value", "nonce", "dataHash", "label", "createdAt", "meta", "hash", "contractAddress", "queueId"];
  if (Object.keys(v).some((field) => !fields.includes(field)) ||
    typeof v.id !== "string" || !/^[\da-f-]{36}$/i.test(v.id) ||
    !["vault", "source", "deployment", "mint"].includes(String(v.kind)) ||
    !["unknown", "confirmed", "reverted", "rejected"].includes(String(v.status)) ||
    typeof v.chainId !== "number" || !(v.chainId in chains) ||
    typeof v.label !== "string" || !v.label || v.label.length > 160 ||
    typeof v.createdAt !== "string" || v.createdAt.length !== 24 ||
    new Date(v.createdAt).toISOString() !== v.createdAt)
    throw Error("Recovery journal cannot verify its existing entries. Sending is blocked.");
  const checked: PublicIntent = {
    id: v.id, kind: v.kind as IntentKind, status: v.status as IntentStatus,
    chainId: v.chainId, from: publicAddress(v.from), value: uint(v.value),
    nonce: uint(v.nonce), dataHash: hash(v.dataHash), label: v.label,
    createdAt: v.createdAt, meta: metadata(v.meta),
    ...(v.to !== undefined ? { to: publicAddress(v.to) } : {}),
    ...(v.hash !== undefined ? { hash: hash(v.hash) } : {}),
    ...(v.contractAddress !== undefined ? { contractAddress: publicAddress(v.contractAddress) } : {}),
    ...(v.queueId !== undefined ? { queueId: uint(v.queueId) } : {}),
  };
  if (checked.value !== "0" || (checked.kind === "deployment" ? !!checked.to : !checked.to))
    throw Error("Recovery journal transaction boundary is invalid.");
  if (checked.kind === "deployment" && (checked.meta.owner !== checked.from || !checked.meta.operator))
    throw Error("Recovery journal deployment owner is invalid.");
  if (checked.kind !== "deployment" && !checked.meta.vaultRuntimeHash)
    throw Error("Recovery journal deployment hash is missing.");
  if (checked.kind === "mint" && ["sourceHash", "mintNonce", "token", "transmitter", "transmitterHash", "balanceBefore", "expectedCredit"].some((field) => !checked.meta[field as keyof IntentMeta]))
    throw Error("Recovery journal receiving evidence is incomplete.");
  if ((checked.status === "confirmed" || checked.status === "reverted") && !checked.hash)
    throw Error("Recovery journal receipt evidence is missing.");
  return checked;
}
export function readIntents(): PublicIntent[] {
  const text = localStorage.getItem(intentStorageKey);
  if (text === null) return [];
  if (text.length > 200000) throw Error("Recovery journal storage exceeds its safety limit.");
  const raw: unknown = JSON.parse(text);
  if (!Array.isArray(raw) || raw.length > 100) throw Error("Recovery journal storage is invalid.");
  const result = raw.map(entry);
  if (new Set(result.map((item) => item.id)).size !== result.length)
    throw Error("Recovery journal contains duplicate intent identities.");
  return result;
}
export function assertNoUnresolvedIntent() {
  if (readIntents().some((item) => item.status === "unknown"))
    throw Error("An unresolved wallet request remains. Recover its exact transaction before another write.");
}
async function locked<T>(action: () => T | Promise<T>): Promise<T> {
  if (!navigator.locks?.request) throw Error("Origin-wide browser locks are unavailable. Sending is blocked.");
  return navigator.locks.request(originLock, action);
}
function save(records: PublicIntent[]) {
  const text = JSON.stringify(records.map(entry));
  try {
    localStorage.setItem(intentStorageKey, text);
    if (localStorage.getItem(intentStorageKey) !== text) throw Error("Recovery storage did not retain its public intent.");
  } catch (error) {
    throw Error(`Recovery intent storage unavailable: ${failure(error)}`);
  }
  window.dispatchEvent(new Event(intentChanged));
}
function identity(intent: PublicIntent) {
  return JSON.stringify([
    intent.id, intent.kind, intent.chainId, intent.from, intent.to ?? null,
    intent.value, intent.nonce, intent.dataHash, intent.label, intent.createdAt,
    metaFields.map((field) => intent.meta[field] ?? null),
  ]);
}
async function update(id: string, change: Partial<PublicIntent>, original?: PublicIntent) {
  return locked(() => {
    const records = readIntents();
    const index = records.findIndex((item) => item.id === id);
    if (index < 0) throw Error("Original recovery intent is missing; sending remains blocked.");
    const latest = records[index];
    if (original && identity(latest) !== identity(original))
      throw Error("The original public intent identity changed during reconciliation. Keep its original transaction.");
    if (latest.hash && change.hash && latest.hash !== change.hash)
      throw Error("The journal already binds a different transaction hash. Keep its original terminal evidence.");
    if (latest.status !== "unknown" && change.status && latest.status !== change.status)
      throw Error("Contradictory terminal receipt evidence cannot overwrite the latest locked journal entry.");
    if ((latest.contractAddress && change.contractAddress && latest.contractAddress !== change.contractAddress) ||
      (latest.queueId !== undefined && change.queueId !== undefined && latest.queueId !== change.queueId))
      throw Error("Contradictory receipt details cannot overwrite the original terminal evidence.");
    const next = entry({ ...latest, ...change });
    records[index] = next;
    save(records);
    return next;
  });
}
export async function broadcastIntent(
  provider: Provider,
  request: BroadcastRequest,
  onSubmitted: (hash: Hex) => void,
): Promise<{ hash: Hex; intentId: string }> {
  const rpc = createPublicClient({ transport: custom(provider) });
  if (await rpc.getChainId() !== request.chainId) throw Error("Wallet network changed before submission.");
  const nonce = await rpc.getTransactionCount({ address: request.from, blockTag: "pending" });
  if (!Number.isSafeInteger(nonce) || nonce < 0) throw Error("Wallet nonce cannot be safely represented.");
  request.assertCurrent?.();
  const intent = await locked(() => {
    request.assertCurrent?.();
    assertNoUnresolvedIntent();
    const record = entry({
      id: crypto.randomUUID(), kind: request.kind, status: "unknown",
      chainId: request.chainId, from: request.from, to: request.to,
      value: String(request.value ?? 0n), nonce: String(nonce),
      dataHash: keccak256(request.data), label: request.label,
      createdAt: new Date().toISOString(), meta: request.meta,
    });
    save([record, ...readIntents()].slice(0, 100));
    return record;
  });
  let attempted = false;
  let returned: Hex;
  try {
    request.onClaimed?.(entry(intent));
    request.assertCurrent?.();
    if (await rpc.getChainId() !== intent.chainId) throw Error("Wallet network changed before submission.");
    const accounts = await provider.request({ method: "eth_accounts" });
    if (accounts[0]?.toLowerCase() !== intent.from) throw Error("Wallet account changed before submission.");
    if (await rpc.getTransactionCount({ address: intent.from, blockTag: "pending" }) !== nonce)
      throw Error("Wallet nonce changed before submission. Review again.");
    request.assertCurrent?.();
    attempted = true;
    returned = await provider.request({ method: "eth_sendTransaction", params: [{
      from: request.from, ...(request.to ? { to: request.to } : {}),
      value: "0x0", data: request.data, gas: toHex(request.gas),
      nonce: toHex(nonce), chainId: toHex(request.chainId),
    }] });
  } catch (error) {
    if (!attempted || walletRejected(error)) {
      await update(intent.id, { status: "rejected" }, intent);
      throw error;
    }
    throw new IntentSubmissionError(`Wallet broadcast outcome unknown: ${failure(error)}. Do not send again; recover the original transaction hash.`, intent.id);
  }
  let submitted: Hex;
  try { submitted = hash(returned); }
  catch { throw new IntentSubmissionError("Wallet returned no valid transaction hash. The original request remains unknown; do not send again.", intent.id); }
  let persistenceFailure: { error: unknown } | undefined;
  try { await update(intent.id, { hash: submitted }, intent); }
  catch (error) { persistenceFailure = { error }; }
  let callbackFailure: { error: unknown } | undefined;
  try { onSubmitted(submitted); }
  catch (error) { callbackFailure = { error }; }
  if (persistenceFailure) {
    throw new IntentSubmissionError(`Wallet returned transaction ${submitted}, but recovery storage could not save its hash: ${failure(persistenceFailure.error)}. Keep this hash; do not send again.`, intent.id, submitted);
  }
  if (callbackFailure)
    throw new IntentSubmissionError(`Wallet returned transaction ${submitted}, but recording its public submission failed: ${failure(callbackFailure.error)}. Keep this hash and reconcile its original receipt; do not send again.`, intent.id, submitted);
  return { hash: submitted, intentId: intent.id };
}
export async function reconcileIntent(
  provider: Provider,
  id: string,
  suppliedHash: Hex,
): Promise<{ intent: PublicIntent; receipt: TransactionReceipt }> {
  const original = readIntents().find((item) => item.id === id);
  if (!original || original.status === "rejected") throw Error("No submitted public intent exists with that identity.");
  const submitted = hash(suppliedHash);
  if (original.hash && original.hash !== submitted) throw Error("Use the original submitted transaction hash.");
  const rpc = createPublicClient({ transport: custom(provider) });
  if (await rpc.getChainId() !== original.chainId) throw Error(`Switch the wallet to the original intent chain ${original.chainId}.`);
  const tx = await rpc.getTransaction({ hash: submitted });
  if (tx.hash.toLowerCase() !== submitted || tx.chainId !== original.chainId ||
    tx.from.toLowerCase() !== original.from || (tx.to?.toLowerCase() ?? undefined) !== original.to ||
    tx.value !== BigInt(original.value) || !Number.isSafeInteger(tx.nonce) || String(tx.nonce) !== original.nonce ||
    keccak256(tx.input) !== original.dataHash)
    throw Error("Transaction chain, signer, destination, value, nonce or calldata digest does not match the original intent.");
  const receipt = await rpc.waitForTransactionReceipt({ hash: submitted, confirmations: 2, timeout: 180000 });
  if (receipt.transactionHash.toLowerCase() !== submitted ||
    receipt.from.toLowerCase() !== original.from || (receipt.to?.toLowerCase() ?? undefined) !== original.to)
    throw Error("RPC returned a receipt for a different transaction. The original intent remains unresolved.");
  if (receipt.status !== "success" && receipt.status !== "reverted")
    throw Error("RPC returned an unsupported receipt status. The original wallet request remains unknown; do not send again.");
  const receiptStatus = receipt.status === "success" ? "confirmed" : "reverted";
  if (original.status !== "unknown" && original.status !== receiptStatus)
    throw Error("RPC receipt contradicts the saved terminal evidence. Keep the original transaction and inspect its network history.");
  if (await rpc.getChainId() !== original.chainId) throw Error("Wallet network changed during receipt reconciliation.");
  let contractAddress: Address | undefined;
  let queueId: string | undefined;
  if (receipt.status === "success") {
    if (original.kind === "deployment") {
      const expected = getContractAddress({ from: original.from, nonce: BigInt(original.nonce) });
      if (!receipt.contractAddress || receipt.contractAddress.toLowerCase() !== expected.toLowerCase())
        throw Error("Creation receipt does not match the original owner and nonce.");
      contractAddress = publicAddress(receipt.contractAddress);
    }
    if (original.kind === "mint") {
      const meta = original.meta;
      const decoded = decodeFunctionData({ abi: vaultAbi, data: tx.input });
      if (decoded.functionName !== "ownerExecute" || decoded.args[0].toLowerCase() !== meta.transmitter || decoded.args[1] !== 0n)
        throw Error("Receiving transaction does not target its reviewed transmitter.");
      const receive = decodeFunctionData({ abi: MessageTransmitterV2Abi, data: decoded.args[2] });
      if (receive.functionName !== "receiveMessage" || messageNonce(receive.args[0]) !== meta.mintNonce)
        throw Error("Receiving transaction CCTP nonce does not match its intent.");
      const code = await rpc.getCode({ address: meta.transmitter as Address });
      if (!code || keccak256(code) !== meta.transmitterHash) throw Error("Receiving transmitter code changed; keep the original intent.");
      const [used, balance] = await Promise.all([
        rpc.readContract({ address: meta.transmitter as Address, abi: MessageTransmitterV2Abi, functionName: "usedNonces", args: [meta.mintNonce as Hex], blockNumber: receipt.blockNumber }),
        rpc.readContract({ address: meta.token as Address, abi: erc20Abi, functionName: "balanceOf", args: [original.to!], blockNumber: receipt.blockNumber }),
      ]);
      if (used === 0n || balance < BigInt(meta.balanceBefore!) + BigInt(meta.expectedCredit!))
        throw Error("Receiving receipt did not establish the reviewed nonce consumption and vault credit. Do not resend.");
    }
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== original.to) continue;
      try {
        const event = decodeEventLog({ abi: vaultAbi, data: log.data, topics: log.topics });
        if (event.eventName === "TransactionQueued") queueId = String(event.args.txId);
      } catch { /* Non-vault logs do not establish a queue outcome. */ }
    }
  }
  if (await rpc.getChainId() !== original.chainId) throw Error("Wallet network changed during receipt reconciliation.");
  const reconciled = await update(id, {
    hash: submitted, status: receiptStatus,
    ...(contractAddress ? { contractAddress } : {}), ...(queueId !== undefined ? { queueId } : {}),
  }, original);
  return { intent: reconciled, receipt };
}
