import type { Address, Chain, Hash, PublicClient, WalletClient } from 'viem';
export const CHAIN_IDS = {base:8453,'base-sepolia':84532,ethereum:1,'ethereum-sepolia':11155111,arbitrum:42161,'arbitrum-sepolia':421614,optimism:10,'optimism-sepolia':11155420,polygon:137} as const;
export type SupportedChain = keyof typeof CHAIN_IDS;
export type VaultOperation = 'agentExecute'|'agentTransferToken'|'agentSwap'|'agentSupply'|'agentWithdraw'|'agentBridge';
export interface VaultContract {
  read: Record<string, (args?: readonly unknown[]) => Promise<unknown>>;
  write: Record<string, (args: readonly unknown[], options?: unknown) => Promise<Hash>>;
}
export interface AgentWallet {
  readonly address: Address;
  readonly chain: Chain;
  readonly publicClient: PublicClient;
  readonly walletClient: WalletClient;
  readonly contract: VaultContract;
  readonly expectedCodeHash: Hash;
  readonly confirmations: number;
  readonly deploymentBlock?: bigint;
  /** Owner configuration, not proof an independent audit occurred. */
  readonly mainnetAuthorized?: boolean;
}
export interface WalletConfig {
  accountAddress: Address; expectedCodeHash: Hash; chain: SupportedChain; walletClient: WalletClient;
  publicClient?: PublicClient; rpcUrl?: string; confirmations?: number; deploymentBlock?: bigint; mainnetAuthorized?: boolean;
}
