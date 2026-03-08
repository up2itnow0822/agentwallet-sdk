/**
 * Agent DID + Verifiable Credentials
 *
 * Derives deterministic did:key identifiers from agent private keys and issues
 * W3C-compliant Verifiable Credentials. Zero external registry — fully self-sovereign.
 *
 * DID format: did:key:z6Mk... (multibase base58btc-encoded ed25519 public key)
 * VC format: W3C VC Data Model v1.1 with Ed25519Signature2020 proof
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { sha256 } from '@noble/hashes/sha256';
import type { Hex } from 'viem';

// @noble/ed25519 v2 requires setting sha512 sync
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Base58btc encoding (multibase) ──────────────────────────────────────────

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes: Uint8Array): string {
  let num = BigInt('0x' + Buffer.from(bytes).toString('hex'));
  const result: string[] = [];
  while (num > 0n) {
    const mod = num % 58n;
    result.unshift(BASE58_ALPHABET[Number(mod)]);
    num = num / 58n;
  }
  // Leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result.unshift('1');
  }
  return result.join('');
}

function base58Decode(str: string): Uint8Array {
  let num = 0n;
  for (const char of str) {
    const idx = BASE58_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base58 character: ${char}`);
    num = num * 58n + BigInt(idx);
  }
  const rawHex = num.toString(16); const hex = rawHex.length % 2 ? "0" + rawHex : rawHex;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  // Re-add leading zero bytes
  const leadingZeros = str.split('').findIndex(c => c !== '1');
  const prefix = new Uint8Array(leadingZeros === -1 ? str.length : leadingZeros);
  return new Uint8Array([...prefix, ...bytes]);
}

// ─── Multicodec prefix for ed25519-pub (0xed01) ──────────────────────────────

const ED25519_PUB_MULTICODEC = new Uint8Array([0xed, 0x01]);

function pubkeyToMultibase(pubkey: Uint8Array): string {
  const prefixed = new Uint8Array([...ED25519_PUB_MULTICODEC, ...pubkey]);
  return 'z' + base58Encode(prefixed);
}

function multibaseToPubkey(multibase: string): Uint8Array {
  if (!multibase.startsWith('z')) throw new Error('Expected base58btc multibase (z prefix)');
  const decoded = base58Decode(multibase.slice(1));
  // Strip the 2-byte multicodec prefix
  return decoded.slice(2);
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Derive a deterministic did:key from a wallet's private key.
 * The ed25519 public key is derived from the private key, then multibase-encoded.
 */
export function deriveAgentDID(privateKey: Hex): AgentDID {
  // Strip 0x prefix, get raw bytes
  const privKeyBytes = new Uint8Array(
    Buffer.from(privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey, 'hex')
  );

  // Derive ed25519 public key
  const pubkey = ed.getPublicKey(privKeyBytes);
  const publicKeyHex = Buffer.from(pubkey).toString('hex');
  const publicKeyMultibase = pubkeyToMultibase(pubkey);
  const did = `did:key:${publicKeyMultibase}`;

  return { did, publicKeyHex, publicKeyMultibase };
}

/**
 * Export a W3C DID Document for an AgentDID.
 */
export function exportDIDDocument(did: AgentDID): DIDDocument {
  const vmId = `${did.did}#${did.publicKeyMultibase}`;
  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: did.did,
    verificationMethod: [
      {
        id: vmId,
        type: 'Ed25519VerificationKey2020',
        controller: did.did,
        publicKeyMultibase: did.publicKeyMultibase,
      },
    ],
    authentication: [vmId],
    assertionMethod: [vmId],
    capabilityDelegation: [vmId],
    capabilityInvocation: [vmId],
  };
}

/**
 * Issue a W3C Verifiable Credential signed with Ed25519Signature2020.
 */
export function issueCredential(
  issuerDID: AgentDID,
  privateKey: Hex,
  claims: Record<string, unknown>
): VerifiableCredential {
  const privKeyBytes = new Uint8Array(
    Buffer.from(privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey, 'hex')
  );

  const now = new Date().toISOString();
  const credId = `urn:uuid:${generateUUID()}`;

  const vc: Omit<VerifiableCredential, 'proof'> = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: credId,
    type: ['VerifiableCredential', 'AgentCredential'],
    issuer: issuerDID.did,
    issuanceDate: now,
    credentialSubject: {
      id: issuerDID.did,
      ...claims,
    },
  };

  // Sign the canonical form of the credential body
  const vcBytes = new TextEncoder().encode(canonicalize(vc));
  const hash = sha256(vcBytes);
  const sig = ed.sign(hash, privKeyBytes);
  const proofValue = 'z' + base58Encode(sig);

  const vmId = `${issuerDID.did}#${issuerDID.publicKeyMultibase}`;

  return {
    ...vc,
    proof: {
      type: 'Ed25519Signature2020',
      created: now,
      verificationMethod: vmId,
      proofPurpose: 'assertionMethod',
      proofValue,
    },
  };
}

/**
 * Verify a Verifiable Credential's Ed25519 signature.
 * Returns true if the signature is valid and matches the issuer's DID.
 */
export function verifyCredential(vc: VerifiableCredential): boolean {
  try {
    const { proof, ...vcBody } = vc;

    // Extract public key from the verificationMethod DID
    // Format: did:key:z6Mk...#z6Mk...
    const vmParts = proof.verificationMethod.split('#');
    const didPart = vmParts[0];
    const keyPart = vmParts[1] ?? didPart.replace('did:key:', '');

    const pubkey = multibaseToPubkey(keyPart);

    // Verify the issuer DID matches
    const expectedDID = `did:key:${keyPart}`;
    if (vc.issuer !== expectedDID) return false;

    // Re-compute the canonical hash
    const vcBytes = new TextEncoder().encode(canonicalize(vcBody));
    const hash = sha256(vcBytes);

    // Decode the signature
    const sigBytes = base58Decode(proof.proofValue.slice(1)); // strip 'z' prefix

    return ed.verify(sigBytes, hash, pubkey);
  } catch {
    return false;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Deterministic JSON serialization for consistent signing */
function canonicalize(obj: unknown): string {
  if (typeof obj !== 'object' || obj === null) return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
  const keys = Object.keys(obj as object).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalize((obj as Record<string, unknown>)[k])).join(',') + '}';
}

function generateUUID(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
