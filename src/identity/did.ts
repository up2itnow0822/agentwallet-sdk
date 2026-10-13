/**
 * Agent DID + Verifiable Credentials
 *
 * Derives deterministic did:key identifiers from agent private keys and issues
 * custom AgentWallet signed credential envelopes. Zero external registry — fully self-sovereign.
 *
 * DID format: did:key:z6Mk... (multibase base58btc-encoded ed25519 public key)
 * Credential format is custom JSON, NOT a W3C Data Integrity cryptosuite.
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
  expirationDate: string;
  credentialSubject: Record<string, unknown>;
  proof: CredentialProof;
}

export interface CredentialProof {
  controller: string;
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
  if (!multibase.startsWith('z') || multibase.length !== 48) throw new Error('Expected 48-character ed25519 base58btc multibase');
  const decoded = base58Decode(multibase.slice(1));
  if (decoded.length !== 34 || decoded[0] !== 0xed || decoded[1] !== 0x01) throw new Error('Invalid ed25519 multicodec');
  return decoded.slice(2);
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Derive a deterministic did:key from a wallet's private key.
 * The ed25519 public key is derived from the private key, then multibase-encoded.
 */
export function deriveAgentDID(privateKey: Hex): AgentDID {
  if (!/^(0x)?[0-9a-fA-F]{64}$/.test(privateKey)) throw new Error('Expected a 32-byte hex private key');
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
 * Issue a custom signed JSON envelope. Not a W3C Ed25519Signature2020 implementation.
 */
export function issueCredential(
  issuerDID: AgentDID,
  privateKey: Hex,
  claims: Record<string, unknown>,
  options: { expiresAt?: Date; now?: Date } = {}
): VerifiableCredential {
  const privKeyBytes = new Uint8Array(
    Buffer.from(privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey, 'hex')
  );

  const derived = deriveAgentDID(privateKey);
  if (derived.did !== issuerDID.did || derived.publicKeyHex !== issuerDID.publicKeyHex || derived.publicKeyMultibase !== issuerDID.publicKeyMultibase) throw new Error('Issuer DID does not match signing key');
  const date = options.now ?? new Date();
  const now = date.toISOString();
  const expirationDate = (options.expiresAt ?? new Date(date.getTime() + 3600000)).toISOString();
  if (Date.parse(expirationDate) <= date.getTime()) throw new Error('Credential expiration must follow issuance');
  const credId = `urn:uuid:${generateUUID()}`;

  const vc: Omit<VerifiableCredential, 'proof'> = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
    ],
    id: credId,
    type: ['VerifiableCredential', 'AgentWalletCustomCredentialV1'],
    issuer: issuerDID.did,
    issuanceDate: now,
    expirationDate,
    credentialSubject: {
      ...claims,
      id: issuerDID.did,
    },
  };

  const proofOptions = {
    type: 'AgentWalletEd25519EnvelopeV1',
    controller: issuerDID.did,
    created: now,
    verificationMethod: `${issuerDID.did}#${issuerDID.publicKeyMultibase}`,
    proofPurpose: 'assertionMethod',
  };
  const hash = sha256(new TextEncoder().encode(canonicalize({ ...vc, proof: proofOptions })));
  return { ...vc, proof: { ...proofOptions, proofValue: 'z' + base58Encode(ed.sign(hash, privKeyBytes)) } };
}

/** Signature, proof semantics and time checks only; claims are not independently verified. */
export function verifyCredentialSignature(
  vc: VerifiableCredential,
  options: { expectedIssuer?: string; expectedSubject?: string; now?: Date } = {},
): boolean {
  try {
    const { proof, ...body } = vc;
    const { proofValue, ...proofOptions } = proof;
    if (proof.type !== 'AgentWalletEd25519EnvelopeV1' || proof.proofPurpose !== 'assertionMethod' || proof.controller !== vc.issuer) return false;
    if (!vc.issuer.startsWith('did:key:')) return false;
    const key = vc.issuer.slice(8);
    if (proof.verificationMethod !== `${vc.issuer}#${key}` || !proofValue.startsWith('z') || proofValue.length > 89) return false;
    if (options.expectedIssuer && vc.issuer !== options.expectedIssuer) return false;
    if (vc.credentialSubject.id !== (options.expectedSubject ?? vc.issuer)) return false;
    if (!vc.type.includes('AgentWalletCustomCredentialV1')) return false;
    const now = (options.now ?? new Date()).getTime();
    const issued = Date.parse(vc.issuanceDate), expires = Date.parse(vc.expirationDate);
    if (![issued,expires,now].every(Number.isFinite) || issued > now || expires <= now || expires <= issued || proof.created !== vc.issuanceDate) return false;
    const signature = base58Decode(proofValue.slice(1));
    if (signature.length !== 64) return false;
    return ed.verify(signature, sha256(new TextEncoder().encode(canonicalize({ ...body, proof: proofOptions }))), multibaseToPubkey(key));
  } catch { return false; }
}
/** @deprecated Use verifyCredentialSignature; this never verifies economic facts. */
export const verifyCredential = verifyCredentialSignature;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Deterministic JSON serialization for consistent signing */
function canonicalize(obj: unknown): string {
  if (obj === null || typeof obj === 'string' || typeof obj === 'boolean') return JSON.stringify(obj);
  if (typeof obj === 'number' && Number.isFinite(obj)) return JSON.stringify(obj);
  if (typeof obj !== 'object') throw new Error('Credential claims must be finite JSON values');
  if (!Array.isArray(obj) && Object.getPrototypeOf(obj) !== Object.prototype) throw new Error('Credential claims must be plain JSON objects');
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
