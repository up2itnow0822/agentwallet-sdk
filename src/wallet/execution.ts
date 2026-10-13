import { decodeEventLog, getAddress, isAddress, isHex, keccak256, type Hash, type TransactionReceipt } from 'viem';
import { AgentVaultAbi } from '../contracts/AgentVaultAbi.js';
import type { AgentWallet, VaultOperation } from '../types.js';
const agentOperations = new Set<string>(['agentExecute','agentTransferToken','agentSwap','agentSupply','agentWithdraw','agentBridge']);
const ownerOperations = new Set<string>(['setSpendPolicy','setOperator','setRecipient','setSwapPair','setBridgeDestination','setPaused','approvePending','cancelPending','ownerExecute']);
export class SubmittedTransactionError extends Error {
  readonly txHash: Hash;
  constructor(message:string,txHash:Hash,options?:ErrorOptions) { super(message,options); this.name='SubmittedTransactionError'; this.txHash=txHash; }
}
export class QueuedTransactionError extends SubmittedTransactionError {
  readonly txId:bigint;
  constructor(txHash:Hash,txId:bigint) {super('Transaction queued for owner approval; no payment has executed',txHash);this.name='QueuedTransactionError';this.txId=txId;}
}
export interface ExecutionOptions { onSubmitted?: (txHash:Hash)=>void|Promise<void> }
export function validateAddress(value:unknown,label='address'): asserts value is `0x${string}` {
  if(typeof value!=='string'||!isAddress(value)||/^0x0{40}$/i.test(value)) throw new Error(`Invalid ${label}`);
}
export function validateAmount(value:unknown,label='amount'): asserts value is bigint {
  if(typeof value!=='bigint'||value<=0n||value>2n**256n-1n) throw new Error(`${label} must be a positive uint256 bigint in base units`);
}
export async function verifyGuardedWallet(wallet:AgentWallet):Promise<void> {
  validateAddress(wallet.address,'vault address');
  if(!wallet.walletClient.account) throw new Error('A gas signer account is required');
  if(!isHex(wallet.expectedCodeHash,{strict:true})||wallet.expectedCodeHash.length!==66) throw new Error('A pinned runtime bytecode hash is required');
  if(!wallet.chain.testnet&&!wallet.mainnetAuthorized) throw new Error('Mainnet writes require explicit owner authorization and completed external release gates');
  const [publicChain,walletChain,code]=await Promise.all([wallet.publicClient.getChainId(),wallet.walletClient.getChainId(),wallet.publicClient.getBytecode({address:wallet.address})]);
  if(publicChain!==wallet.chain.id||walletChain!==wallet.chain.id||(wallet.walletClient.chain&&wallet.walletClient.chain.id!==wallet.chain.id)) throw new Error('Wallet/public provider chain mismatch');
  if(!code||code==='0x'||keccak256(code).toLowerCase()!==wallet.expectedCodeHash.toLowerCase()) throw new Error('Vault runtime bytecode does not match pinned code hash');
  const version=await wallet.publicClient.readContract({address:wallet.address,abi:AgentVaultAbi,functionName:'securityVersion'});
  if(version!==1n) throw new Error('Unsupported vault security version; migrate legacy AgentAccount wallets');
  if(!Number.isSafeInteger(wallet.confirmations)||wallet.confirmations<1||wallet.confirmations>64) throw new Error('Invalid confirmation count');
}
async function execute(wallet:AgentWallet,functionName:string,args:readonly unknown[],options:ExecutionOptions):Promise<{txHash:Hash;receipt:TransactionReceipt}> {
  await verifyGuardedWallet(wallet);
  const simulation=await wallet.publicClient.simulateContract({address:wallet.address,abi:AgentVaultAbi,functionName,args,account:wallet.walletClient.account!,chain:wallet.chain} as Parameters<typeof wallet.publicClient.simulateContract>[0]);
  const txHash=await wallet.walletClient.writeContract({...simulation.request,account:wallet.walletClient.account!,chain:wallet.chain});
  try {
    await options.onSubmitted?.(txHash);
    const receipt=await wallet.publicClient.waitForTransactionReceipt({hash:txHash,confirmations:wallet.confirmations});
    if(receipt.transactionHash.toLowerCase()!==txHash.toLowerCase()) throw new Error('Submitted transaction was replaced; verify the replacement before recording settlement');
    if(receipt.status!=='success') throw new Error('Vault transaction reverted');
    return {txHash,receipt};
  } catch(error) {throw new SubmittedTransactionError(`Submitted transaction ${txHash} was reverted or its outcome is unconfirmed; reconcile before retrying`,txHash,{cause:error});}
}
export async function executeVaultOperation(wallet:AgentWallet,operation:VaultOperation,args:readonly unknown[],options:ExecutionOptions={}):Promise<{txHash:Hash;receipt:TransactionReceipt}> {
  if(!agentOperations.has(operation)) throw new Error('Unsupported guarded agent operation');
  const result=await execute(wallet,operation,args,options);
  if(operation!=='agentExecute')for(const log of result.receipt.logs) {
    if(log.address.toLowerCase()!==wallet.address.toLowerCase())continue;
    let pending:bigint|undefined;
    try {const event=decodeEventLog({abi:AgentVaultAbi,data:log.data,topics:log.topics});if(event.eventName==='TransactionQueued')pending=event.args.txId;}catch{/* unrelated event */}
    if(pending!==undefined)throw new QueuedTransactionError(result.txHash,pending);
  }
  return result;
}
export async function executeOwnerOperation(wallet:AgentWallet,operation:string,args:readonly unknown[],options:ExecutionOptions={}):Promise<{txHash:Hash;receipt:TransactionReceipt}> {
  if(!ownerOperations.has(operation)) throw new Error('Unsupported owner operation');
  await verifyGuardedWallet(wallet);
  const owner=await wallet.publicClient.readContract({address:wallet.address,abi:AgentVaultAbi,functionName:'owner'});
  if(typeof owner!=='string'||getAddress(owner)!==getAddress(wallet.walletClient.account!.address)) throw new Error('This operation requires the vault owner; never give owner credentials to an agent');
  return execute(wallet,operation,args,options);
}
