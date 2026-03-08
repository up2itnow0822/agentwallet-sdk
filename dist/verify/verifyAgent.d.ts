/**
 * verifyAgent — Agent Trust Bundle
 *
 * Generates a cryptographically signed trust bundle that proves:
 * - The agent's DID (permanent, derived from private key)
 * - The agent's wallet address (onchain)
 * - The agent's staking balance in the AgentStakingPool
 * - A reputation score (0-100) based on observable onchain data
 * - TaskBridge task completion count (if API URL provided)
 * - Wallet age in days
 *
 * The bundle is signed by the agent's DID, making it tamper-proof.
 * Any third party can call verifyTrustBundle() to confirm authenticity.
 */
import { type Hex, type Address } from 'viem';
export type SupportedChain = 'base' | 'arbitrum';
export interface AgentTrustBundle {
    did: string;
    walletAddress: Address;
    stakingBalance: bigint;
    reputationScore: number;
    taskBridgeTasksCompleted: number;
    walletAgeDays: number;
    verifiedAt: number;
    signature: string;
}
export interface VerifyAgentParams {
    privateKey: Hex;
    chain: SupportedChain;
    taskBridgeApiUrl?: string;
}
/**
 * Generate a complete trust bundle for an agent.
 * Fetches real onchain data for staking balance and wallet age.
 */
export declare function verifyAgent(params: VerifyAgentParams): Promise<AgentTrustBundle>;
/**
 * Verify a trust bundle was signed by the claimed DID.
 * Returns true if signature is valid.
 */
export declare function verifyTrustBundle(bundle: AgentTrustBundle): boolean;
//# sourceMappingURL=verifyAgent.d.ts.map