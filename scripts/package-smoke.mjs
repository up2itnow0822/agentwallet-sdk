import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
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
  await writeFile(join(scratch, 'types.mts'), subpaths.map((path, i) => `import * as api${i} from '${path}'; void api${i};`).join('\n'));
  run(join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc'), ['--noEmit', '--strict', '--skipLibCheck', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'types.mts'], scratch);
  console.log(`Packed release verified: ${paths.length} files; ${subpaths.length} runtime and typed entrypoints.`);
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw error;
} finally {
  await rm(scratch, { recursive: true, force: true });
}
