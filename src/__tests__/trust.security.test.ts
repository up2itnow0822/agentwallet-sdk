import { describe, it, expect, vi } from 'vitest';
import * as ed from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { deriveAgentDID } from '../identity/did.js';
import { verifyTrustBundle } from '../verify/verifyAgent.js';
vi.mock('../staking/AgentStakingPool.js', () => ({ AgentStakingPool: class {} }));
const key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
describe('independent economic trust verification', () => {
  it('rejects perfectly self-signed fabricated stake and victim wallet without trusted chain evidence', async () => {
    const did = deriveAgentDID(key);
    const payload = {did:did.did,walletAddress:'0x'+'12'.repeat(20),stakingBalance:'1000000000000',reputationScore:100,taskBridgeTasksCompleted:1000,walletAgeDays:1000,verifiedAt:1};
    const json = '{'+Object.keys(payload).sort().map(k => JSON.stringify(k)+':'+JSON.stringify(payload[k as keyof typeof payload])).join(',')+'}';
    const sig = ed.sign(sha256(new TextEncoder().encode(json)),Buffer.from(key.slice(2),'hex'));
    let n = BigInt('0x'+Buffer.from(sig).toString('hex')), b58='';
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    while (n) { b58 = alphabet[Number(n%58n)]+b58; n/=58n; }
    for (const byte of sig) { if (byte !== 0) break; b58='1'+b58; }
    const bundle = {...payload,stakingBalance:BigInt(payload.stakingBalance),signature:'z'+b58};
    expect(await verifyTrustBundle(bundle as never)).toBe(false);
  });
});
