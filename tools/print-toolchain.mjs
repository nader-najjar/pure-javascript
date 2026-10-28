import console from 'node:console';
import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const pnpm = process.argv[2];
if (pnpm === undefined) throw new Error('The pinned pnpm package is required.');
const node = realpathSync(process.env['JS_BINARY__NODE_BINARY'] ?? process.execPath);
console.log(`Node binary: ${node}`);
console.log(`pnpm package: ${realpathSync(pnpm)}`);
console.log(`pnpm executable: ${realpathSync(resolve(pnpm, 'bin/pnpm.cjs'))}`);
console.log(
  `TypeScript SDK: ${dirname(realpathSync(fileURLToPath(import.meta.resolve('typescript'))))}`
);
