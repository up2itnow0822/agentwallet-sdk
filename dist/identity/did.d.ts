/**
 * Agent DID + Verifiable Credentials
 *
 * Derives deterministic did:key identifiers from agent private keys and issues
 * W3C-compliant Verifiable Credentials. Zero external registry — fully self-sovereign.
 *
 * DID format: did:key:z6Mk... (multibase base58btc-encoded ed25519 public key)
 * VC format: W3C VC Data Model v1.1 with Ed25519Signature2020 proof
 */
import type { Hex } from 'viem';
export interface AgentDID {
    did: string;
    publicKeyHex: string;
    /** Multibase-encoded public key (base58btc, z-prefix) */
    publicKeyMultibase: string;
}
export interface DIDDocument {
    '@context': string[];
    id: string;
    verificationMethod: VerificationMethod[];
    authentication: string[];
    assertionMethod: string[];
    capabilityDelegation: string[];
    capabilityInvocation: string[];
}
export interface VerificationMethod {
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase: string;
}
export interface VerifiableCredential {
    '@context': string[];
    id: string;
    type: string[];
    issuer: string;
    issuanceDate: string;
    credentialSubject: Record<string, unknown>;
    proof: CredentialProof;
}
export interface CredentialProof {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
}
/**
 * Derive a deterministic did:key from a wallet's private key.
 * The ed25519 public key is derived from the private key, then multibase-encoded.
 */
export declare function deriveAgentDID(privateKey: Hex): AgentDID;
/**
 * Export a W3C DID Document for an AgentDID.
 */
export declare function exportDIDDocument(did: AgentDID): DIDDocument;
/**
 * Issue a W3C Verifiable Credential signed with Ed25519Signature2020.
 */
export declare function issueCredential(issuerDID: AgentDID, privateKey: Hex, claims: Record<string, unknown>): VerifiableCredential;
/**
 * Verify a Verifiable Credential's Ed25519 signature.
 * Returns true if the signature is valid and matches the issuer's DID.
 */
export declare function verifyCredential(vc: VerifiableCredential): boolean;
//# sourceMappingURL=did.d.ts.map