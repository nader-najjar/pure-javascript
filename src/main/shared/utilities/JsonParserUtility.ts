import { getNodeValue, parseTree, printParseErrorCode, type Node, type ParseError } from 'jsonc-parser';
import type { ZodType } from 'zod';

const STRICT_JSON_OPTIONS = { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false };

const PROTOTYPE_POISONING_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function parseStrictJson<T>(text: string, schema: ZodType<T>): T {
  const errors: ParseError[] = [];
  const document = parseTree(text, errors, STRICT_JSON_OPTIONS);
  const [firstError] = errors;
  if (firstError !== undefined) {
    throw new SyntaxError(`${printParseErrorCode(firstError.error)} at offset ${String(firstError.offset)}`);
  }
  if (document === undefined) {
    throw new SyntaxError('Empty JSON document');
  }
  rejectUnsafeObjects(document);
  return schema.parse(getNodeValue(document));
}

function rejectUnsafeObjects(node: Node): void {
  const children = node.children ?? [];
  if (node.type === 'object') {
    rejectDuplicateAndPoisoningKeys(children);
  }
  for (const child of children) {
    rejectUnsafeObjects(child);
  }
}

function rejectDuplicateAndPoisoningKeys(properties: readonly Node[]): void {
  const seenKeys = new Set<string>();

  for (const property of properties) {
    const key = String(property.children?.[0]?.value);
    if (seenKeys.has(key)) {
      throw new SyntaxError(`Duplicate JSON key: ${key}`);
    }
    if (PROTOTYPE_POISONING_KEYS.has(key)) {
      throw new SyntaxError(`Forbidden JSON key: ${key}`);
    }
    seenKeys.add(key);
  }
}
