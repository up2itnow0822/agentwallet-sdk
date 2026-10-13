import { describe, it, expect } from 'vitest';
import { AgentStakingPool } from '../staking/AgentStakingPool.js';
describe('guarded staking migration', () => {
  it('rejects legacy raw wallet deposits with an actionable vault migration', async () => {
    const pool = new AgentStakingPool({token:'0x'+'12'.repeat(20) as `0x${string}`,aToken:'0x'+'34'.repeat(20) as `0x${string}`});
    await expect(pool.deposit({walletClient:{account:{address:'0x'+'12'.repeat(20)}},amountUsdc:1n,chain:'base'} as never)).rejects.toThrow(/AgentWallet|vault/i);
  });
  it('requires explicit token deployments rather than assumed network defaults', () => {
    expect(() => new AgentStakingPool()).toThrow(/token|deployment/i);
  });
});
