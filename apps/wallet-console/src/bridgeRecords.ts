import { chains, type Manifest } from "./security";
import type { Hex } from "viem";
export type BridgeStatus =
  | "Submitted"
  | "Source confirmed"
  | "Source reverted"
  | "Receipt unresolved"
  | "Mint submitted"
  | "Mint unresolved"
  | "Destination confirmed"
  | "Destination reverted";
export interface BridgeSourceRecord {
  hash: Hex;
  chainId: number;
  vault: Hex;
  createdAt: string;
  status: BridgeStatus;
  mintHash?: Hex;
  destinationChainId?: number;
  amount: string;
  destinationDomain: string;
  recipient: string;
}
export const bridgeStorageKey = "agentwallet-bridge-sources-v1";
export function readBridgeSources(): BridgeSourceRecord[] {
  try {
    const text = localStorage.getItem(bridgeStorageKey) ?? "[]";
    if (text.length > 200000) return [];
    const value: unknown = JSON.parse(text);
    if (!Array.isArray(value)) return [];
    const records: BridgeSourceRecord[] = [];
    for (const item of value.slice(0, 100)) {
      if (typeof item !== "object" || !item) continue;
      const v = item as Record<string, unknown>;
      if (
        typeof v.hash !== "string" ||
        !/^0x[\da-f]{64}$/i.test(v.hash) ||
        typeof v.chainId !== "number" ||
        !(v.chainId in chains) ||
        typeof v.vault !== "string" ||
        !/^0x[\da-f]{40}$/i.test(v.vault) ||
        typeof v.createdAt !== "string" ||
        v.createdAt.length > 64 ||
        typeof v.amount !== "string" ||
        v.amount.length > 128 ||
        typeof v.destinationDomain !== "string" ||
        v.destinationDomain.length > 32 ||
        typeof v.recipient !== "string" ||
        v.recipient.length > 66 ||
        ![
          "Submitted",
          "Source confirmed",
          "Source reverted",
          "Receipt unresolved",
          "Mint submitted",
          "Mint unresolved",
          "Destination confirmed",
          "Destination reverted",
        ].includes(String(v.status))
      )
        continue;
      records.push({
        hash: v.hash as Hex,
        chainId: v.chainId,
        vault: v.vault as Hex,
        createdAt: v.createdAt,
        status: v.status as BridgeStatus,
        amount: v.amount,
        destinationDomain: v.destinationDomain,
        recipient: v.recipient,
        ...(typeof v.mintHash === "string" &&
        /^0x[\da-f]{64}$/i.test(v.mintHash)
          ? { mintHash: v.mintHash as Hex }
          : {}),
        ...(typeof v.destinationChainId === "number" &&
        v.destinationChainId in chains
          ? { destinationChainId: v.destinationChainId }
          : {}),
      });
    }
    return records;
  } catch {
    return [];
  }
}
export function saveBridgeSource(
  manifest: Manifest,
  hash: Hex,
  details: Record<string, string>,
): BridgeSourceRecord[] {
  const existing = readBridgeSources();
  const record: BridgeSourceRecord = {
    hash,
    chainId: manifest.chainId,
    vault: manifest.vault,
    createdAt: new Date().toISOString(),
    status: "Submitted",
    amount: details.Amount ?? "",
    destinationDomain: details["Destination domain"] ?? "",
    recipient: details.Recipient ?? "",
  };
  const next = [record, ...existing.filter((r) => r.hash !== hash)].slice(
    0,
    100,
  );
  localStorage.setItem(bridgeStorageKey, JSON.stringify(next));
  return next;
}
export function updateBridgeSource(
  hash: Hex,
  status: BridgeStatus,
): BridgeSourceRecord[] {
  const next = readBridgeSources().map((r) =>
    r.hash === hash ? { ...r, status } : r,
  );
  localStorage.setItem(bridgeStorageKey, JSON.stringify(next));
  return next;
}
export function saveMintSource(
  source: Hex,
  mintHash: Hex,
  destinationChainId: number,
  status: BridgeStatus,
): BridgeSourceRecord[] {
  const next = readBridgeSources().map((r) =>
    r.hash.toLowerCase() === source.toLowerCase()
      ? { ...r, mintHash, destinationChainId, status }
      : r,
  );
  localStorage.setItem(bridgeStorageKey, JSON.stringify(next));
  return next;
}
