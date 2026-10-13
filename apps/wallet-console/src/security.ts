import {
  getAddress,
  isAddress,
  parseUnits,
  type Address,
  type Hex,
} from "viem";
export type Role = "owner" | "operator" | "observer";
export interface Asset {
  address: Address;
  symbol: string;
  decimals: number;
  aToken?: Address;
}
export interface Manifest {
  chainId: number;
  vault: Address;
  runtimeCodeHash: Hex;
  securityVersion: 1;
  assets: Asset[];
  deploymentEvidence?: string;
}
export const chains = {
  84532: { name: "Base Sepolia", explorer: "https://sepolia.basescan.org" },
  11155111: {
    name: "Ethereum Sepolia",
    explorer: "https://sepolia.etherscan.io",
  },
  421614: { name: "Arbitrum Sepolia", explorer: "https://sepolia.arbiscan.io" },
  11155420: {
    name: "OP Sepolia",
    explorer: "https://sepolia-optimism.etherscan.io",
  },
} as const;
export function address(value: string, label = "address"): Address {
  if (!isAddress(value) || /^0x0{40}$/i.test(value))
    throw Error(`Enter a valid ${label} (nonzero Ethereum address).`);
  return getAddress(value);
}
export function amount(value: string, decimals: number): bigint {
  if (
    !/^\d+(\.\d+)?$/.test(value) ||
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 36
  )
    throw Error("Use a plain positive amount.");
  if ((value.split(".")[1]?.length ?? 0) > decimals)
    throw Error(
      `Use at most ${decimals} decimal places; amounts are never rounded.`,
    );
  const parsed = parseUnits(value, decimals);
  if (parsed <= 0n) throw Error("Amount must be greater than zero.");
  if (parsed >= 2n ** 256n) throw Error("Amount exceeds the contract limit.");
  return parsed;
}
export function integer(
  value: string,
  label: string,
  max = 2n ** 256n - 1n,
): bigint {
  if (!/^\d+$/.test(value)) throw Error(`${label} must be a whole number.`);
  const n = BigInt(value);
  if (n > max) throw Error(`${label} is too large.`);
  return n;
}
export function parseManifest(value: unknown): Manifest {
  if (typeof value !== "object" || !value)
    throw Error("Manifest must be a JSON object.");
  const v = value as Record<string, unknown>;
  if (v.securityVersion !== 1)
    throw Error("Only security version 1 is supported.");
  if (typeof v.chainId !== "number" || !(v.chainId in chains))
    throw Error(
      "Mainnet is gated. Supply an independently verified deployment and audit release manifest through the release process; this console currently supports testnets only.",
    );
  if (
    typeof v.runtimeCodeHash !== "string" ||
    !/^0x[\da-f]{64}$/i.test(v.runtimeCodeHash) ||
    /^0x0{64}$/.test(v.runtimeCodeHash)
  )
    throw Error("Runtime code hash must be a nonzero 32-byte hex hash.");
  if (typeof v.vault !== "string")
    throw Error("Manifest requires a vault address.");
  if (!Array.isArray(v.assets) || v.assets.length > 30)
    throw Error("Manifest requires an assets array (maximum 30).");
  const assets = v.assets.map((item: unknown): Asset => {
    if (typeof item !== "object" || !item) throw Error("Invalid asset.");
    const a = item as Record<string, unknown>;
    if (
      typeof a.address !== "string" ||
      typeof a.symbol !== "string" ||
      !/^[-a-zA-Z0-9]{1,12}$/.test(a.symbol) ||
      typeof a.decimals !== "number" ||
      !Number.isInteger(a.decimals) ||
      a.decimals < 0 ||
      a.decimals > 36
    )
      throw Error("Each asset needs address, symbol and decimals (0–36).");
    return {
      address: address(a.address, "token"),
      symbol: a.symbol,
      decimals: a.decimals,
      ...(typeof a.aToken === "string"
        ? { aToken: address(a.aToken, "aToken") }
        : {}),
    };
  });
  if (
    new Set(assets.map((a) => a.address.toLowerCase())).size !== assets.length
  )
    throw Error("Duplicate token addresses.");
  return {
    chainId: v.chainId,
    vault: address(v.vault, "vault"),
    runtimeCodeHash: v.runtimeCodeHash as Hex,
    securityVersion: 1,
    assets,
    ...(typeof v.deploymentEvidence === "string"
      ? { deploymentEvidence: v.deploymentEvidence }
      : {}),
  };
}
export function validateReceipt(
  receipt: { status: string; transactionHash?: Hex },
  expectedHash?: Hex,
): void {
  if (
    expectedHash &&
    receipt.transactionHash?.toLowerCase() !== expectedHash.toLowerCase()
  )
    throw Error(
      "RPC returned a receipt for a different transaction. Keep the submitted hash and inspect it; no success was recorded.",
    );
  if (receipt.status !== "success")
    throw Error(
      "Transaction reverted on-chain. No success was recorded. Check the transaction in the explorer.",
    );
}
export function allowWrite(
  role: Role,
  method: string,
  verified: boolean,
  demo: boolean,
): void {
  if (demo) throw Error("Demo signing is disabled.");
  if (!verified) throw Error("Verify a deployment before signing.");
  if (role === "observer")
    throw Error("This wallet is neither the owner nor an active operator.");
  if (!method.startsWith("agent") && role !== "owner")
    throw Error("Only the owner can change permissions or approve requests.");
}
