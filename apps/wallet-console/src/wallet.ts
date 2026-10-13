import {
  createPublicClient,
  custom,
  encodeFunctionData,
  keccak256,
  toHex,
  decodeEventLog,
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
  for (let id = start; id < pendingTotal; id++) {
    const p = await rpc.readContract({
      ...base,
      functionName: "getPending",
      args: [id],
    });
    if (!p.executed && !p.cancelled) pending.push({ id, ...p });
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
  op: Operation,
  onSubmitted: (hash: Hex) => void,
): Promise<{ hash: Hex; queuedId?: bigint }> {
  const { role } = await verify(provider, manifest, account);
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
  const gas = await rpc.estimateGas({
    account,
    to: manifest.vault,
    data: op.data,
  });
  // External wallet controls signing. Application never sees a private key or signature.
  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: account,
        to: manifest.vault,
        data: op.data,
        gas: toHex(gas),
        chainId: toHex(manifest.chainId),
      },
    ],
  });
  onSubmitted(hash);
  const receipt = await rpc.waitForTransactionReceipt({
    hash,
    confirmations: 2,
    timeout: 180000,
  });
  validateReceipt(receipt, hash);
  let queuedId: bigint | undefined;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== manifest.vault.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: vaultAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "TransactionQueued")
        queuedId = decoded.args.txId;
    } catch {
      /* Other contracts may emit unrelated events. */
    }
  }
  return { hash, queuedId };
}
export function explain(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/reject|denied|4001/i.test(raw))
    return "Wallet request declined. No transaction was sent.";
  return raw.length > 650 ? raw.slice(0, 650) + "…" : raw;
}
