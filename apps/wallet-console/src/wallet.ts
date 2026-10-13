import {
  createPublicClient,
  custom,
  encodeFunctionData,
  keccak256,
  formatUnits,
  type Address,
  type Hex,
  type EIP1193Provider,
} from "viem";
import { vaultAbi, erc20Abi } from "./abi";
import {
  allowWrite,
  validateReceipt,
  type Manifest,
  type Role,
} from "./security";
import {
  broadcastIntent, reconcileIntent, walletRejected, type IntentMeta, type PublicIntent,
} from "./intents";
export type Provider = EIP1193Provider;
declare global {
  interface Window {
    ethereum?: Provider;
  }
}
export interface Operation {
  method: string;
  data: Hex;
  title: string;
  details: Record<string, string>;
  ownerOnly?: boolean;
}
export interface PreparedOperation extends Operation {
  readonly binding: Readonly<{
    chainId: number;
    vault: Address;
    runtimeCodeHash: Hex;
    signer: Address;
    dataHash: Hex;
    provider?: Provider;
  }>;
}
export function bindOperation(op: Operation, manifest: Manifest, signer: Address, provider?: Provider): PreparedOperation {
  return Object.freeze({
    ...op, details: Object.freeze({ ...op.details }),
    binding: Object.freeze({ chainId: manifest.chainId, vault: manifest.vault,
      runtimeCodeHash: manifest.runtimeCodeHash, signer, dataHash: keccak256(op.data), provider }),
  });
}
function assertPrepared(op: PreparedOperation, manifest: Manifest, signer: Address, provider: Provider) {
  const original = op.binding;
  if (!original || original.chainId !== manifest.chainId ||
    original.vault.toLowerCase() !== manifest.vault.toLowerCase() ||
    original.runtimeCodeHash.toLowerCase() !== manifest.runtimeCodeHash.toLowerCase() ||
    original.signer.toLowerCase() !== signer.toLowerCase() || original.provider !== provider ||
    original.dataHash !== keccak256(op.data))
    throw Error("The reviewed deployment, signer or prepared transaction context changed. Start a fresh review before signing.");
}
export interface Pending {
  id: bigint;
  to: Address;
  value: bigint;
  data: Hex;
  token: Address;
  amount: bigint;
  executed: boolean;
  cancelled: boolean;
  createdAt?: bigint;
  expiresAt?: bigint;
  policyEpoch?: bigint;
}
export interface Snapshot {
  account: Address;
  role: Role;
  block: bigint;
  native: bigint;
  paused: boolean;
  owner: Address;
  assets: {
    address: Address;
    symbol: string;
    decimals: number;
    balance: bigint;
    budget: bigint;
    perTx: bigint;
    periodLimit: bigint;
    periodLength: bigint;
    principal: bigint;
    aBalance?: bigint;
  }[];
  nativeBudget: bigint;
  pending: Pending[];
  pendingTotal: bigint;
  policyEpoch: bigint;
}
export function client(provider: Provider) {
  return createPublicClient({ transport: custom(provider) });
}
export async function verify(
  provider: Provider,
  manifest: Manifest,
  account: Address,
): Promise<{ role: Role; owner: Address }> {
  const rpc = client(provider);
  const chain = await rpc.getChainId();
  if (chain !== manifest.chainId)
    throw Error(
      `Wrong network. Switch your wallet to chain ${manifest.chainId}.`,
    );
  const accounts = await provider.request({ method: "eth_accounts" });
  if (accounts[0]?.toLowerCase() !== account.toLowerCase())
    throw Error("Wallet account changed. Reconnect and review again.");
  const code = await rpc.getCode({ address: manifest.vault });
  if (
    !code ||
    code === "0x" ||
    keccak256(code).toLowerCase() !== manifest.runtimeCodeHash.toLowerCase()
  )
    throw Error(
      "Vault runtime code does not match the supplied manifest. Signing is blocked.",
    );
  const version = await rpc.readContract({
    address: manifest.vault,
    abi: vaultAbi,
    functionName: "securityVersion",
  });
  if (version !== 1n) throw Error("Vault security version mismatch.");
  const owner = await rpc.readContract({
    address: manifest.vault,
    abi: vaultAbi,
    functionName: "owner",
  });
  const operator = await rpc.readContract({
    address: manifest.vault,
    abi: vaultAbi,
    functionName: "isOperatorActive",
    args: [account],
  });
  return {
    owner,
    role:
      owner.toLowerCase() === account.toLowerCase()
        ? "owner"
        : operator
          ? "operator"
          : "observer",
  };
}
export async function load(
  provider: Provider,
  manifest: Manifest,
  account: Address,
): Promise<Snapshot> {
  const rpc = client(provider);
  const { owner, role } = await verify(provider, manifest, account);
  const block = await rpc.getBlockNumber();
  const base = {
    address: manifest.vault,
    abi: vaultAbi,
    blockNumber: block,
  } as const;
  const [native, paused, nativeBudget, pendingTotal, policyEpoch] =
    await Promise.all([
      rpc.getBalance({ address: manifest.vault, blockNumber: block }),
      rpc.readContract({ ...base, functionName: "paused" }),
      rpc.readContract({
        ...base,
        functionName: "remainingBudget",
        args: ["0x0000000000000000000000000000000000000000"],
      }),
      rpc.readContract({ ...base, functionName: "pendingNonce" }),
      rpc.readContract({ ...base, functionName: "policyEpoch" }),
    ]);
  const assets = await Promise.all(
    manifest.assets.map(async (a) => {
      const [balance, decimals, budget, policy, principal, aBalance] =
        await Promise.all([
          rpc.readContract({
            address: a.address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [manifest.vault],
            blockNumber: block,
          }),
          rpc.readContract({
            address: a.address,
            abi: erc20Abi,
            functionName: "decimals",
            blockNumber: block,
          }),
          rpc.readContract({
            ...base,
            functionName: "remainingBudget",
            args: [a.address],
          }),
          rpc.readContract({
            ...base,
            functionName: "spendPolicies",
            args: [a.address],
          }),
          rpc.readContract({
            ...base,
            functionName: "stakingPrincipal",
            args: [a.address],
          }),
          a.aToken
            ? rpc.readContract({
                address: a.aToken,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [manifest.vault],
                blockNumber: block,
              })
            : undefined,
        ]);
      if (decimals !== a.decimals)
        throw Error(
          `${a.symbol} decimals differ from the manifest. Correct it before signing.`,
        );
      return {
        ...a,
        balance,
        budget,
        perTx: policy[0],
        periodLimit: policy[1],
        periodLength: policy[2],
        principal,
        aBalance,
      };
    }),
  );
  const pending: Pending[] = [];
  const start = pendingTotal > 50n ? pendingTotal - 50n : 0n;
  for (let first = start; first < pendingTotal; first += 5n) {
    const size = Number(pendingTotal - first < 5n ? pendingTotal - first : 5n);
    const group = await Promise.all(
      Array.from({ length: size }, async (_, offset) => {
        const id = first + BigInt(offset);
        const p = await rpc.readContract({
          ...base,
          functionName: "getPending",
          args: [id],
        });
        return { id, ...p };
      }),
    );
    for (const p of group)
      if (!p.executed && !p.cancelled) pending.push(p);
  }
  return {
    account,
    role,
    owner,
    block,
    native,
    paused,
    assets,
    nativeBudget,
    pending,
    pendingTotal,
    policyEpoch,
  };
}
// Complete calldata is prepared before the review. No arbitrary calldata input is exposed.
export function operation(
  method: string,
  args: readonly unknown[],
  title: string,
  details: Record<string, string>,
): Operation {
  const data = encodeFunctionData({
    abi: vaultAbi,
    functionName: method,
    args,
  } as Parameters<typeof encodeFunctionData>[0]);
  return {
    method,
    data,
    title,
    details,
    ownerOnly: !method.startsWith("agent"),
  };
}
export async function estimate(
  provider: Provider,
  manifest: Manifest,
  account: Address,
  op: Operation,
) {
  const rpc = client(provider);
  await rpc.call({ account, to: manifest.vault, data: op.data });
  const gas = await rpc.estimateGas({
    account,
    to: manifest.vault,
    data: op.data,
  });
  const gasPrice = await rpc.getGasPrice();
  return { gas, fee: formatUnits(gas * gasPrice, 18) };
}
export async function submit(
  provider: Provider,
  manifest: Manifest,
  account: Address,
  op: PreparedOperation,
  onSubmitted: (hash: Hex) => void,
  options: { kind?: "mint"; meta?: IntentMeta; assertCurrent?: () => void; onClaimed?: (intent: PublicIntent) => void } = {},
): Promise<{ hash: Hex; queuedId?: bigint }> {
  assertPrepared(op, manifest, account, provider);
  options.assertCurrent?.();
  const { role } = await verify(provider, manifest, account);
  options.assertCurrent?.();
  allowWrite(role, op.method, true, false);
  const rpc = client(provider);
  const paused = await rpc.readContract({
    address: manifest.vault,
    abi: vaultAbi,
    functionName: "paused",
  });
  if (paused && op.method.startsWith("agent"))
    throw Error("Vault is paused. Only owner controls are available.");
  await rpc.call({ account, to: manifest.vault, data: op.data });
  options.assertCurrent?.();
  const gas = await rpc.estimateGas({
    account,
    to: manifest.vault,
    data: op.data,
  });
  assertPrepared(op, manifest, account, provider);
  options.assertCurrent?.();
  // Persist the public reviewed identity before asking the external wallet to sign.
  // A lost provider response cannot establish that no transaction was broadcast.
  const { hash, intentId } = await broadcastIntent(provider, {
    kind: options.kind ?? (op.method === "agentBridge" ? "source" : "vault"),
    chainId: manifest.chainId, from: account, to: manifest.vault,
    data: op.data, gas, label: op.title,
    meta: {
      vaultRuntimeHash: manifest.runtimeCodeHash,
      ...(op.details.Amount ? { amount: op.details.Amount } : {}),
      ...(op.details.Recipient ? { recipient: op.details.Recipient } : {}),
      ...(op.details["Destination domain"] ? { destinationDomain: op.details["Destination domain"] } : {}),
      ...options.meta,
    },
    assertCurrent: options.assertCurrent,
    onClaimed: options.onClaimed,
  }, onSubmitted);
  const { receipt, intent } = await reconcileIntent(provider, intentId, hash);
  validateReceipt(receipt, hash);
  return { hash, ...(intent.queueId !== undefined ? { queuedId: BigInt(intent.queueId) } : {}) };
}
export function explain(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (walletRejected(error))
    return "Wallet request declined. No transaction was sent.";
  return raw.length > 650 ? raw.slice(0, 650) + "…" : raw;
}
