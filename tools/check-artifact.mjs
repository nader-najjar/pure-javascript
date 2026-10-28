import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { makeDirectoriesWritable, verifyRuntimeLinks } from './copy-runtime.ts';

// Copy out of Bazel to prove the release does not depend on its runfiles or caches.
// Bypass rules_js's fs-patching wrapper: the release must run under ordinary Node.
const node = process.env['JS_BINARY__NODE_BINARY'] ?? process.execPath;
const root = mkdtempSync(join(tmpdir(), 'pure-javascript-artifact-'));
try {
  const artifact = dirname(realpathSync(resolve('executable/Main.js')));
  cpSync(artifact, root, { recursive: true, verbatimSymlinks: true });
  verifyRuntimeLinks(root, root);
  for (const file of ['LICENSE', 'README.md', 'pnpm-lock.yaml', 'node_modules/.bin/pino']) {
    assert.ok(existsSync(join(root, file)));
  }
  assert.ok(existsSync(join(root, 'Main.js')));
  assert.ok(existsSync(join(root, 'Main.js.map')));
  assert.ok(!existsSync(join(root, 'LambdaHandler.js')));
  for (const developmentPackage of ['typescript', 'eslint', 'vitest', 'knip', 'aws-lambda-ric']) {
    assert.ok(!existsSync(join(root, 'node_modules', developmentPackage)));
  }
  const imports = [
    '@aws-sdk/client-dynamodb', 'inversify', 'jsonc-parser', 'pino', 'reflect-metadata', 'zod'
  ].map((name) => `import(${JSON.stringify(name)})`);
  const importArgs = ['--input-type=module', '-e', `await Promise.all([${imports.join(',')}]);`];
  const loaded = spawnSync(node, importArgs, {
    cwd: root,
    encoding: 'utf8'
  });
  assert.equal(loaded.status, 0, loaded.stderr);
  // No input fails before any DynamoDB call. This checks the compiled entrypoint without AWS access.
  const run = spawnSync(node, ['--enable-source-maps', 'Main.js'], {
    cwd: root,
    encoding: 'utf8',
    env: {
      STAGE: 'BETA', AWS_REGION: 'us-east-1', CALCULATION_RESULTS_TABLE_NAME: 'CalculationResults',
      EXAMPLE_STRING_VAR: 'test', EXAMPLE_INT_VAR: '1', EXAMPLE_BOOLEAN_VAR: 'true'
    }
  });
  assert.equal(run.status, 1, run.stderr);
  assert.match(run.stdout, /Technical exception occurred at software entrypoint level/, run.stderr);
  assert.doesNotMatch(run.stderr, /ERR_MODULE_NOT_FOUND/);
} finally {
  makeDirectoriesWritable(root);
  rmSync(root, { recursive: true, force: true });
}
