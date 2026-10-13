import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const rules = [
  ['private key assignment', /(?:privateKey|private_key|PRIVATE_KEY)\s*[:=]\s*["'`]?(?:0x)?[0-9a-fA-F]{64}\b/g],
  ['private key PEM', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,})\b/g],
  ['provider secret', /\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}\b/g],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
];
const violations = [];
for (const file of [...new Set(files)]) {
  if (/^(?:node_modules|dist|artifacts|apps\/wallet-console\/(?:node_modules|dist))\//.test(file)) continue;
  if (/(?:^|\/)(?:__tests__|tests)\//.test(file)) continue; // Disposable test-only accounts; never published.
  if (/(?:^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith('.example')) {
    violations.push(`${file}: environment file must not be committed`);
    continue;
  }
  let contents;
  try { contents = await readFile(new URL(file, new URL('../', import.meta.url)), 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  for (const [name, pattern] of rules) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(contents))) {
      const line = contents.slice(0, match.index).split('\n').length;
      violations.push(`${file}:${line}: ${name}`);
    }
  }
}
if (violations.length) throw new Error(`Potential secrets found (values withheld):\n${violations.join('\n')}`);
console.log(`Source secret scan passed (${files.length} indexed paths; disposable test fixtures excluded). This check is not a git-history secret audit.`);
