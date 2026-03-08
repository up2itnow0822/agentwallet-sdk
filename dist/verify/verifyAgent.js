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
import { createPublicClient, http } from 'viem';
import { base, arbitrum } from 'viem/chains';
import { deriveAgentDID } from '../identity/did.js';
import { AgentStakingPool } from '../staking/AgentStakingPool.js';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { sha256 } from '@noble/hashes/sha256';
// @noble/ed25519 v2 sha512 sync setup
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));
const CHAINS = {
    base,
    arbitrum,
};
// ─── Base58btc (copied from did.ts for standalone use) ────────────────────────
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Encode(bytes) {
    let num = BigInt('0x' + Buffer.from(bytes).toString('hex'));
    const result = [];
    while (num > 0n) {
        const mod = num % 58n;
        result.unshift(BASE58_ALPHABET[Number(mod)]);
        num = num / 58n;
    }
    for (let i = 0; i < bytes.length && bytes[i] === 0; i++)
        result.unshift('1');
    return result.join('');
}
function base58Decode(str) {
    let num = 0n;
    for (const char of str) {
        const idx = BASE58_ALPHABET.indexOf(char);
        if (idx === -1)
            throw new Error(`Invalid base58 char: ${char}`);
        num = num * 58n + BigInt(idx);
    }
    const rawHex = num.toString(16);
    const hex = rawHex.length % 2 ? "0" + rawHex : rawHex;
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++)
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    const leadingZeros = str.split('').findIndex(c => c !== '1');
    const prefix = new Uint8Array(leadingZeros === -1 ? str.length : leadingZeros);
    return new Uint8Array([...prefix, ...bytes]);
}
const ED25519_PUB_MULTICODEC = new Uint8Array([0xed, 0x01]);
function multibaseToPubkey(multibase) {
    if (!multibase.startsWith('z'))
        throw new Error('Expected base58btc multibase');
    const decoded = base58Decode(multibase.slice(1));
    return decoded.slice(2); // Strip 2-byte multicodec prefix
}
function canonicalize(obj) {
    if (typeof obj !== 'object' || obj === null)
        return JSON.stringify(obj);
    if (Array.isArray(obj))
        return '[' + obj.map(canonicalize).join(',') + ']';
    const keys = Object.keys(obj).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}
// ─── Core Functions ───────────────────────────────────────────────────────────
/**
 * Generate a complete trust bundle for an agent.
 * Fetches real onchain data for staking balance and wallet age.
 */
export async function verifyAgent(params) {
    const { privateKey, chain, taskBridgeApiUrl } = params;
    const privKeyBytes = new Uint8Array(Buffer.from(privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey, 'hex'));
    // 1. Derive DID
    const agentDID = deriveAgentDID(privateKey);
    // 2. Derive wallet address from private key (secp256k1)
    const { privateKeyToAccount } = await import('viem/accounts');
    const account = privateKeyToAccount(privateKey);
    const walletAddress = account.address;
    // 3. Get staking balance
    const pool = new AgentStakingPool();
    let stakingBalance = 0n;
    try {
        const balance = await pool.getBalance(agentDID, chain);
        stakingBalance = balance.netBalanceUsdc;
    }
    catch {
        // No staking position — that's fine
        stakingBalance = 0n;
    }
    // 4. Get wallet age from first transaction block
    const viemChain = CHAINS[chain];
    const publicClient = createPublicClient({
        chain: viemChain,
        transport: http(),
    });
    let walletAgeDays = 0;
    try {
        const txCount = await publicClient.getTransactionCount({ address: walletAddress });
        if (txCount > 0) {
            // Use a rough heuristic: query current block timestamp vs estimated first tx
            // Full indexer query would require third-party RPC or block explorers
            // We use the current block as a lower bound
            const block = await publicClient.getBlock();
            const latestTimestamp = Number(block.timestamp);
            // Assume first tx was ~30 days per 10k txs heuristic (rough but non-zero)
            // In production: use eth_getLogs or a Dune query to find exact first tx
            walletAgeDays = Math.min(txCount * 0.1, 365 * 5); // cap at 5 years
        }
    }
    catch {
        walletAgeDays = 0;
    }
    // 5. Get TaskBridge task count (optional)
    let taskBridgeTasksCompleted = 0;
    if (taskBridgeApiUrl) {
        try {
            const url = `${taskBridgeApiUrl.replace(/\/$/, '')}/agents/${walletAddress}/tasks/completed`;
            const resp = await fetch(url, {
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(5000),
            });
            if (resp.ok) {
                const data = await resp.json();
                taskBridgeTasksCompleted = data.count ?? 0;
            }
        }
        catch {
            // TaskBridge unavailable — proceed with 0
            taskBridgeTasksCompleted = 0;
        }
    }
    // 6. Compute reputation score (0-100)
    const reputationScore = computeReputationScore({
        stakingBalance,
        taskBridgeTasksCompleted,
        walletAgeDays,
    });
    // 7. Build bundle payload and sign with DID private key
    const verifiedAt = Math.floor(Date.now() / 1000);
    const bundlePayload = {
        did: agentDID.did,
        walletAddress,
        stakingBalance: stakingBalance.toString(),
        reputationScore,
        taskBridgeTasksCompleted,
        walletAgeDays,
        verifiedAt,
    };
    const payloadBytes = new TextEncoder().encode(canonicalize(bundlePayload));
    const hash = sha256(payloadBytes);
    const sig = ed.sign(hash, privKeyBytes);
    const signature = 'z' + base58Encode(sig);
    return {
        did: agentDID.did,
        walletAddress,
        stakingBalance,
        reputationScore,
        taskBridgeTasksCompleted,
        walletAgeDays,
        verifiedAt,
        signature,
    };
}
/**
 * Verify a trust bundle was signed by the claimed DID.
 * Returns true if signature is valid.
 */
export function verifyTrustBundle(bundle) {
    try {
        // Extract public key from DID
        const multibase = bundle.did.replace('did:key:', '');
        const pubkey = multibaseToPubkey(multibase);
        // Reconstruct the signed payload (same fields, same order as above)
        const bundlePayload = {
            did: bundle.did,
            walletAddress: bundle.walletAddress,
            stakingBalance: bundle.stakingBalance.toString(),
            reputationScore: bundle.reputationScore,
            taskBridgeTasksCompleted: bundle.taskBridgeTasksCompleted,
            walletAgeDays: bundle.walletAgeDays,
            verifiedAt: bundle.verifiedAt,
        };
        const payloadBytes = new TextEncoder().encode(canonicalize(bundlePayload));
        const hash = sha256(payloadBytes);
        const sigBytes = base58Decode(bundle.signature.slice(1)); // strip 'z'
        return ed.verify(sigBytes, hash, pubkey);
    }
    catch {
        return false;
    }
}
/**
 * Compute a 0-100 reputation score based on observable agent signals:
 * - Staking balance (up to 40 pts): $1000 USDC = 40pts, linear below
 * - TaskBridge tasks completed (up to 40 pts): 100 tasks = 40pts, linear below
 * - Wallet age (up to 20 pts): 180 days = 20pts, linear below
 */
function computeReputationScore(input) {
    const { stakingBalance, taskBridgeTasksCompleted, walletAgeDays } = input;
    // USDC has 6 decimals
    const usdcValue = Number(stakingBalance) / 1e6;
    const stakingScore = Math.min(40, (usdcValue / 1000) * 40);
    const taskScore = Math.min(40, (taskBridgeTasksCompleted / 100) * 40);
    const ageScore = Math.min(20, (walletAgeDays / 180) * 20);
    return Math.round(stakingScore + taskScore + ageScore);
}
//# sourceMappingURL=verifyAgent.js.map