/** Guarded AAVE operations. Configuration must describe the owner's verified deployments. */
import { isAddress, zeroAddress, erc20Abi, parseAbi, type Address } from 'viem';
import type { AgentWallet } from '../types.js';
import { executeVaultOperation } from '../wallet/execution.js';
export interface StakingDeployment { token: Address; aToken: Address }
export interface DepositParams { wallet: AgentWallet; amount: bigint }
export type WithdrawParams = DepositParams;
export type DepositResult = Awaited<ReturnType<typeof executeVaultOperation>>;
export type WithdrawResult = DepositResult;
export interface StakingBalance { walletAddress: Address; chainId: number; token: Address; aToken: Address; blockNumber: bigint; principal: bigint; balance: bigint; yieldEarned: bigint; principalShortfall: bigint }
const principalAbi = parseAbi(['function stakingPrincipal(address token) view returns (uint256)']);
export class AgentStakingPool {
  readonly deployment: Readonly<StakingDeployment>;
  constructor(deployment?: StakingDeployment) {
    if (!deployment || !isAddress(deployment.token) || !isAddress(deployment.aToken) || deployment.token.toLowerCase() === zeroAddress || deployment.aToken.toLowerCase() === zeroAddress || deployment.token.toLowerCase() === deployment.aToken.toLowerCase()) throw new Error('Provide explicit nonzero token and aToken deployments for the guarded vault');
    this.deployment = Object.freeze({...deployment});
  }
  async deposit(params: DepositParams): Promise<DepositResult> {
    this.validate(params);
    return executeVaultOperation(params.wallet,'agentSupply',[this.deployment.token,params.amount]);
  }
  /** Redemption proceeds remain in the vault. This SDK charges no management fee. */
  async withdraw(params: WithdrawParams): Promise<WithdrawResult> {
    this.validate(params);
    return executeVaultOperation(params.wallet,'agentWithdraw',[this.deployment.token,params.amount]);
  }
  /** A single block snapshot, with no local principal tracker or assumed APY. */
  async getBalance(wallet: AgentWallet): Promise<StakingBalance> {
    if (!wallet?.publicClient || !wallet.address || !wallet.chain) throw new Error('Migrate to an AgentWallet backed by a guarded vault');
    if (await wallet.publicClient.getChainId() !== wallet.chain.id) throw new Error('Staking provider chain mismatch');
    const blockNumber = await wallet.publicClient.getBlockNumber();
    const [balance,principal] = await Promise.all([
      wallet.publicClient.readContract({address:this.deployment.aToken,abi:erc20Abi,functionName:'balanceOf',args:[wallet.address],blockNumber}),
      wallet.publicClient.readContract({address:wallet.address,abi:principalAbi,functionName:'stakingPrincipal',args:[this.deployment.token],blockNumber}),
    ]);
    return {walletAddress:wallet.address,chainId:wallet.chain.id,...this.deployment,blockNumber,balance,principal,yieldEarned:balance > principal ? balance-principal : 0n,principalShortfall:principal > balance ? principal-balance : 0n};
  }
  private validate(params: DepositParams): void {
    if (!params?.wallet?.publicClient || !params.wallet.walletClient || !params.wallet.contract || !params.wallet.expectedCodeHash) throw new Error('Raw walletClient staking is removed. Migrate to an AgentWallet backed by a guarded vault');
    if (typeof params.amount !== 'bigint' || params.amount <= 0n || params.amount >= 2n**256n) throw new Error('Staking amount must be a positive uint256 bigint in token base units');
  }
}
