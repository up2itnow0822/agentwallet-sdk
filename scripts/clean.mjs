import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
await rm(fileURLToPath(new URL('dist/', root)), { recursive: true, force: true });
await rm(fileURLToPath(new URL('artifacts/contracts/', root)), { recursive: true, force: true });
