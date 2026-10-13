import {describe,it,expect,vi} from 'vitest';
import {base} from 'viem/chains';
import type {AgentWallet} from '../types.js';
const execute = vi.hoisted(()=>vi.fn());
vi.mock('../wallet/execution.js',()=>({executeVaultOperation:execute}));
import {AgentStakingPool} from '../staking/AgentStakingPool.js';
const token='0x1111111111111111111111111111111111111111',aToken='0x2222222222222222222222222222222222222222',vault='0x3333333333333333333333333333333333333333';
function fixture(balance=120n,principal=100n) {
  const read = vi.fn(async(args:{functionName:string})=>args.functionName==='balanceOf'?balance:principal);
  const wallet={address:vault,chain:base,expectedCodeHash:'0x'+'ab'.repeat(32),contract:{},walletClient:{writeContract:()=>{throw new Error('direct capital write forbidden');}},publicClient:{getChainId:async()=>8453,getBlockNumber:async()=>12n,readContract:read}} as unknown as AgentWallet;
  return {wallet,read,pool:new AgentStakingPool({token,aToken})};
}
describe('guarded staking and observed accounting',()=>{
  it('routes supply and redeem through confirmed vault operations',async()=>{
    const {pool,wallet}=fixture(),receipt={status:'success'},result={txHash:'0xhash',receipt};execute.mockResolvedValue(result);
    expect(await pool.deposit({wallet,amount:42n})).toBe(result);
    expect(execute).toHaveBeenLastCalledWith(wallet,'agentSupply',[token,42n]);
    expect(await pool.withdraw({wallet,amount:7n})).toBe(result);
    expect(execute).toHaveBeenLastCalledWith(wallet,'agentWithdraw',[token,7n]);
  });
  it('rejects nonpositive, fractional and uint256 overflow amounts before submission',async()=>{
    const {pool,wallet}=fixture();execute.mockClear();
    for(const amount of [0n,-1n,2n**256n,1.5 as unknown as bigint]) await expect(pool.deposit({wallet,amount})).rejects.toThrow(/uint256/);
    expect(execute).not.toHaveBeenCalled();
  });
  it('reads actual aToken and vault principal at one block and computes only observed yield',async()=>{
    const {pool,wallet,read}=fixture();
    expect(await pool.getBalance(wallet)).toMatchObject({principal:100n,balance:120n,yieldEarned:20n,principalShortfall:0n,blockNumber:12n,walletAddress:vault});
    expect(read.mock.calls.every(([args])=>'blockNumber' in args&&args.blockNumber===12n)).toBe(true);
  });
  it('reports principal shortfall instead of invented yield',async()=>{
    const {pool,wallet}=fixture(80n,100n);
    expect(await pool.getBalance(wallet)).toMatchObject({balance:80n,principal:100n,yieldEarned:0n,principalShortfall:20n});
  });
  it('preserves failed execution errors without a funded signer fallback',async()=>{
    const {pool,wallet}=fixture();execute.mockRejectedValueOnce(new Error('vault receipt reverted'));
    await expect(pool.withdraw({wallet,amount:1n})).rejects.toThrow(/reverted/);
  });
});
