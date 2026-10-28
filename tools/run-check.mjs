import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';

import { materialize } from './materialize.ts';

// Native resolvers need real source files rather than runfiles symlinks.
const check = process.argv[2];
if (check !== 'vitest' && check !== 'knip') throw new Error('Expected vitest or knip.');
const executable = resolve(
  check === 'vitest' ? 'node_modules/vitest/vitest.mjs' : 'node_modules/knip/bin/knip.js'
);
const root = mkdtempSync(join(tmpdir(), 'pure-javascript-check-'));
try {
  for (const input of [
    'src', 'tools', 'package.json', 'tsconfig.json', 'tsconfig.build.json',
    'vitest.config.ts', 'eslint.config.js', 'knip.json'
  ]) {
    materialize(resolve(input), join(root, input));
  }
  symlinkSync(resolve('node_modules'), join(root, 'node_modules'), 'junction');
  const result = spawnSync(process.execPath, [executable, ...process.argv.slice(3)], { cwd: root, stdio: 'inherit' });
  if (check === 'vitest' && process.env['TEST_UNDECLARED_OUTPUTS_DIR'] !== undefined) {
    cpSync(join(root, 'build'), process.env['TEST_UNDECLARED_OUTPUTS_DIR'], { recursive: true });
  }
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(root, { recursive: true, force: true });
}
