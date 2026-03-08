import { describe, it, expect } from 'vitest';
import { AgentStakingPool } from '../staking/AgentStakingPool.js';
import { deriveAgentDID } from '../identity/did.js';

const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

describe('AgentStakingPool', () => {
  const pool = new AgentStakingPool();
  const agentDID = deriveAgentDID(TEST_PRIVATE_KEY);

  it('rejects deposit with invalid DID format', async () => {
    const badDID = {
      did: 'did:web:example.com',
      publicKeyHex: 'a'.repeat(64),
      publicKeyMultibase: 'z6MkFake',
    };

    const mockWallet = {
      account: { address: '0x1234567890123456789012345678901234567890' },
      writeContract: async () => '0xhash',
    } as any;

    await expect(pool.deposit({
      agentDID: badDID,
      amountUsdc: 1000000n,
      walletClient: mockWallet,
      chain: 'base',
    })).rejects.toThrow('AGENT_ONLY');
  });

  it('rejects deposit with malformed public key', async () => {
    const badDID = {
      did: 'did:key:z6MkSomething',
      publicKeyHex: 'short',
      publicKeyMultibase: 'z6MkSomething',
    };

    const mockWallet = {
      account: { address: '0x1234567890123456789012345678901234567890' },
    } as any;

    await expect(pool.deposit({
      agentDID: badDID,
      amountUsdc: 1000000n,
      walletClient: mockWallet,
      chain: 'base',
    })).rejects.toThrow('AGENT_ONLY');
  });

  it('computes management fee correctly', () => {
    // Access via any cast for private method testing
    const fee = (pool as any).calculateManagementFee(1_000_000_000n, 365);
    // Expected: 1,000,000,000 * 50 / 10000 / 365 * 365 = 5,000,000 (0.5%)
    expect(fee).toBe(5_000_000n);
  });

  it('computes zero fee for 0 days', () => {
    const fee = (pool as any).calculateManagementFee(1_000_000_000n, 0);
    expect(fee).toBe(0n);
  });

  it('computes fee proportional to days staked', () => {
    const fee365 = (pool as any).calculateManagementFee(1_000_000_000n, 365);
    const fee182 = (pool as any).calculateManagementFee(1_000_000_000n, 182);
    // 182 days should be roughly half of 365 days fee
    expect(fee182).toBeLessThan(fee365);
    expect(fee182).toBeGreaterThan(0n);
  });

  it('returns zero balance for unknown DID', async () => {
    const balance = await pool.getBalance(agentDID, 'base');
    expect(balance.principalUsdc).toBe(0n);
    expect(balance.netBalanceUsdc).toBe(0n);
    expect(balance.agentDID).toBe(agentDID.did);
  });

  it('AgentDID has correct format from test key', () => {
    expect(agentDID.did).toMatch(/^did:key:z6Mk/);
    expect(agentDID.publicKeyHex).toHaveLength(64);
    expect(agentDID.publicKeyMultibase).toMatch(/^z6Mk/);
  });
});
