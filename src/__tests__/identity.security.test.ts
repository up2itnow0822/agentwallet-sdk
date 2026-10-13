import { describe, it, expect } from 'vitest';
import { deriveAgentDID, issueCredential, verifyCredential } from '../identity/did.js';
const key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
describe('signed credential proof options', () => {
  const did = deriveAgentDID(key);
  for (const [field,value] of Object.entries({type:'Ed25519Signature2020',created:'2000-01-01T00:00:00.000Z',proofPurpose:'authentication',verificationMethod:did.did+'#wrong'})) {
    it(`rejects altered ${field}`, () => {
      const vc = issueCredential(did,key,{role:'agent'});
      expect(verifyCredential({...vc,proof:{...vc.proof,[field]:value}})).toBe(false);
    });
  }
  it('rejects issuer/private key mismatch at issuance', () => {
    expect(() => issueCredential(did,'0x'+'11'.repeat(32) as `0x${string}`,{})).toThrow();
  });
});

describe('credential freshness and verifier identity',()=>{
  const did=deriveAgentDID(key),now=new Date('2026-10-12T00:00:00Z');
  it('rejects expired and future credentials',()=>{
    const vc=issueCredential(did,key,{}, {now,expiresAt:new Date(now.getTime()+60000)});
    expect(verifyCredential(vc,{now:new Date(now.getTime()+60000)})).toBe(false);
    expect(verifyCredential(vc,{now:new Date(now.getTime()-1)})).toBe(false);
  });
  it('rejects an unexpected issuer or subject',()=>{
    const vc=issueCredential(did,key,{}, {now});
    expect(verifyCredential(vc,{expectedIssuer:'did:key:wrong',now})).toBe(false);
    expect(verifyCredential(vc,{expectedSubject:'did:key:wrong',now})).toBe(false);
  });
  it('rejects non-JSON claims instead of ambiguous signing',()=>{
    expect(()=>issueCredential(did,key,{value:undefined})).toThrow(/JSON/);
    expect(()=>issueCredential(did,key,{value:NaN})).toThrow(/JSON/);
  });
});

describe('proof controller',()=>{
  it('explicitly binds proof controller to issuer and signs it',()=>{
    const did=deriveAgentDID(key),vc=issueCredential(did,key,{});
    expect('controller' in vc.proof && vc.proof.controller).toBe(did.did);
    expect(verifyCredential({...vc,proof:{...vc.proof,controller:'did:key:victim'} as typeof vc.proof})).toBe(false);
  });
});
