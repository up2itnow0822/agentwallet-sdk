import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), 'agentwallet-package-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const run = (file, args, cwd) => execFileSync(file, args, { cwd, stdio: 'pipe', encoding: 'utf8', timeout: 180_000 });

try {
  const [packed] = JSON.parse(run(npm, ['pack', '--json', '--ignore-scripts', '--pack-destination', scratch], root));
  const paths = packed.files.map(file => file.path);
  assert(paths.includes('dist/index.js') && paths.includes('dist/index.d.ts'), 'Built package entrypoints missing');
  assert(paths.includes('contracts/AgentVault.sol') && paths.includes('SECURITY.md'), 'Release guidance or contract missing');
  const releaseGuides = ['CONTRIBUTING.md', 'docs/migration.md', 'src/identity/MIGRATION.md', 'docs/security/threat-model.md', 'docs/security/remediation.md', 'docs/security/release-readiness.md', 'docs/security/ci-evaluation.md'];
  for (const path of releaseGuides) assert(paths.includes(path), `Linked release guide missing from tarball: ${path}`);
  assert(!paths.some(path => /(?:^|\/)(?:node_modules|__tests__|\.env|coverage)(?:\/|$)|\.test\.[cm]?js$/.test(path)), 'Tests, secrets or dependencies leaked into tarball');
  await writeFile(join(scratch, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run(npm, ['install', '--ignore-scripts', '--no-audit', '--no-fund', join(scratch, packed.filename), `@types/node@${manifest.devDependencies['@types/node']}`], scratch);
  const subpaths = Object.keys(manifest.exports).map(path => path === '.' ? manifest.name : `${manifest.name}${path.slice(1)}`);
  const runtime = `
    import assert from 'node:assert/strict';
    const paths = ${JSON.stringify(subpaths)};
    for (const path of paths) assert(Object.keys(await import(path)).length > 0, path);
    const sdk = await import('agentwallet-sdk');
    assert.equal(sdk.CHAIN_IDS['base-sepolia'], 84532);
    assert.equal(sdk.CHAIN_IDS['optimism-sepolia'], 11155420);
    assert.equal(sdk.GUARDED_TRANSACTION_SCHEME, 'agent-vault-tx-v1');
    assert.equal(typeof sdk.GuardedPaymentMerchant, 'function');
    assert(sdk.AgentVaultBytecode.startsWith('0x') && sdk.AgentVaultBytecode.length > 1000);
    assert(sdk.AgentVaultAbi.some(item => item.name === 'agentTransferToken'));
    assert.throws(() => sdk.createWallet({ accountAddress: '0x1111111111111111111111111111111111111111', chain: 'base-sepolia', walletClient: {} }), /Pinned deployment/);
    console.log('Fresh packed consumer imports all package exports and rejects unpinned vaults.');
  `;
  await writeFile(join(scratch, 'smoke.mjs'), runtime);
  process.stdout.write(run(process.execPath, ['smoke.mjs'], scratch));
  const migration = await readFile(join(scratch, 'node_modules', manifest.name, 'docs', 'migration.md'), 'utf8');
  const examples = [...migration.matchAll(/```ts\n([\s\S]*?)\n```/g)].map(match => match[1]);
  const paymentExample = examples[0];
  assert(paymentExample?.includes('new X402Client(wallet,'), 'Documented payment example missing');
  const fetchOffset = paymentExample.indexOf('\nconst response = await payments.fetch(');
  assert(fetchOffset > 0, 'Documented fetch boundary missing; refuse to execute the payment example');
  const initialization = paymentExample.slice(0, fetchOffset);
  assert(initialization.length > 0 && initialization.includes('new X402Client'), 'Documented constructor missing');
  const paymentsDirectory = join(scratch, 'payments-ledger');
  await mkdir(paymentsDirectory, { mode: 0o700 });
  await writeFile(join(scratch, 'documented-payment.mjs'), `
    import assert from 'node:assert/strict';
    const approvedRecipient = '0x3333333333333333333333333333333333333333';
    const circleTestUsdc = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
    const paymentsDirectory = ${JSON.stringify(paymentsDirectory)};
    // Constructor-only disposable fixture: no signing, RPC, HTTP or funds.
    const wallet = {address:'0x2222222222222222222222222222222222222222',chain:{id:84532},confirmations:2};
    ${initialization}
    assert.equal(payments.getDailySpendSummary().global, 0n);
    console.log('Packed payment migration example constructs with a private durable store.');
  `);
  process.stdout.write(run(process.execPath, ['documented-payment.mjs'], scratch));
  await writeFile(join(scratch, 'types.mts'), subpaths.map((path, i) => `import * as api${i} from '${path}'; void api${i};`).join('\n'));
  await writeFile(join(scratch, 'payment-example.mts'), `
    declare const wallet: import('agentwallet-sdk').AgentWallet;
    declare const approvedRecipient: import('viem').Address;
    declare const circleTestUsdc: import('viem').Address;
    declare const paymentsDirectory: string;
    ${examples.join('\n')}
  `);
  run(join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc'), ['--noEmit', '--strict', '--skipLibCheck', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'types.mts', 'payment-example.mts'], scratch);
  console.log(`Packed release verified: ${paths.length} files; ${subpaths.length} runtime and typed entrypoints.`);
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw error;
} finally {
  await rm(scratch, { recursive: true, force: true });
}
