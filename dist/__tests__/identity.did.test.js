import { describe, it, expect } from 'vitest';
import { deriveAgentDID, issueCredential, verifyCredential, exportDIDDocument, } from '../identity/did.js';
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
describe('Agent DID (did:key)', () => {
    it('derives a deterministic DID from a private key', () => {
        const did1 = deriveAgentDID(TEST_PRIVATE_KEY);
        const did2 = deriveAgentDID(TEST_PRIVATE_KEY);
        expect(did1.did).toBe(did2.did);
        expect(did1.did).toMatch(/^did:key:z6Mk/);
    });
    it('derives different DIDs for different private keys', () => {
        const key2 = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
        const did1 = deriveAgentDID(TEST_PRIVATE_KEY);
        const did2 = deriveAgentDID(key2);
        expect(did1.did).not.toBe(did2.did);
    });
    it('exports a valid W3C DID Document', () => {
        const did = deriveAgentDID(TEST_PRIVATE_KEY);
        const doc = exportDIDDocument(did);
        expect(doc['@context']).toContain('https://www.w3.org/ns/did/v1');
        expect(doc.id).toBe(did.did);
        expect(doc.verificationMethod).toHaveLength(1);
        expect(doc.verificationMethod[0].type).toBe('Ed25519VerificationKey2020');
        expect(doc.authentication).toHaveLength(1);
    });
    it('issues and verifies a Verifiable Credential', () => {
        const did = deriveAgentDID(TEST_PRIVATE_KEY);
        const vc = issueCredential(did, TEST_PRIVATE_KEY, {
            agentType: 'autonomous',
            capability: 'payment',
        });
        expect(vc['@context']).toContain('https://www.w3.org/2018/credentials/v1');
        expect(vc.issuer).toBe(did.did);
        expect(vc.type).toContain('VerifiableCredential');
        expect(vc.credentialSubject.agentType).toBe('autonomous');
        expect(vc.proof.type).toBe('Ed25519Signature2020');
        const valid = verifyCredential(vc);
        expect(valid).toBe(true);
    });
    it('rejects a tampered credential', () => {
        const did = deriveAgentDID(TEST_PRIVATE_KEY);
        const vc = issueCredential(did, TEST_PRIVATE_KEY, { role: 'agent' });
        const tampered = {
            ...vc,
            credentialSubject: { ...vc.credentialSubject, role: 'admin' },
        };
        expect(verifyCredential(tampered)).toBe(false);
    });
    it('rejects credential with wrong issuer DID', () => {
        const did = deriveAgentDID(TEST_PRIVATE_KEY);
        const vc = issueCredential(did, TEST_PRIVATE_KEY, { role: 'agent' });
        const tampered = { ...vc, issuer: 'did:key:z6MkFake' };
        expect(verifyCredential(tampered)).toBe(false);
    });
});
//# sourceMappingURL=identity.did.test.js.map