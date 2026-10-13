import {describe,it,expect,vi} from 'vitest';
import {privateKeyToAccount} from 'viem/accounts';
import {verifyMessage,keccak256,type PublicClient,type Address} from 'viem';
import {deriveAgentDID,issueCredential} from '../identity/did.js';
import {verifyAgent,verifyTrustBundle,verifyTrustBundleSignature,walletBindingMessage,type TrustVerificationOptions} from '../verify/verifyAgent.js';
const key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const addr = (n:string) => ('0x'+n.repeat(40)) as Address;
async function fixture() {
  const now = new Date('2026-10-12T00:00:00Z'),expiresAt = new Date(now.getTime()+60000),account = privateKeyToAccount(key),did=deriveAgentDID(key),code='0x1234' as const;
  const read = vi.fn(async (args:{functionName:string})=>args.functionName==='owner'?account.address:args.functionName==='stakingPrincipal'?100n:120n);
  const publicClient = {getChainId:async()=>8453,getBlockNumber:async()=>10n,getBlock:async()=>({hash:'0x'+'ab'.repeat(32),timestamp:BigInt(now.getTime()/1000),number:10n}),getCode:async()=>code,readContract:read,verifyMessage:async(input:Parameters<typeof verifyMessage>[0])=>verifyMessage(input)} as unknown as PublicClient;
  const options:TrustVerificationOptions={publicClient,walletAddress:addr('1'),chainId:8453,expectedCodeHash:keccak256(code),token:addr('2'),aToken:addr('3'),expectedIssuer:did.did,expectedChallenge:'verifier_nonce_123456',now};
  const ownerSignature = await account.signMessage({message:walletBindingMessage({did:did.did,...options,challenge:options.expectedChallenge,expiresAt:expiresAt.toISOString()})});
  const bundle = await verifyAgent({...options,privateKey:key,ownerSignature,challenge:options.expectedChallenge,expiresAt});
  return {bundle,options,read,did,expiresAt};
}
describe('trusted chain snapshot',()=>{
  it('verifies observed stake and owner binding at the signed block',async()=>{
    const {bundle,options,read}=await fixture();
    expect(await verifyTrustBundle(bundle,options)).toBe(true);
    expect(read.mock.calls.every(([args])=> 'blockNumber' in args && args.blockNumber===10n)).toBe(true);
    expect(bundle.credential.credentialSubject.stakingBalance).toBe('120');
  });
  it('rejects valid re-signed fabricated economics against trusted RPC',async()=>{
    const {bundle,options,did,expiresAt}=await fixture();
    bundle.credential=issueCredential(did,key,{...bundle.credential.credentialSubject,stakingBalance:'999999'},{now:options.now,expiresAt});
    expect(verifyTrustBundleSignature(bundle,{now:options.now})).toBe(true);
    expect(await verifyTrustBundle(bundle,options)).toBe(false);
  });
  it('rejects wrong wallet, chain, challenge and code hash',async()=>{
    const {bundle,options}=await fixture();
    for(const changed of [{walletAddress:addr('4')},{chainId:1},{expectedChallenge:'different_nonce_123456'},{expectedCodeHash:('0x'+'00'.repeat(32)) as `0x${string}`}]) expect(await verifyTrustBundle(bundle,{...options,...changed})).toBe(false);
  });
  it('rejects expired snapshots and wrong owner signatures',async()=>{
    const {bundle,options}=await fixture();
    expect(await verifyTrustBundle(bundle,{...options,now:new Date(options.now!.getTime()+60001)})).toBe(false);
    expect(await verifyTrustBundle({...bundle,ownerSignature:('0x'+'00'.repeat(65)) as `0x${string}`},options)).toBe(false);
  });
  it('fails closed when trusted RPC observation fails',async()=>{
    const {bundle,options,read}=await fixture();read.mockRejectedValueOnce(new Error('RPC offline'));
    expect(await verifyTrustBundle(bundle,options)).toBe(false);
  });
  it('rejects a replaced block hash',async()=>{
    const {bundle,options,did,expiresAt}=await fixture();
    bundle.credential=issueCredential(did,key,{...bundle.credential.credentialSubject,blockHash:'0x'+'cd'.repeat(32)},{now:options.now,expiresAt});
    expect(await verifyTrustBundle(bundle,options)).toBe(false);
  });
});
