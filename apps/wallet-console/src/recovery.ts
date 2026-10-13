import {
  decodeEventLog,
  decodeFunctionData,
  encodeFunctionData,
  formatUnits,
  keccak256,
  pad,
  type Address,
  type Hex,
} from "viem";
import {
  MessageSentEventAbi,
  MessageTransmitterV2Abi,
} from "../../../src/bridge/abis";
import {
  CCTP_DOMAIN_IDS,
  MESSAGE_TRANSMITTER_V2,
  TOKEN_MESSENGER_V2,
  USDC_CONTRACT,
  type BridgeChain,
  type BridgeRecord,
} from "../../../src/bridge/types";
import {
  validateMessage,
  validateAttestation,
  messageNonce,
} from "../../../src/bridge/message";
import { vaultAbi, erc20Abi } from "./abi";
import { parseManifest, validateReceipt, type Manifest } from "./security";
import {
  client,
  verify,
  operation,
  type Operation,
  type Provider,
} from "./wallet";
export const testnetChainKeys: Record<number, BridgeChain> = {
  84532: "base-sepolia",
  11155111: "ethereum-sepolia",
  421614: "arbitrum-sepolia",
  11155420: "optimism-sepolia",
};
export interface RecoveryManifest {
  manifest: Manifest;
  transmitterHash: Hex;
}
export interface RecoveryDraft {
  record: BridgeRecord;
  destination: RecoveryManifest;
  account: Address;
  op: Operation;
  fee: string;
  balanceBefore: bigint;
}
export function parseRecoveryManifest(text: string): RecoveryManifest {
  const raw: unknown = JSON.parse(text);
  const manifest = parseManifest(raw);
  const hash = (raw as Record<string, unknown>).messageTransmitterCodeHash;
  if (
    typeof hash !== "string" ||
    !/^0x[\da-f]{64}$/i.test(hash) ||
    /^0x0{64}$/.test(hash)
  )
    throw Error(
      "Destination manifest needs a nonzero messageTransmitterCodeHash from trusted deployment evidence.",
    );
  return { manifest, transmitterHash: hash as Hex };
}
export async function sourceRecord(
  provider: Provider,
  manifest: Manifest,
  hash: Hex,
): Promise<BridgeRecord> {
  const rpc = client(provider);
  if ((await rpc.getChainId()) !== manifest.chainId)
    throw Error("Connect the source network to inspect the original burn.");
  const accounts = await provider.request({ method: "eth_accounts" });
  if (!accounts[0]) throw Error("Connect your external wallet first.");
  await verify(provider, manifest, accounts[0]);
  const receipt = await rpc.waitForTransactionReceipt({
    hash,
    confirmations: 2,
    timeout: 15000,
  });
  validateReceipt(receipt, hash);
  const tx = await rpc.getTransaction({ hash });
  if (tx.to?.toLowerCase() !== manifest.vault.toLowerCase())
    throw Error("Source transaction does not target the verified vault.");
  const decoded = decodeFunctionData({ abi: vaultAbi, data: tx.input });
  if (decoded.functionName !== "agentBridge")
    throw Error("Source transaction is not an agentBridge burn.");
  const [token, amount, domain, recipient, maxFee, finality] = decoded.args;
  const fromChain = testnetChainKeys[manifest.chainId];
  const toChain = Object.values(testnetChainKeys).find(
    (c) => CCTP_DOMAIN_IDS[c] === domain,
  );
  if (!fromChain || !toChain || fromChain === toChain)
    throw Error("Use two distinct supported testnet chains for CCTP recovery.");
  if (token.toLowerCase() !== USDC_CONTRACT[fromChain].toLowerCase())
    throw Error("Burn token is not native Circle USDC on the source testnet.");
  const configuredMessenger = await rpc.readContract({
    address: manifest.vault,
    abi: vaultAbi,
    functionName: "tokenMessenger",
  });
  if (
    configuredMessenger.toLowerCase() !==
    TOKEN_MESSENGER_V2[fromChain].toLowerCase()
  )
    throw Error(
      "Source vault is not configured with the official CCTP V2 testnet messenger.",
    );
  if (!/^0x0{24}/i.test(recipient))
    throw Error("Destination recipient must be a padded EVM vault address.");
  if (finality !== 1000 && finality !== 2000)
    throw Error("Unsupported source finality threshold.");
  const record: BridgeRecord = {
    version: 1,
    id: hash,
    vault: manifest.vault,
    fromChain,
    toChain,
    recipient: ("0x" + recipient.slice(-40)) as Address,
    amount: String(amount),
    maxFee: String(maxFee),
    minFinalityThreshold: finality,
    createdAt: Date.now(),
    status: "burned",
    burnTxHash: hash,
  };
  const messages: Hex[] = [];
  for (const log of receipt.logs) {
    if (
      log.address.toLowerCase() !==
      MESSAGE_TRANSMITTER_V2[fromChain].toLowerCase()
    )
      continue;
    try {
      const event = decodeEventLog({
        abi: MessageSentEventAbi,
        data: log.data,
        topics: log.topics,
      });
      messages.push(validateMessage(record, event.args.message, false));
    } catch {
      /* Only an exactly bound Circle source message is accepted. */
    }
  }
  if (messages.length !== 1)
    throw Error(
      "Expected one matching official CCTP V2 source message. Inspect the original source receipt; do not repeat the burn.",
    );
  return { ...record, sourceMessage: messages[0] };
}
export async function attest(
  record: BridgeRecord,
): Promise<BridgeRecord | undefined> {
  if (!record.burnTxHash || !record.sourceMessage)
    throw Error("Inspect a confirmed source burn first.");
  const url = `https://iris-api-sandbox.circle.com/v2/messages/${CCTP_DOMAIN_IDS[record.fromChain]}?transactionHash=${record.burnTxHash}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "error",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (response.status === 404) return undefined;
    if (!response.ok)
      throw Error(
        `Circle attestation service returned HTTP ${response.status}.`,
      );
    const reader = response.body?.getReader();
    if (!reader) throw Error("Circle response has no body.");
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 262144) {
        await reader.cancel();
        throw Error("Circle response exceeded the size limit.");
      }
      chunks.push(part.value);
    }
    const joined = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      joined.set(chunk, offset);
      offset += chunk.length;
    }
    const raw: unknown = JSON.parse(new TextDecoder().decode(joined));
    if (typeof raw !== "object" || !raw)
      throw Error("Malformed Circle response.");
    const payload = raw as Record<string, unknown>;
    if (
      typeof payload.sourceTxHash !== "string" ||
      payload.sourceTxHash.toLowerCase() !== record.burnTxHash.toLowerCase() ||
      !Array.isArray(payload.messages) ||
      payload.messages.length > 100
    )
      throw Error(
        "Circle response has the wrong source transaction or malformed messages.",
      );
    const matches: BridgeRecord[] = [];
    for (const item of payload.messages) {
      if (typeof item !== "object" || !item)
        throw Error("Malformed Circle message entry.");
      const entry = item as Record<string, unknown>;
      if (
        entry.status === "pending" ||
        entry.status === "pending_confirmations"
      )
        continue;
      if (entry.status !== "complete")
        throw Error(
          "Circle reported an unsupported or error attestation status.",
        );
      if (entry.cctpVersion !== 2) continue;
      try {
        const message = validateMessage(record, entry.message, true),
          attestation = validateAttestation(entry.attestation);
        matches.push({
          ...record,
          status: "attested",
          message,
          attestation,
          nonce: messageNonce(message),
        });
      } catch {
        /* An unrelated message cannot authorize this burn. */
      }
    }
    if (matches.length > 1)
      throw Error(
        "Multiple bound attestations returned. Recovery requires one unambiguous message.",
      );
    if (
      matches.length === 0 &&
      payload.messages.some(
        (item) =>
          item &&
          typeof item === "object" &&
          (item as Record<string, unknown>).status === "complete",
      )
    )
      throw Error(
        "Completed attestation does not match the original immutable burn fields.",
      );
    return matches[0];
  } finally {
    clearTimeout(timer);
  }
}
export async function destinationChecks(
  provider: Provider,
  dest: RecoveryManifest,
  record: BridgeRecord,
  account: Address,
  allowUsed = false,
) {
  const m = dest.manifest;
  const chain = testnetChainKeys[m.chainId];
  if (
    chain !== record.toChain ||
    m.vault.toLowerCase() !== record.recipient.toLowerCase()
  )
    throw Error(
      "Destination chain and vault must exactly match the source burn recipient and domain.",
    );
  const { role } = await verify(provider, m, account);
  if (role !== "owner")
    throw Error(
      "Connect the destination vault owner to authorize receiving through ownerExecute.",
    );
  const rpc = client(provider),
    transmitter = MESSAGE_TRANSMITTER_V2[chain];
  const code = await rpc.getCode({ address: transmitter });
  if (
    !code ||
    code === "0x" ||
    keccak256(code).toLowerCase() !== dest.transmitterHash.toLowerCase()
  )
    throw Error(
      "Destination transmitter runtime hash does not match its manifest.",
    );
  const domain = await rpc.readContract({
    address: transmitter,
    abi: MessageTransmitterV2Abi,
    functionName: "localDomain",
  });
  if (domain !== CCTP_DOMAIN_IDS[chain])
    throw Error("Destination CCTP local domain mismatch.");
  if (!record.message || !record.attestation)
    throw Error("Fetch a matching Circle attestation first.");
  const message = validateMessage(record, record.message, true);
  validateAttestation(record.attestation);
  const used = await rpc.readContract({
    address: transmitter,
    abi: MessageTransmitterV2Abi,
    functionName: "usedNonces",
    args: [messageNonce(message)],
  });
  if (used !== 0n && !allowUsed)
    throw Error(
      "This CCTP nonce is already used. Inspect the destination balance and existing mint receipt; do not submit again.",
    );
  return { rpc, transmitter, message, used };
}
export async function prepareMint(
  provider: Provider,
  destination: RecoveryManifest,
  record: BridgeRecord,
  account: Address,
): Promise<RecoveryDraft> {
  const { rpc, transmitter, message } = await destinationChecks(
    provider,
    destination,
    record,
    account,
  );
  const receiveData = encodeFunctionData({
    abi: MessageTransmitterV2Abi,
    functionName: "receiveMessage",
    args: [message, record.attestation!],
  });
  const op = operation(
    "ownerExecute",
    [transmitter, 0n, receiveData],
    "Receive CCTP transfer",
    {
      Amount: `${formatUnits(BigInt(record.amount), 6)} USDC before executed bridge fee`,
      Recipient: destination.manifest.vault,
      "Destination chain": String(destination.manifest.chainId),
      "Source hash": record.burnTxHash!,
      "CCTP nonce": record.nonce ?? messageNonce(message),
      Permission:
        "Owner-authorized receiving only; no new burn or token approval",
    },
  );
  await rpc.call({ account, to: destination.manifest.vault, data: op.data });
  const gas = await rpc.estimateGas({
    account,
    to: destination.manifest.vault,
    data: op.data,
  });
  const price = await rpc.getGasPrice();
  const balanceBefore = await rpc.readContract({
    address: USDC_CONTRACT[record.toChain],
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [destination.manifest.vault],
  });
  return {
    record,
    destination,
    account,
    op,
    fee: formatUnits(gas * price, 18),
    balanceBefore,
  };
}
export function paddedRecipient(vault: Address) {
  return pad(vault, { size: 32 });
}
