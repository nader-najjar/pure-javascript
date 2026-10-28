import {
  chmodSync, copyFileSync, lstatSync, mkdirSync, readdirSync, readlinkSync, statSync, symlinkSync
} from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

// Keep package-manager links, but replace Bazel's absolute runfile links with real files.
export function copyRuntime(source: string, destination: string, root: string): void {
  if (lstatSync(source).isSymbolicLink()) {
    const link = readlinkSync(source);
    const target = resolve(source, '..', link);
    if (!isAbsolute(link) && target.startsWith(`${root}/`)) {
      symlinkSync(link, destination);
      return;
    }
  }
  if (statSync(source).isDirectory()) {
    mkdirSync(destination, { recursive: true });
    for (const name of readdirSync(source)) copyRuntime(join(source, name), join(destination, name), root);
  } else {
    copyFileSync(source, destination);
  }
}

export function verifyRuntimeLinks(source: string, root: string): void {
  const entry = lstatSync(source);
  if (entry.isSymbolicLink()) {
    const link = readlinkSync(source);
    const target = resolve(source, '..', link);
    if (isAbsolute(link) || !target.startsWith(`${root}/`)) {
      throw new Error(`Release link escapes its directory: ${source} -> ${link}`);
    }
    statSync(source); // Fail for broken links as well.
  } else if (entry.isDirectory()) {
    for (const name of readdirSync(source)) verifyRuntimeLinks(join(source, name), root);
  }
}

export function makeDirectoriesWritable(source: string): void {
  if (lstatSync(source).isDirectory()) {
    chmodSync(source, 0o755);
    for (const name of readdirSync(source)) makeDirectoriesWritable(join(source, name));
  }
}
