import { mkdirSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { materialize } from './materialize.ts';
import { copyRuntime } from './copy-runtime.ts';

const output = resolve('executable');
mkdirSync(output, { recursive: true });
materialize(resolve('build/compiled'), output);
for (const file of ['package.json', 'LICENSE', 'README.md', 'pnpm-lock.yaml']) {
  materialize(resolve(file), resolve(output, file));
}
copyRuntime(resolve('node_modules'), resolve(output, 'node_modules'), resolve('node_modules'));
// Retain the production dependency CLI provided by pnpm deploy, using a portable relative link.
mkdirSync(resolve(output, 'node_modules/.bin'), { recursive: true });
symlinkSync('../pino/bin.js', resolve(output, 'node_modules/.bin/pino'));
