import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createVM, runTx } from '@ethereumjs/vm';
import { createCustomCommon, Mainnet, Hardfork } from '@ethereumjs/common';
import { createLegacyTx } from '@ethereumjs/tx';
import { createBlock } from '@ethereumjs/block';
import { createAccount, createAddressFromPrivateKey, createAddressFromString, bytesToHex, hexToBytes } from '@ethereumjs/util';
import { encodeFunctionData, decodeFunctionResult, encodeDeployData, parseAbi, zeroAddress, padHex, decodeEventLog, encodeErrorResult } from 'viem';
import { compileContracts } from '../../scripts/contracts/compile.mjs';

// Disposable local-only credentials. Never use these identities on a public chain.
const keys = [1,2,3].map(n => new Uint8Array(32).fill(n));
const addresses = keys.map(key => createAddressFromPrivateKey(key).toString());
const [owner, operator, stranger] = addresses;
const api = parseAbi([
  'function setSpendPolicy(address token,uint256 perTx,uint256 periodLimit,uint256 periodLength)',
  'function setRecipient(address recipient,bool allowed)',
  'function setOperator(address operator,bool allowed)',
  'function setPaused(bool paused)',
  'function setSwapPair(address tokenIn,address tokenOut,uint256 minRateX18,uint256 validUntil)',
  'function setBridgeDestination(uint32 domain,bytes32 recipient)',
  'function agentExecute(address to,uint256 value,bytes data)',
  'function agentTransferToken(address token,address to,uint256 amount)',
  'function agentSwap(address tokenIn,address tokenOut,uint256 amountIn,uint256 minimumOut,uint24 fee,uint256 deadline) returns(uint256)',
  'function agentSupply(address token,uint256 amount)',
  'function agentWithdraw(address token,uint256 amount) returns(uint256)',
  'function agentBridge(address token,uint256 amount,uint32 destinationDomain,bytes32 recipient,uint256 maxFee,uint32 minFinalityThreshold)',
  'function remainingBudget(address token) view returns(uint256)',
  'function securityVersion() view returns(uint256)',
  'function owner() view returns(address)',
  'function router() view returns(address)',
  'function aavePool() view returns(address)',
  'function tokenMessenger() view returns(address)',
  'function sourceDomain() view returns(uint32)',
  'function isOperatorActive(address operator) view returns(bool)',
  'function stakingPrincipal(address token) view returns(uint256)',
  'function pendingNonce() view returns(uint256)',
  'function getPending(uint256 id) view returns((address to,uint256 value,address token,uint256 amount,bytes data,uint256 createdAt,bool executed,bool cancelled,uint256 expiresAt,uint256 policyEpoch))',
  'function approvePending(uint256 id)',
  'function cancelPending(uint256 id)',
  'function ownerExecute(address to,uint256 value,bytes data) returns(bytes)',
  'event TransactionExecuted(address indexed target,uint256 value,address indexed executor)',
  'event TransactionQueued(uint256 indexed txId,address indexed to,uint256 value,address token,uint256 amount)',
  'event TransactionApproved(uint256 indexed txId)',
  'event TransactionCancelled(uint256 indexed txId)',
]);
let compiled;
before(() => { compiled=compileContracts(true); });

async function fixture() {
  const common=createCustomCommon({ chainId:31337 },Mainnet,{ hardfork:Hardfork.Cancun });
  const vm=await createVM({common});
  let timestamp=1_800_000_000n;
  const block=()=>createBlock({header:{number:1n,timestamp,gasLimit:30_000_000n,baseFeePerGas:0n}},{common});
  for (const address of addresses) await vm.stateManager.putAccount(createAddressFromString(address),createAccount({balance:10n**24n}));
  async function transaction(to,data='0x',caller=owner,value=0n) {
    const key=keys[addresses.indexOf(caller)];
    assert.ok(key,'only disposable local transaction signers');
    const account=await vm.stateManager.getAccount(createAddressFromString(caller));
    const tx=createLegacyTx({nonce:account.nonce,gasLimit:8_000_000n,gasPrice:1n,to,value,data:hexToBytes(data)},{common}).sign(key);
    const result=await runTx(vm,{tx,block:block()});
    return {result,ok:!result.execResult.exceptionError,data:bytesToHex(result.execResult.returnValue)};
  }
  async function deploy(file,name,args=[]) {
    const artifact=compiled.contracts[file][name];
    const result=await transaction(undefined,encodeDeployData({abi:artifact.abi,bytecode:`0x${artifact.evm.bytecode.object}`,args}));
    assert.equal(result.ok,true,`${name} must deploy: ${result.result.execResult.exceptionError?.error}`);
    return {address:result.result.createdAddress.toString(),abi:artifact.abi};
  }
  const input=await deploy('tests/contracts/Adversaries.sol','TestToken');
  const output=await deploy('tests/contracts/Adversaries.sol','TestToken');
  const router=await deploy('tests/contracts/Adversaries.sol','TestRouter');
  const pool=await deploy('tests/contracts/Adversaries.sol','TestPool');
  const messenger=await deploy('tests/contracts/Adversaries.sol','TestMessenger');
  const receiver=await deploy('tests/contracts/Adversaries.sol','TestReceiver');
  const vault=await deploy('contracts/AgentVault.sol','AgentVault',[owner,operator,router.address,pool.address,messenger.address,6]);
  vault.abi=api;
  const call=(target,name,args=[],caller=owner)=>transaction(target.address,encodeFunctionData({abi:target.abi,functionName:name,args}),caller);
  async function success(target,name,args=[],caller=owner) {
    const r=await call(target,name,args,caller);
    assert.equal(r.ok,true,`${name} should succeed: ${r.result.execResult.exceptionError?.error}, return ${r.data}`);
    return r;
  }
  async function fails(target,name,args=[],caller=operator,reason) {
    const r=await call(target,name,args,caller);
    assert.equal(r.ok,false,`${name} should revert`);
    if(reason) assert.equal(r.data.slice(0,10),encodeErrorResult({abi:compiled.contracts['contracts/AgentVault.sol'].AgentVault.abi,errorName:reason}).slice(0,10),`${name} must fail for ${reason}`);
    return r;
  }
  async function read(target,name,args=[]) {
    const r=await vm.evm.runCall({to:createAddressFromString(target.address),caller:createAddressFromString(owner),data:hexToBytes(encodeFunctionData({abi:target.abi,functionName:name,args})),gasLimit:8_000_000n,block:block(),isStatic:true});
    assert.equal(r.execResult.exceptionError,undefined,`${name} read must succeed`);
    return decodeFunctionResult({abi:target.abi,functionName:name,data:bytesToHex(r.execResult.returnValue)});
  }
  async function configure() {
    await success(vault,'setRecipient',[stranger,true]);
    for (const token of [zeroAddress,input.address,output.address]) await success(vault,'setSpendPolicy',[token,100n,200n,1000n]);
    await success(input,'mint',[vault.address,1000n]);
    assert.equal((await transaction(vault.address,'0x',owner,1000n)).ok,true,'vault must receive native deposits');
  }
  return {vm,common,transaction,deploy,call,success,fails,read,configure,vault,input,output,router,pool,messenger,receiver,advance:n=>{timestamp+=BigInt(n)},now:()=>timestamp};
}

function eventNames(result) {
  return (result.result.execResult.logs??[]).flatMap(log=>{
    try {return [decodeEventLog({abi:api,data:bytesToHex(log[2]),topics:log[1].map(bytesToHex)}).eventName];} catch{return [];}
  });
}

test('owner configures policy; operator native payment is bounded and owner identity is distinct',async()=>{
  const f=await fixture(); await f.configure();
  assert.equal(await f.read(f.vault,'securityVersion'),1n);
  assert.equal((await f.read(f.vault,'owner')).toLowerCase(),owner);
  assert.equal(await f.read(f.vault,'sourceDomain'),6);
  assert.equal((await f.read(f.vault,'router')).toLowerCase(),f.router.address);
  const r=await f.success(f.vault,'agentExecute',[stranger,60n,'0x'],operator);
  assert.ok(eventNames(r).includes('TransactionExecuted'));
  assert.equal(await f.read(f.vault,'remainingBudget',[zeroAddress]),140n);
  await f.success(f.vault,'agentExecute',[stranger,60n,'0x'],operator);
  await f.success(f.vault,'agentExecute',[stranger,60n,'0x'],operator);
  await f.success(f.vault,'agentExecute',[stranger,60n,'0x'],operator);
  assert.equal(await f.read(f.vault,'remainingBudget',[zeroAddress]),20n);
  assert.equal(await f.read(f.vault,'pendingNonce'),1n,'period excess must queue rather than spend');
  f.advance(1000);
  assert.equal(await f.read(f.vault,'remainingBudget',[zeroAddress]),200n);
  await f.success(f.vault,'agentExecute',[stranger,100n,'0x'],operator);
});

test('operator cannot administer, exploit calldata, call owner recovery, or bypass pause/recipient policy',async()=>{
  const f=await fixture(); await f.configure();
  for(const [name,args] of [
    ['setRecipient',[operator,true]],['setOperator',[stranger,true]],['setSpendPolicy',[zeroAddress,999n,999n,1n]],
    ['setPaused',[true]],['setSwapPair',[f.input.address,f.output.address,1n,f.now()+100n]],['setBridgeDestination',[0,padHex(stranger)]],
    ['ownerExecute',[stranger,1n,'0x']],['approvePending',[0n]],['cancelPending',[0n]],
  ]) await f.fails(f.vault,name,args);
  await f.fails(f.vault,'agentExecute',[stranger,1n,'0x1234']);
  await f.fails(f.vault,'agentExecute',[operator,1n,'0x']);
  await f.fails(f.vault,'agentExecute',[stranger,0n,'0x']);
  await f.fails(f.vault,'agentExecute',[stranger,1n,'0x'],stranger);
  await f.success(f.vault,'agentExecute',[stranger,1n,'0x'],owner);
  await f.fails(f.vault,'setOperator',[owner,true],owner);
  await f.success(f.vault,'setPaused',[true]);
  assert.equal(await f.read(f.vault,'isOperatorActive',[operator]),false);
  await f.fails(f.vault,'agentExecute',[stranger,1n,'0x']);
  await f.success(f.vault,'ownerExecute',[stranger,1n,'0x']);
  await f.success(f.vault,'setPaused',[false]);
  await f.success(f.vault,'setOperator',[operator,false]);
  await f.fails(f.vault,'agentTransferToken',[f.input.address,stranger,1n]);
});

test('queued token/native transfers retain complete content, execute only once, and can be cancelled',async()=>{
  const f=await fixture(); await f.configure();
  const r=await f.success(f.vault,'agentTransferToken',[f.input.address,stranger,150n],operator);
  assert.ok(eventNames(r).includes('TransactionQueued'));
  const p=await f.read(f.vault,'getPending',[0n]);
  assert.equal(p.to.toLowerCase(),stranger); assert.equal(p.token.toLowerCase(),f.input.address);
  assert.equal(p.amount,150n); assert.equal(p.value,0n); assert.equal(p.executed,false); assert.equal(p.cancelled,false);
  assert.equal(p.data,encodeFunctionData({abi:f.input.abi,functionName:'transfer',args:[stranger,150n]}));
  assert.equal(p.createdAt,f.now()); assert.equal(p.expiresAt,f.now()+86400n); assert.ok(p.policyEpoch>0n);
  assert.equal(await f.read(f.input,'balanceOf',[stranger]),0n);
  const approved=await f.success(f.vault,'approvePending',[0n]);
  assert.ok(eventNames(approved).includes('TransactionApproved'));
  assert.equal(await f.read(f.input,'balanceOf',[stranger]),150n);
  assert.equal((await f.read(f.vault,'getPending',[0n])).executed,true);
  await f.fails(f.vault,'approvePending',[0n],owner);
  await f.success(f.vault,'agentExecute',[stranger,101n,'0x'],operator);
  const native=await f.read(f.vault,'getPending',[1n]);
  assert.equal(native.value,101n); assert.equal(native.token,zeroAddress); assert.equal(native.data,'0x');
  await f.success(f.vault,'cancelPending',[1n]);
  assert.equal((await f.read(f.vault,'getPending',[1n])).cancelled,true);
  await f.fails(f.vault,'approvePending',[1n],owner);
  await f.fails(f.vault,'getPending',[2n],owner);
});

test('policy changes, revoked operators and queue expiry cannot replay old approvals',async()=>{
  const f=await fixture(); await f.configure();
  await f.success(f.vault,'agentExecute',[stranger,101n,'0x'],operator);
  await f.success(f.vault,'setRecipient',[stranger,false]);
  await f.fails(f.vault,'approvePending',[0n],owner);
  await f.success(f.vault,'setRecipient',[stranger,true]);
  await f.fails(f.vault,'approvePending',[0n],owner);
  await f.success(f.vault,'agentExecute',[stranger,101n,'0x'],operator);
  await f.success(f.vault,'setOperator',[operator,false]);
  await f.fails(f.vault,'approvePending',[1n],owner);
  await f.success(f.vault,'setOperator',[operator,true]);
  await f.success(f.vault,'agentExecute',[stranger,101n,'0x'],operator);
  f.advance(86401);
  await f.fails(f.vault,'approvePending',[2n],owner);
});

test('malicious token/recipient reentrancy and failed payment restore balances, budget and pending state',async()=>{
  const f=await fixture(); await f.configure();
  await f.success(f.vault,'setRecipient',[f.receiver.address,true]);
  await f.success(f.vault,'setOperator',[f.receiver.address,true]);
  const attack=encodeFunctionData({abi:api,functionName:'agentExecute',args:[stranger,1n,'0x']});
  await f.success(f.receiver,'configure',[f.vault.address,attack,false]);
  await f.fails(f.vault,'agentExecute',[f.receiver.address,50n,'0x']);
  assert.equal(await f.read(f.vault,'remainingBudget',[zeroAddress]),200n);
  assert.equal((await f.vm.stateManager.getAccount(createAddressFromString(f.receiver.address)))?.balance??0n,0n);
  await f.success(f.vault,'setOperator',[f.input.address,true]);
  const tokenAttack=encodeFunctionData({abi:api,functionName:'agentTransferToken',args:[f.input.address,stranger,1n]});
  await f.success(f.input,'configure',[2n,f.vault.address,tokenAttack]);
  await f.fails(f.vault,'agentTransferToken',[f.input.address,stranger,50n]);
  assert.equal(await f.read(f.vault,'remainingBudget',[f.input.address]),200n);
  assert.equal(await f.read(f.input,'balanceOf',[f.vault.address]),1000n);
  await f.success(f.input,'configure',[1n,zeroAddress,'0x']);
  await f.fails(f.vault,'agentTransferToken',[f.input.address,stranger,50n]);
  await f.success(f.vault,'agentTransferToken',[f.input.address,stranger,150n],operator);
  await f.fails(f.vault,'approvePending',[0n],owner);
  assert.equal((await f.read(f.vault,'getPending',[0n])).executed,false);
});

test('swaps enforce configured floor/deadline and actual output, clear exact approvals, and roll back failures',async()=>{
  const f=await fixture(); await f.configure();
  const args=[f.input.address,f.output.address,50n,90n,3000,f.now()+60n];
  await f.fails(f.vault,'agentSwap',args);
  await f.success(f.vault,'setSwapPair',[f.input.address,f.output.address,2n*10n**18n,f.now()+3600n]);
  await f.fails(f.vault,'agentSwap',args);
  const good=[...args]; good[3]=100n;
  for(const changed of [[2,0n],[3,0n],[4,42],[5,f.now()-1n],[5,f.now()+3601n]]) { const a=[...good]; a[changed[0]]=changed[1]; await f.fails(f.vault,'agentSwap',a); }
  await f.success(f.vault,'agentSwap',good,operator);
  assert.equal(await f.read(f.input,'allowance',[f.vault.address,f.router.address]),0n);
  assert.equal(await f.read(f.router,'observedAllowance'),50n);
  assert.equal((await f.read(f.router,'observedRecipient')).toLowerCase(),f.vault.address);
  assert.equal(await f.read(f.output,'balanceOf',[f.vault.address]),100n);
  assert.equal(await f.read(f.vault,'remainingBudget',[f.input.address]),150n);
  await f.success(f.vault,'setOperator',[f.router.address,true]);
  const attack=encodeFunctionData({abi:api,functionName:'agentTransferToken',args:[f.input.address,stranger,1n]});
  for(const mode of [1n,2n,3n,4n]) {
    await f.success(f.router,'configure',[mode,f.vault.address,attack]);
    await f.fails(f.vault,'agentSwap',good);
    assert.equal(await f.read(f.input,'allowance',[f.vault.address,f.router.address]),0n);
    assert.equal(await f.read(f.vault,'remainingBudget',[f.input.address]),150n);
    assert.equal(await f.read(f.output,'balanceOf',[f.vault.address]),100n);
  }
  await f.success(f.router,'configure',[0n,zeroAddress,'0x']);
  f.advance(3601);
  good[5]=f.now()+60n;
  await f.fails(f.vault,'agentSwap',good);
});

test('AAVE supply and withdrawals bind beneficiary to vault, account principal and reject inconsistent pool results',async()=>{
  const f=await fixture(); await f.configure();
  await f.success(f.vault,'agentSupply',[f.input.address,100n],operator);
  assert.equal(await f.read(f.vault,'stakingPrincipal',[f.input.address]),100n);
  assert.equal(await f.read(f.input,'allowance',[f.vault.address,f.pool.address]),0n);
  assert.equal(await f.read(f.pool,'observedAllowance'),100n);
  assert.equal((await f.read(f.pool,'observedBeneficiary')).toLowerCase(),f.vault.address);
  await f.success(f.pool,'configure',[3n]);
  await f.fails(f.vault,'agentWithdraw',[f.input.address,50n]);
  assert.equal(await f.read(f.vault,'stakingPrincipal',[f.input.address]),100n);
  await f.success(f.pool,'configure',[2n]);
  await f.success(f.vault,'agentWithdraw',[f.input.address,50n],operator);
  assert.equal(await f.read(f.vault,'stakingPrincipal',[f.input.address]),75n);
  assert.equal(await f.read(f.input,'balanceOf',[f.vault.address]),925n);
  await f.success(f.pool,'configure',[1n]);
  await f.fails(f.vault,'agentSupply',[f.input.address,25n]);
  assert.equal(await f.read(f.input,'allowance',[f.vault.address,f.pool.address]),0n);
  assert.equal(await f.read(f.vault,'remainingBudget',[f.input.address]),50n);
  await f.fails(f.vault,'agentSupply',[f.input.address,101n]);
  await f.fails(f.vault,'agentWithdraw',[f.input.address,0n]);
});

test('CCTP V2 burn uses owner recipient and exact approval with validated fees/finality and rollback',async()=>{
  const f=await fixture(); await f.configure();
  const recipient=padHex(stranger);
  const args=[f.input.address,50n,0,recipient,0n,2000];
  await f.fails(f.vault,'agentBridge',args);
  await f.success(f.vault,'setBridgeDestination',[0,recipient]);
  for(const change of [[1,0n],[2,6],[3,padHex(operator)],[4,50n],[5,0],[5,2001]]) {
    const a=[...args];a[change[0]]=change[1];await f.fails(f.vault,'agentBridge',a);
  }
  await f.success(f.vault,'agentBridge',args,operator);
  assert.equal(await f.read(f.messenger,'observedRecipient'),recipient);
  assert.equal(await f.read(f.messenger,'observedCaller'),padHex(zeroAddress));
  assert.equal(await f.read(f.messenger,'observedFinality'),2000);
  assert.equal(await f.read(f.messenger,'observedFee'),0n);
  assert.equal(await f.read(f.messenger,'observedAllowance'),50n);
  assert.equal(await f.read(f.input,'allowance',[f.vault.address,f.messenger.address]),0n);
  await f.success(f.messenger,'configure',[1n]);
  await f.fails(f.vault,'agentBridge',args);
  assert.equal(await f.read(f.vault,'remainingBudget',[f.input.address]),150n);
  assert.equal(await f.read(f.input,'balanceOf',[f.vault.address]),950n);
  assert.equal(await f.read(f.input,'allowance',[f.vault.address,f.messenger.address]),0n);
});


test('nonstandard token debits/transfer fees cannot silently exceed caps or short-pay recipients',async()=>{
  const f=await fixture(); await f.configure();
  for(const mode of [3n,4n]) {
    await f.success(f.input,'configure',[mode,zeroAddress,'0x']);
    await f.fails(f.vault,'agentTransferToken',[f.input.address,stranger,10n]);
    assert.equal(await f.read(f.vault,'remainingBudget',[f.input.address]),200n);
    assert.equal(await f.read(f.input,'balanceOf',[f.vault.address]),1000n);
    assert.equal(await f.read(f.input,'balanceOf',[stranger]),0n);
    await f.success(f.vault,'agentTransferToken',[f.input.address,stranger,101n],operator);
    const id=(await f.read(f.vault,'pendingNonce'))-1n;
    await f.fails(f.vault,'approvePending',[id],owner);
    assert.equal((await f.read(f.vault,'getPending',[id])).executed,false);
  }
});

test('constructor/default-deny and malformed owner policies reject invalid roles/tokens/targets',async()=>{
  const f=await fixture();
  const artifact=compiled.contracts['contracts/AgentVault.sol'].AgentVault;
  const valid=[owner,operator,f.router.address,f.pool.address,f.messenger.address,6];
  for(const change of [[0,zeroAddress],[1,zeroAddress],[1,owner],[2,stranger],[3,stranger],[4,stranger]]) {
    const args=[...valid];args[change[0]]=change[1];
    const r=await f.transaction(undefined,encodeDeployData({abi:artifact.abi,bytecode:`0x${artifact.evm.bytecode.object}`,args}));
    assert.equal(r.ok,false,'invalid deployment must revert');
  }
  assert.equal(await f.read(f.vault,'remainingBudget',[zeroAddress]),0n);
  await f.fails(f.vault,'agentExecute',[stranger,1n,'0x']);
  await f.success(f.vault,'setRecipient',[stranger,true]);
  await f.fails(f.vault,'agentTransferToken',[f.input.address,stranger,1n]);
  for(const args of [[stranger,1n,1n,1n],[f.vault.address,1n,1n,1n],[f.router.address,1n,1n,1n],[zeroAddress,0n,1n,1n],[zeroAddress,2n,1n,1n],[zeroAddress,1n,1n,0n],[zeroAddress,1n,1n,31536001n]]) {
    await f.fails(f.vault,'setSpendPolicy',args,owner);
  }
  for(const to of [zeroAddress,f.vault.address,f.router.address,f.pool.address,f.messenger.address]) await f.fails(f.vault,'setRecipient',[to,true],owner);
  await f.fails(f.vault,'ownerExecute',[f.vault.address,0n,'0x'],owner);
  await f.fails(f.vault,'ownerExecute',[stranger,0n,'0x1234'],owner);
  await f.fails(f.vault,'ownerExecute',[f.input.address,0n,`0x${'00'.repeat(16385)}`],owner);
  await f.success(f.vault,'setSpendPolicy',[f.input.address,10n,20n,100n]);
  await f.success(f.vault,'setSpendPolicy',[f.input.address,0n,0n,0n]);
  assert.equal(await f.read(f.vault,'remainingBudget',[f.input.address]),0n);
  await f.fails(f.vault,'agentTransferToken',[f.input.address,stranger,1n]);
});


test('every operator operation enforces caller and pause before protocol interaction',async()=>{
  const f=await fixture(); await f.configure();
  await f.success(f.vault,'setSwapPair',[f.input.address,f.output.address,2n*10n**18n,f.now()+3600n]);
  await f.success(f.vault,'setBridgeDestination',[0,padHex(stranger)]);
  assert.equal(await f.read(f.vault,'isOperatorActive',[operator]),true);
  assert.equal(await f.read(f.vault,'isOperatorActive',[owner]),false);
  const operations=[
    ['agentExecute',[stranger,10n,'0x']],
    ['agentTransferToken',[f.input.address,stranger,10n]],
    ['agentSwap',[f.input.address,f.output.address,10n,20n,3000,f.now()+60n]],
    ['agentSupply',[f.input.address,10n]],
    ['agentWithdraw',[f.input.address,10n]],
    ['agentBridge',[f.input.address,10n,0,padHex(stranger),0n,2000]],
  ];
  for(const [name,args] of operations) await f.fails(f.vault,name,args,stranger,'Unauthorized');
  await f.success(f.vault,'agentExecute',[stranger,101n,'0x'],operator);
  await f.success(f.vault,'setPaused',[true]);
  for(const [name,args] of operations) {
    await f.fails(f.vault,name,args,operator,'Paused');
    await f.fails(f.vault,name,args,owner,'Paused');
  }
  await f.fails(f.vault,'approvePending',[0n],owner,'Paused');
  assert.equal(await f.read(f.input,'allowance',[f.vault.address,f.router.address]),0n);
  assert.equal(await f.read(f.input,'allowance',[f.vault.address,f.pool.address]),0n);
  assert.equal(await f.read(f.input,'allowance',[f.vault.address,f.messenger.address]),0n);
  assert.equal(await f.read(f.vault,'remainingBudget',[f.input.address]),200n);
});

test('committed ABI and deployment bytecode match deterministic pinned compiler outputs',()=>{
  const first=compileContracts();
  const second=compileContracts();
  const artifact=first.contracts['contracts/AgentVault.sol'].AgentVault;
  assert.deepEqual(first,second);
  const abiText=readFileSync(new URL('../../src/contracts/AgentVaultAbi.ts',import.meta.url),'utf8');
  const bytecodeText=readFileSync(new URL('../../src/contracts/AgentVaultBytecode.ts',import.meta.url),'utf8');
  const exportedAbi=JSON.parse(abiText.slice(abiText.indexOf('=')+1,abiText.lastIndexOf(' as const;')));
  assert.deepEqual(exportedAbi,artifact.abi);
  assert.ok(bytecodeText.includes(`'0x${artifact.evm.bytecode.object}' as const`));
  assert.ok(artifact.evm.deployedBytecode.object.length/2 < 24576,'runtime must fit EIP-170');
  for(const expected of ['TransactionExecuted','TransactionQueued','TransactionApproved','TransactionCancelled']) {
    assert.ok(artifact.abi.some(item=>item.type==='event'&&item.name===expected));
  }
});
