import {createPublicClient,decodeEventLog,getAddress,getContract,http,isAddress,keccak256,zeroAddress,type Address,type Hash,type Hex,type PublicClient,type TransactionReceipt,type WalletClient} from 'viem';
import {base,baseSepolia,mainnet,sepolia,arbitrum,arbitrumSepolia,optimism,optimismSepolia,polygon} from 'viem/chains';
import {AgentVaultAbi} from './contracts/AgentVaultAbi.js';
import {AgentVaultBytecode} from './contracts/AgentVaultBytecode.js';
import {executeVaultOperation,executeOwnerOperation,validateAddress,validateAmount,SubmittedTransactionError} from './wallet/execution.js';
import type {AgentWallet,WalletConfig,VaultContract,SupportedChain} from './types.js';
export * from './types.js';
export * from './wallet/execution.js';
export {AgentVaultAbi,AgentVaultBytecode};
/** Compatibility name identifies the new v5 vault ABI; legacy deployments are rejected. */
export const AgentAccountV2Abi=AgentVaultAbi;
export const NATIVE_TOKEN=zeroAddress;
const CHAINS={base,'base-sepolia':baseSepolia,ethereum:mainnet,'ethereum-sepolia':sepolia,arbitrum,'arbitrum-sepolia':arbitrumSepolia,optimism,'optimism-sepolia':optimismSepolia,polygon};
export function createWallet(config:WalletConfig):AgentWallet {
  const chain=CHAINS[config.chain];
  if(!chain) throw new Error('Unsupported chain');
  validateAddress(config.accountAddress,'vault address');
  if(!/^0x[0-9a-fA-F]{64}$/.test(config.expectedCodeHash??'')) throw new Error('Pinned deployment runtime code hash required; see v5 migration');
  if(!config.walletClient.account) throw new Error('WalletClient account required');
  const publicClient=config.publicClient??createPublicClient({chain,transport:http(config.rpcUrl)}) as PublicClient;
  const contract=getContract({address:config.accountAddress,abi:AgentVaultAbi,client:{public:publicClient,wallet:config.walletClient}}) as unknown as VaultContract;
  return Object.freeze({address:getAddress(config.accountAddress),chain,publicClient,walletClient:config.walletClient,contract,expectedCodeHash:config.expectedCodeHash,confirmations:config.confirmations??2,...(config.deploymentBlock!==undefined?{deploymentBlock:config.deploymentBlock}:{}),mainnetAuthorized:config.mainnetAuthorized??false});
}
function tokenAddress(token:Address):void {if(!isAddress(token)) throw new Error('Invalid token address');}
export async function setSpendPolicy(wallet:AgentWallet,policy:{token:Address;perTxLimit:bigint;periodLimit:bigint;periodLength?:number}):Promise<Hash> {
  tokenAddress(policy.token);
  const period=policy.periodLength??86400;
  if(typeof policy.perTxLimit!=='bigint'||typeof policy.periodLimit!=='bigint'||policy.perTxLimit<0n||policy.periodLimit<policy.perTxLimit||policy.periodLimit>=2n**256n||!Number.isSafeInteger(period)||period<1||period>2592000) throw new Error('Invalid spend policy: bigint limits, periodLimit >= perTxLimit, period 1–2592000 seconds required');
  return (await executeOwnerOperation(wallet,'setSpendPolicy',[policy.token,policy.perTxLimit,policy.periodLimit,BigInt(period)])).txHash;
}
function queueId(receipt:TransactionReceipt,vault:Address):bigint|undefined {
  for(const log of receipt.logs) {
    if(log.address.toLowerCase()!==vault.toLowerCase()) continue;
    try {const event=decodeEventLog({abi:AgentVaultAbi,data:log.data,topics:log.topics});if(event.eventName==='TransactionQueued')return event.args.txId;} catch { /* unrelated protocol event */ }
  }
  return undefined;
}
export type ExecutionResult={status:'executed';executed:true;txHash:Hash}|{status:'queued';executed:false;txHash:Hash;txId:bigint};
export async function agentExecute(wallet:AgentWallet,params:{to:Address;value?:bigint;data?:Hex}):Promise<ExecutionResult> {
  validateAddress(params.to,'recipient'); const value=params.value??0n; validateAmount(value,'native amount');
  if(params.data&&params.data!=='0x') throw new Error('Arbitrary operator calldata is prohibited; use guarded protocol operations');
  const {txHash,receipt}=await executeVaultOperation(wallet,'agentExecute',[params.to,value,'0x']);
  const txId=queueId(receipt,wallet.address);
  return txId===undefined?{status:'executed',executed:true,txHash}:{status:'queued',executed:false,txHash,txId};
}
export async function agentTransferToken(wallet:AgentWallet,params:{token:Address;to:Address;amount:bigint}):Promise<Hash> {
  validateAddress(params.token,'token'); validateAddress(params.to,'recipient'); validateAmount(params.amount);
  const {txHash,receipt}=await executeVaultOperation(wallet,'agentTransferToken',[params.token,params.to,params.amount]);
  if(queueId(receipt,wallet.address)!==undefined)throw new SubmittedTransactionError('Transfer queued for owner approval; payment has not executed',txHash);
  return txHash;
}
export async function checkBudget(wallet:AgentWallet,token:Address=NATIVE_TOKEN):Promise<{token:Address;perTxLimit:bigint;remainingInPeriod:bigint}> {
  tokenAddress(token); const [remainingInPeriod,policy]=await Promise.all([wallet.publicClient.readContract({address:wallet.address,abi:AgentVaultAbi,functionName:'remainingBudget',args:[token]}),wallet.publicClient.readContract({address:wallet.address,abi:AgentVaultAbi,functionName:'spendPolicies',args:[token]})]);
  const perTxLimit=policy[0];
  return {token,perTxLimit,remainingInPeriod};
}
export interface PendingApproval {txId:bigint;to:Address;value:bigint;token:Address;amount:bigint;data:Hex;createdAt:bigint;executed:boolean;cancelled:boolean;expiresAt:bigint;policyEpoch:bigint}
export async function getPendingApprovals(wallet:AgentWallet,fromId=0n,toId?:bigint):Promise<PendingApproval[]> {
  if(typeof fromId!=='bigint'||fromId<0n)throw new Error('Invalid queue cursor');
  const nonce=await wallet.publicClient.readContract({address:wallet.address,abi:AgentVaultAbi,functionName:'pendingNonce'});
  const end=toId??(fromId+100n<nonce?fromId+100n:nonce);
  if(end<fromId||end-fromId>100n||end>nonce)throw new Error('Pending queue pagination is limited to 100 items');
  const pending:PendingApproval[]=[];
  for(let txId=fromId;txId<end;txId++) {
    const p=await wallet.publicClient.readContract({address:wallet.address,abi:AgentVaultAbi,functionName:'getPending',args:[txId]});
    if(!p.executed&&!p.cancelled&&p.createdAt>0n)pending.push({txId,...p});
  }
  return pending;
}
export async function approveTransaction(wallet:AgentWallet,txId:bigint):Promise<Hash> {if(typeof txId!=='bigint'||txId<0n)throw new Error('Invalid pending ID');return(await executeOwnerOperation(wallet,'approvePending',[txId])).txHash;}
export async function cancelTransaction(wallet:AgentWallet,txId:bigint):Promise<Hash> {if(typeof txId!=='bigint'||txId<0n)throw new Error('Invalid pending ID');return(await executeOwnerOperation(wallet,'cancelPending',[txId])).txHash;}
export async function setOperator(wallet:AgentWallet,operator:Address,authorized:boolean):Promise<Hash> {validateAddress(operator,'operator');if(typeof authorized!=='boolean')throw new Error('Authorization must be boolean');return(await executeOwnerOperation(wallet,'setOperator',[operator,authorized])).txHash;}
export async function setRecipient(wallet:AgentWallet,recipient:Address,authorized:boolean):Promise<Hash> {validateAddress(recipient,'recipient');if(typeof authorized!=='boolean')throw new Error('Authorization must be boolean');return(await executeOwnerOperation(wallet,'setRecipient',[recipient,authorized])).txHash;}
export async function setPaused(wallet:AgentWallet,paused:boolean):Promise<Hash> {if(typeof paused!=='boolean')throw new Error('Paused must be boolean');return(await executeOwnerOperation(wallet,'setPaused',[paused])).txHash;}
export async function batchAgentTransfer(wallet:AgentWallet,transfers:readonly {token:Address;to:Address;amount:bigint}[]):Promise<Hash[]> {
  if(!Array.isArray(transfers)||transfers.length<1||transfers.length>100)throw new Error('Batch size must be 1–100; transfers execute sequentially, never atomically');
  const hashes:Hash[]=[];for(const transfer of transfers)hashes.push(await agentTransferToken(wallet,transfer));return hashes;
}
export async function getBudgetForecast(wallet:AgentWallet,token:Address=NATIVE_TOKEN) {
  const budget=await checkBudget(wallet,token);
  const [perTx,periodLimit,periodLength,windowStart,spent]=await wallet.publicClient.readContract({address:wallet.address,abi:AgentVaultAbi,functionName:'spendPolicies',args:[token]});
  const block=await wallet.publicClient.getBlock();
  const elapsed=block.timestamp>=windowStart+periodLength;
  return {...budget,perTxLimit:perTx,periodLimit,periodLength,periodStart:windowStart,periodSpent:elapsed?0n:spent,secondsUntilReset:elapsed?0n:windowStart+periodLength-block.timestamp,utilizationPercent:periodLimit>0n?Number((elapsed?0n:spent)*10000n/periodLimit)/100:0};
}
export async function getWalletHealth(wallet:AgentWallet,operatorsToCheck:readonly Address[]=[],tokensToCheck:readonly Address[]=[NATIVE_TOKEN]) {
  if(operatorsToCheck.length>100||tokensToCheck.length>100)throw new Error('Health lookup limit exceeded');
  const [owner,paused,policyEpoch,pendingNonce]=await Promise.all(['owner','paused','policyEpoch','pendingNonce'].map(functionName=>wallet.publicClient.readContract({address:wallet.address,abi:AgentVaultAbi,functionName} as Parameters<typeof wallet.publicClient.readContract>[0])));
  const activeOperators=await Promise.all(operatorsToCheck.map(async address=>({address,active:await wallet.publicClient.readContract({address:wallet.address,abi:AgentVaultAbi,functionName:'isOperatorActive',args:[address]})})));
  return {address:wallet.address,owner,paused,policyEpoch,pendingNonce,activeOperators,budgets:await Promise.all(tokensToCheck.map(token=>getBudgetForecast(wallet,token)))};
}
export async function getActivityHistory(wallet:AgentWallet,options:{fromBlock?:bigint;toBlock?:bigint|'latest'}={}) {
  const fromBlock=options.fromBlock??wallet.deploymentBlock;
  if(fromBlock===undefined)throw new Error('Specify deploymentBlock or fromBlock for bounded activity queries');
  const toBlock=options.toBlock==='latest'||options.toBlock===undefined?await wallet.publicClient.getBlockNumber():options.toBlock;
  if(fromBlock<0n||toBlock<fromBlock||toBlock-fromBlock>10000n)throw new Error('Activity query must span at most 10,000 blocks');
  return wallet.publicClient.getContractEvents({address:wallet.address,abi:AgentVaultAbi,fromBlock,toBlock});
}
export function onTransactionQueued(wallet:AgentWallet,callback:Parameters<PublicClient['watchContractEvent']>[0]['onLogs']) {return wallet.publicClient.watchContractEvent({address:wallet.address,abi:AgentVaultAbi,eventName:'TransactionQueued',onLogs:callback});}
export function onTransactionExecuted(wallet:AgentWallet,callback:Parameters<PublicClient['watchContractEvent']>[0]['onLogs']) {return wallet.publicClient.watchContractEvent({address:wallet.address,abi:AgentVaultAbi,eventName:'TransactionExecuted',onLogs:callback});}
export interface DeployWalletConfig {chain:SupportedChain;owner:Address;operator:Address;router:Address;aavePool:Address;tokenMessenger:Address;sourceDomain:number;walletClient:WalletClient;publicClient:PublicClient}
export async function deployWallet(config:DeployWalletConfig):Promise<{walletAddress:Address;txHash:Hash;expectedCodeHash:Hash;deploymentBlock:bigint}> {
  const chain=CHAINS[config.chain];
  if(!chain?.testnet)throw new Error('SDK deployment flow is testnet-only until independent deployment audit/release gates are completed');
  for(const [label,value]of Object.entries({owner:config.owner,operator:config.operator,router:config.router,aavePool:config.aavePool,tokenMessenger:config.tokenMessenger}))validateAddress(value,label);
  if(!config.walletClient.account||getAddress(config.walletClient.account.address)!==getAddress(config.owner))throw new Error('Deploy from the explicit owner wallet, never an agent key');
  if(config.owner.toLowerCase()===config.operator.toLowerCase())throw new Error('Owner and operator must be separate accounts');
  if(!Number.isSafeInteger(config.sourceDomain)||config.sourceDomain<0||config.sourceDomain>2**32-1)throw new Error('Invalid Circle source domain');
  if(await config.publicClient.getChainId()!==chain.id||await config.walletClient.getChainId()!==chain.id)throw new Error('Deployment provider chain mismatch');
  const txHash=await config.walletClient.deployContract({abi:AgentVaultAbi,bytecode:AgentVaultBytecode,args:[config.owner,config.operator,config.router,config.aavePool,config.tokenMessenger,config.sourceDomain],account:config.walletClient.account,chain});
  try {
    const receipt=await config.publicClient.waitForTransactionReceipt({hash:txHash,confirmations:2});
    if(receipt.transactionHash.toLowerCase()!==txHash.toLowerCase())throw new Error('Deployment transaction was replaced');
    if(receipt.status!=='success'||!receipt.contractAddress)throw new Error('Vault deployment reverted or missing deployment address');
    const code=await config.publicClient.getBytecode({address:receipt.contractAddress});if(!code||code==='0x')throw new Error('Deployment bytecode unavailable');
    return {walletAddress:receipt.contractAddress,txHash,expectedCodeHash:keccak256(code),deploymentBlock:receipt.blockNumber};
  } catch(error) {
    throw new SubmittedTransactionError('Vault deployment outcome is reverted or unconfirmed; reconcile before retry',txHash,{cause:error});
  }
}
export * from './identity/index.js';
export * from './x402/index.js';
export * from './swap/index.js';
export * from './bridge/index.js';
export * from './policy/SpendingPolicy.js';
export * from './staking/index.js';
export * from './verify/index.js';
