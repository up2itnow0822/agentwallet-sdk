/** Custom signed identity claims plus independently checked vault ownership and stake.
 * This module does not infer AI status, reputation, task history or wallet age.
 */
import { erc20Abi, isAddress, keccak256, parseAbi, type Address, type Hash, type Hex, type PublicClient } from 'viem';
import { deriveAgentDID, issueCredential, verifyCredentialSignature, type VerifiableCredential } from '../identity/did.js';
export interface AgentTrustBundle { credential: VerifiableCredential; ownerSignature: Hex }
export interface TrustedChainEvidence {
  publicClient: PublicClient;
  walletAddress: Address;
  chainId: number;
  expectedCodeHash: Hash;
  token: Address;
  aToken: Address;
}
export interface TrustVerificationOptions extends TrustedChainEvidence {
  expectedIssuer: string;
  expectedChallenge: string;
  now?: Date;
  maxAgeSeconds?: number;
  confirmations?: number;
}
export interface VerifyAgentParams extends TrustedChainEvidence {
  privateKey: Hex;
  ownerSignature: Hex;
  challenge: string;
  expiresAt: Date;
  now?: Date;
}
const vaultEvidenceAbi = parseAbi(['function owner() view returns (address)','function stakingPrincipal(address token) view returns (uint256)']);
/** Owner signs this exact domain-separated message using the external owner wallet. */
export function walletBindingMessage(input: {did:string;walletAddress:Address;chainId:number;challenge:string;expiresAt:string}): string {
  if (!isAddress(input.walletAddress) || !Number.isSafeInteger(input.chainId) || input.chainId <= 0 || !/^[A-Za-z0-9_-]{16,128}$/.test(input.challenge) || !Number.isFinite(Date.parse(input.expiresAt))) throw new Error('Invalid wallet binding');
  return JSON.stringify({domain:'AgentWalletOwnerBindingV1',did:input.did,walletAddress:input.walletAddress.toLowerCase(),chainId:input.chainId,challenge:input.challenge,expiresAt:input.expiresAt});
}
async function observe(provider: TrustedChainEvidence, blockNumber: bigint) {
  if (!isAddress(provider.walletAddress) || !isAddress(provider.token) || !isAddress(provider.aToken)) throw new Error('Invalid trusted deployments');
  if (await provider.publicClient.getChainId() !== provider.chainId) throw new Error('Trusted evidence provider chain mismatch');
  const [block,code,owner,principal,stakingBalance] = await Promise.all([
    provider.publicClient.getBlock({blockNumber}),
    provider.publicClient.getCode({address:provider.walletAddress,blockNumber}),
    provider.publicClient.readContract({address:provider.walletAddress,abi:vaultEvidenceAbi,functionName:'owner',blockNumber}),
    provider.publicClient.readContract({address:provider.walletAddress,abi:vaultEvidenceAbi,functionName:'stakingPrincipal',args:[provider.token],blockNumber}),
    provider.publicClient.readContract({address:provider.aToken,abi:erc20Abi,functionName:'balanceOf',args:[provider.walletAddress],blockNumber}),
  ]);
  if (!code || code === '0x' || keccak256(code).toLowerCase() !== provider.expectedCodeHash.toLowerCase() || !block.hash) throw new Error('Vault code or block hash mismatch');
  return {block,owner,principal,stakingBalance};
}
/** Creates a custom envelope from a trusted RPC snapshot. Consumers must verify independently. */
export async function verifyAgent(params: VerifyAgentParams): Promise<AgentTrustBundle> {
  if (!params?.publicClient) throw new Error('v5 trust requires a trusted PublicClient, explicit vault/chain/deployments and owner binding');
  const now = params.now ?? new Date(), did = deriveAgentDID(params.privateKey);
  if (params.expiresAt.getTime() <= now.getTime() || params.expiresAt.getTime() > now.getTime()+3600000) throw new Error('Trust binding expiry must be within one hour');
  const blockNumber = await params.publicClient.getBlockNumber();
  const observed = await observe(params,blockNumber);
  const message = walletBindingMessage({did:did.did,...params,expiresAt:params.expiresAt.toISOString()});
  if (!await params.publicClient.verifyMessage({address:observed.owner,message,signature:params.ownerSignature,blockNumber})) throw new Error('Vault owner signature does not bind DID, wallet, chain and challenge');
  const credential = issueCredential(did,params.privateKey,{
    format:'AgentWalletTrustSnapshotV1',walletAddress:params.walletAddress.toLowerCase(),chainId:params.chainId,
    token:params.token.toLowerCase(),aToken:params.aToken.toLowerCase(),blockNumber:blockNumber.toString(),blockHash:observed.block.hash,
    stakingBalance:observed.stakingBalance.toString(),principal:observed.principal.toString(),challenge:params.challenge,
  },{now,expiresAt:params.expiresAt});
  return {credential,ownerSignature:params.ownerSignature};
}
/** Signature authentication only. Never implies verified ownership or economic facts. */
export function verifyTrustBundleSignature(bundle: AgentTrustBundle, options: {expectedIssuer?:string;now?:Date} = {}): boolean {
  return Boolean(bundle?.credential && verifyCredentialSignature(bundle.credential,options));
}
/** Fail closed unless expected identities, verifier challenge and trusted chain data match. */
export async function verifyTrustBundle(bundle: AgentTrustBundle, options?: TrustVerificationOptions): Promise<boolean> {
  try {
    if (!options?.publicClient || !options.expectedIssuer || !options.expectedChallenge || !verifyTrustBundleSignature(bundle,{expectedIssuer:options.expectedIssuer,now:options.now})) return false;
    const now = options.now ?? new Date(), claims = bundle.credential.credentialSubject;
    const maxAge = options.maxAgeSeconds ?? 300, confirmations = options.confirmations ?? 1;
    if (!Number.isSafeInteger(maxAge) || maxAge <= 0 || maxAge > 3600 || !Number.isSafeInteger(confirmations) || confirmations < 1 || confirmations > 100) return false;
    if (now.getTime()-Date.parse(bundle.credential.issuanceDate) > maxAge*1000 || Date.parse(bundle.credential.expirationDate)-Date.parse(bundle.credential.issuanceDate) > 3600000) return false;
    if (claims.format !== 'AgentWalletTrustSnapshotV1' || claims.walletAddress !== options.walletAddress.toLowerCase() || claims.chainId !== options.chainId || claims.token !== options.token.toLowerCase() || claims.aToken !== options.aToken.toLowerCase() || claims.challenge !== options.expectedChallenge) return false;
    if (typeof claims.blockNumber !== 'string' || !/^(0|[1-9][0-9]*)$/.test(claims.blockNumber)) return false;
    const blockNumber = BigInt(claims.blockNumber), latest = await options.publicClient.getBlockNumber();
    if (blockNumber + BigInt(confirmations)-1n > latest) return false;
    const observed = await observe(options,blockNumber);
    const blockAge = Math.floor(now.getTime()/1000)-Number(observed.block.timestamp);
    if (blockAge < 0 || blockAge > maxAge || claims.blockHash !== observed.block.hash || claims.stakingBalance !== observed.stakingBalance.toString() || claims.principal !== observed.principal.toString()) return false;
    const message = walletBindingMessage({did:bundle.credential.issuer,walletAddress:options.walletAddress,chainId:options.chainId,challenge:options.expectedChallenge,expiresAt:bundle.credential.expirationDate});
    return await options.publicClient.verifyMessage({address:observed.owner,message,signature:bundle.ownerSignature,blockNumber});
  } catch { return false; }
}
