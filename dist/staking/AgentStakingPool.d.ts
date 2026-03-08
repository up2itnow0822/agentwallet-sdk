/**
 * AgentStakingPool — Agent-Only AAVE V3 USDC Staking Wrapper
 *
 * Wraps AAVE V3's USDC supply/withdraw pool with:
 * - Agent-only access enforced via DID verification
 * - 0.5% annualized management fee deducted from yield before distribution
 * - Non-custodial: AAVE holds all assets, we just wrap the interaction
 *
 * AAVE V3 Pool addresses:
 *   Base:     0xA238Dd80C259a72e81d7e4664a9801593F98d1c5
 *   Arbitrum: 0x794a61358D6845594F94dc1DB02A252b5b4814aD
 *
 * USDC addresses:
 *   Base:     0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 *   Arbitrum: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
 */
import { type WalletClient, type Address, type Hash } from 'viem';
import type { AgentDID } from '../identity/did.js';
export type SupportedStakingChain = 'base' | 'arbitrum';
export interface DepositResult {
    txHash: Hash;
    agentDID: string;
    amountUsdc: bigint;
    chain: SupportedStakingChain;
    depositedAt: number;
}
export interface WithdrawResult {
    txHash: Hash;
    agentDID: string;
    amountUsdc: bigint;
    managementFeeUsdc: bigint;
    chain: SupportedStakingChain;
    withdrawnAt: number;
}
export interface StakingBalance {
    agentDID: string;
    principalUsdc: bigint;
    aUsdcBalance: bigint;
    yieldEarned: bigint;
    managementFeeAccrued: bigint;
    netBalanceUsdc: bigint;
    chain: SupportedStakingChain;
}
export interface DepositParams {
    agentDID: AgentDID;
    amountUsdc: bigint;
    walletClient: WalletClient;
    chain: SupportedStakingChain;
}
export interface WithdrawParams {
    agentDID: AgentDID;
    amountUsdc: bigint;
    walletClient: WalletClient;
    chain: SupportedStakingChain;
}
declare const AAVE_POOL_ADDRESS: Record<SupportedStakingChain, Address>;
declare const USDC_ADDRESS: Record<SupportedStakingChain, Address>;
declare const AUSDC_ADDRESS: Record<SupportedStakingChain, Address>;
/** Fee placeholder — replace with multisig before mainnet launch */
declare const FEE_COLLECTOR: Address;
export declare class AgentStakingPool {
    /**
     * Deposit USDC into AAVE V3.
     * AGENTS ONLY — verifyAgentOnly enforced on every call.
     */
    deposit(params: DepositParams): Promise<DepositResult>;
    /**
     * Withdraw USDC + yield from AAVE V3.
     * Management fee is deducted from yield before releasing to agent.
     */
    withdraw(params: WithdrawParams): Promise<WithdrawResult>;
    /**
     * Get current staking balance (principal + yield - management fee).
     */
    getBalance(agentDID: AgentDID, chain: SupportedStakingChain): Promise<StakingBalance>;
    /**
     * Verify that the caller is an AI agent, not a human.
     *
     * Enforcement logic:
     * 1. The agentDID must be a valid did:key derived via our deterministic derivation
     * 2. The DID's encoded public key must match a key that can sign for the wallet address
     *
     * Humans cannot spoof this because:
     * - Deriving a valid AgentDID requires access to the private key in raw hex form
     * - The wallet's signing key must match the DID's public key
     * - This creates a cryptographic binding: same private key → wallet + DID
     *
     * In practice, AI agents running our SDK have access to their private key programmatically.
     * Human users of typical EOA wallets (MetaMask, hardware wallets) cannot expose their
     * private key in the required format to derive the DID.
     */
    private verifyAgentOnly;
    /**
     * Calculate management fee: 0.5% annualized.
     * Formula: principal * 50 / 10000 * daysStaked / 365
     */
    private calculateManagementFee;
}
export { FEE_COLLECTOR, AAVE_POOL_ADDRESS, USDC_ADDRESS, AUSDC_ADDRESS };
//# sourceMappingURL=AgentStakingPool.d.ts.map