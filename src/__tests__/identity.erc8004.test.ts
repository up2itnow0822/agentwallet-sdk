import {describe,it,expect} from 'vitest';
import {encodeFunctionData,toFunctionSelector,toEventSelector,decodeEventLog,encodeAbiParameters} from 'viem';
import {ERC8004IdentityRegistryAbi,ERC8004Client,KNOWN_REGISTRY_ADDRESSES,buildDataURI,parseDataURI,validateRegistrationFile} from '../identity/erc8004.js';
describe('ERC-8004 primary specification ABI',()=>{
  it('uses register overloads with canonical selectors',()=>{
    for(const [args,signature] of [[[],'register()'],[['https://agent.example'],'register(string)'],[['https://agent.example',[]],'register(string,(string,bytes)[])']] as const) {
      expect(encodeFunctionData({abi:ERC8004IdentityRegistryAbi,functionName:'register',args}).slice(0,10)).toBe(toFunctionSelector(signature));
    }
    expect(ERC8004IdentityRegistryAbi.map(item=>item.name) as readonly string[]).not.toContain('registerWithMetadata');
  });
  it('decodes canonical Registered event rather than a guessed topic',()=>{
    const owner='0x1111111111111111111111111111111111111111';
    const event=decodeEventLog({abi:ERC8004IdentityRegistryAbi,eventName:'Registered',data:encodeAbiParameters([{type:'string'}],['https://agent.example']),topics:[toEventSelector('Registered(uint256,string,address)'),('0x'+42n.toString(16).padStart(64,'0')) as `0x${string}`,('0x'+owner.slice(2).padStart(64,'0')) as `0x${string}`]});
    expect(event.args).toEqual({agentId:42n,agentURI:'https://agent.example',owner});
  });
  it('requires explicit nonzero registry deployments',()=>{
    expect(KNOWN_REGISTRY_ADDRESSES).toEqual({});
    expect(()=>new ERC8004Client({chain:'base',rpcUrl:'https://trusted.example',registryAddress:'0x0000000000000000000000000000000000000000'})).toThrow(/nonzero/);
  });
  it('round-trips Unicode inline metadata and rejects malformed arrays',()=>{
    const file={name:'Agent 🌱',description:'observed'};
    expect(parseDataURI(buildDataURI(file))).toMatchObject(file);
    expect(validateRegistrationFile({...file,type:'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',services:{}})).toContain('services must be an array');
  });
});

describe('registry metadata validation',()=>{
  it('rejects malformed on-chain capabilities instead of presenting a typed array',async()=>{
    const client=new ERC8004Client({chain:'base',rpcUrl:'https://trusted.example',registryAddress:'0x1111111111111111111111111111111111111111'});
    client.getOnChainMetadata=async(_agentId,key)=>key==='agentCapabilities'?('0x'+Buffer.from('{"admin":true}').toString('hex')) as `0x${string}`:null;
    await expect(client.readModelMetadata(1n)).rejects.toThrow(/capabilities/);
  });
});
