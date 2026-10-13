import {
  readFileSync,
  writeFileSync,
  chmodSync,
  mkdtempSync,
  existsSync,
} from "node:fs";
import { brotliDecompressSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
let executable = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
if (!executable && process.platform === "linux" && process.arch === "x64") {
  // Locked npm binary fallback avoids unavailable external browser CDN downloads.
  const binary = resolve(
    dirname(require.resolve("@sparticuz/chromium")),
    "../bin/chromium.br",
  );
  const dir = mkdtempSync(join(tmpdir(), "agentwallet-browser-"));
  executable = join(dir, "chromium");
  writeFileSync(executable, brotliDecompressSync(readFileSync(binary)), {
    flag: "wx",
  });
  chmodSync(executable, 0o755);
}
if (executable && !existsSync(executable))
  throw Error("Configured browser executable does not exist.");
const result = spawnSync(
  process.execPath,
  [
    join(root, "node_modules/playwright/cli.js"),
    "test",
    ...process.argv.slice(2),
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      ...(executable ? { PLAYWRIGHT_EXECUTABLE_PATH: executable } : {}),
    },
  },
);
process.exitCode = result.status ?? 1;
