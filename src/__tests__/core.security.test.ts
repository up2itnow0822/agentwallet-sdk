import { describe, it, expect, vi } from 'vitest';
import { encodeEventTopics, encodeAbiParameters, keccak256, type Address } from 'viem';
import { baseSepolia } from 'viem/chains';
import { agentExecute, agentTransferToken, deployWallet, AgentAccountV2Abi, SubmittedTransactionError } from '../index.js';
import type {AgentWallet} from '../types.js';

const address = '0x2222222222222222222222222222222222222222' as Address;
const signer = '0x1111111111111111111111111111111111111111' as Address;
const recipient = '0x3333333333333333333333333333333333333333' as Address;
const hash = `0x${'ab'.repeat(32)}`;
function wallet(status: 'success' | 'reverted' = 'success', logs: unknown[] = []) {
  const mock = {
    address, chain: baseSepolia, expectedCodeHash: keccak256('0x6000'), confirmations: 1,
    publicClient: {
      getChainId: vi.fn(async () => 84532), getBytecode: vi.fn(async () => '0x6000'),
      readContract: vi.fn(async ({ functionName }: { functionName: string }) => functionName === 'securityVersion' ? 1n : signer),
      simulateContract: vi.fn(async ({ functionName, args }: {functionName:string,args:unknown[]}) => ({ request: {functionName,args} })),
      waitForTransactionReceipt: vi.fn(async () => ({ status, logs, transactionHash: hash })),
    },
    walletClient: {account: {address:signer}, chain:baseSepolia, getChainId: vi.fn(async () => 84532), writeContract: vi.fn(async (_request:unknown) => hash)},
    contract: {
      read: {pendingNonce:vi.fn(async () => 1n), securityVersion:vi.fn(async () => 1n)},
      write: { agentExecute:vi.fn(async () => hash), agentTransferToken:vi.fn(async () => hash)},
    },
  };
  return mock as typeof mock & AgentWallet;
}
describe('guarded core security', () => {
  it('rejects a reverted execution instead of reporting executed', async () => {
    await expect(agentExecute(wallet('reverted'), {to:recipient,value:1n})).rejects.toThrow(/revert/i);
  });
  it('rejects a successful replacement receipt that is not the submitted vault call', async () => {
    const w=wallet();
    w.publicClient.waitForTransactionReceipt.mockResolvedValue({status:'success',logs:[],transactionHash:`0x${'cd'.repeat(32)}`});
    await expect(agentExecute(w,{to:recipient,value:1n})).rejects.toMatchObject({txHash:hash});
  });
  it('preserves the known deployment hash after a receipt transport failure', async () => {
    const w=wallet();
    const publicClient={...w.publicClient,waitForTransactionReceipt:vi.fn(async()=>{throw new Error('RPC connection lost');})};
    const walletClient={...w.walletClient,deployContract:vi.fn(async()=>hash)};
    const config={chain:'base-sepolia' as const,owner:signer,operator:recipient,router:recipient,aavePool:recipient,tokenMessenger:recipient,sourceDomain:6,walletClient:walletClient as unknown as AgentWallet['walletClient'],publicClient:publicClient as unknown as AgentWallet['publicClient']};
    const attempt=deployWallet(config);
    await expect(attempt).rejects.toBeInstanceOf(SubmittedTransactionError);
    await expect(attempt).rejects.toMatchObject({txHash:hash});
  });
  it('returns a queued transaction ID from the vault event', async () => {
    const topics = encodeEventTopics({abi:AgentAccountV2Abi,eventName:'TransactionQueued',args:{txId:7n,to:recipient}});
    const data = encodeAbiParameters([{type:'uint256'},{type:'address'},{type:'uint256'}],[1n,'0x0000000000000000000000000000000000000000',1n]);
    const w=wallet('success',[{address,topics,data}]);
    const result=await agentExecute(w,{to:recipient,value:1n});
    expect(result).toMatchObject({status:'queued',executed:false,txId:7n});
  });
  it('rejects code-hash substitution before signing', async () => {
    const w=wallet(); w.publicClient.getBytecode.mockResolvedValue('0x6001');
    await expect(agentExecute(w,{to:recipient,value:1n})).rejects.toThrow(/bytecode|code hash/i);
    expect(w.walletClient.writeContract).not.toHaveBeenCalled();
  });
  it('rejects public/wallet provider chain mismatch before signing', async () => {
    const w=wallet(); w.walletClient.getChainId.mockResolvedValue(1);
    await expect(agentExecute(w,{to:recipient,value:1n})).rejects.toThrow(/chain|network/i);
    expect(w.walletClient.writeContract).not.toHaveBeenCalled();
  });
  it('never attaches agent transfer amount as funding from the gas signer', async () => {
    const w=wallet();
    await agentExecute(w,{to:recipient,value:1n});
    const args=w.walletClient.writeContract.mock.calls[0]?.[0] as {value?:bigint}|undefined;
    expect(args).toBeDefined(); expect(args?.value??0n).toBe(0n);
  });
  it('rejects arbitrary operator calldata and negative token amounts', async () => {
    await expect(agentExecute(wallet(),{to:recipient,value:1n,data:'0xdeadbeef'})).rejects.toThrow(/calldata|data/i);
    await expect(agentTransferToken(wallet(),{token:recipient,to:recipient,amount:-1n})).rejects.toThrow(/amount/i);
  });
});
