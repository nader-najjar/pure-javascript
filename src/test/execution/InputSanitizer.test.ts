import { describe, expect, it } from 'vitest';
import { InvalidInputException } from '../../main/execution/exceptions/InvalidInputException.ts';
import { InputSanitizer } from '../../main/execution/InputSanitizer.ts';
import type { ApplicationInput } from '../../main/execution/models/ApplicationInput.ts';
import {
  INVALID_JSON_EMPTY_STRING,
  INVALID_JSON_MALFORMED,
  INVALID_JSON_NOT_JSON,
  INVALID_JSON_WITH_INVALID_TIMESTAMP,
  INVALID_JSON_WITH_NON_NUMERIC_INT_FIELD,
  INVALID_JSON_WITH_NULL_STRING_FIELD,
  validInput
} from '../testsupport/SampleJsonInputs.ts';

const VALID_FIELDS: Readonly<Record<string, string>> = {
  exampleStringField: '"a"',
  exampleIntField: '5',
  exampleBooleanField: 'true',
  exampleTimestampField: '"2026-01-01T00:00:00Z"',
  exampleListField: '["x","y"]'
};

const EXPECTED: ApplicationInput = {
  exampleStringField: 'a',
  exampleIntField: 5,
  exampleBooleanField: true,
  exampleTimestampField: new Date('2026-01-01T00:00:00Z'),
  exampleListField: ['x', 'y']
};

const FIELD_NAMES = Object.keys(VALID_FIELDS);

function toJson(fields: Readonly<Record<string, string>>): string {
  const members = Object.entries(fields).map(([name, value]) => `"${name}":${value}`);
  return '{' + members.join(',') + '}';
}

function withoutField(name: string): Record<string, string> {
  return Object.fromEntries(Object.entries(VALID_FIELDS).filter(([fieldName]) => fieldName !== name));
}

function sanitizationError(args: readonly string[]): InvalidInputException {
  try {
    new InputSanitizer().sanitize(args);
  } catch (error) {
    if (error instanceof InvalidInputException) {
      return error;
    }
    throw error;
  }
  throw new Error('Expected InvalidInputException');
}

describe('InputSanitizer', () => {
  const sanitizer = new InputSanitizer();

  it('sanitizes valid input', () => {
    const input = sanitizer.sanitize([validInput('hello', 3, true, '2024-01-01T00:00:00Z', 'a', 'b')]);

    expect(input.exampleStringField).toBe('hello');
    expect(input.exampleIntField).toBe(3);
    expect(input.exampleBooleanField).toBe(true);
    expect(input.exampleTimestampField.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect(new Set(input.exampleListField)).toEqual(new Set(['a', 'b']));
  });

  it('sanitizes input with false boolean', () => {
    const input = sanitizer.sanitize([validInput('test', 0, false, '2024-01-01T00:00:00Z')]);

    expect(input.exampleBooleanField).toBe(false);
    expect(input.exampleIntField).toBe(0);
    expect(input.exampleListField).toEqual([]);
  });

  it('rejects empty args', () => {
    expect(sanitizationError([]).message).toContain('No input provided');
  });

  it.each([
    INVALID_JSON_MALFORMED,
    INVALID_JSON_EMPTY_STRING,
    INVALID_JSON_NOT_JSON,
    '{} {}',
    '{"a":1,}',
    '[1,2,]',
    '{"a":1',
    '{"a":1 // comment\n}',
    '{"a":1 /* comment */}',
    '{\'a\':1}',
    '{a:1}',
    '{"a":01}',
    ' '.repeat(3)
  ])(
    'rejects invalid JSON %j',
    (json) => {
      const error = sanitizationError([json]);

      expect(error.message).toContain('Invalid input JSON');
      expect(error.cause).toBeInstanceOf(Error);
    }
  );

  it.each([
    INVALID_JSON_WITH_NON_NUMERIC_INT_FIELD,
    INVALID_JSON_WITH_INVALID_TIMESTAMP,
    INVALID_JSON_WITH_NULL_STRING_FIELD
  ])('rejects JSON that fails validation %#', (json) => {
    expect(sanitizationError([json]).message).toContain('Input validation failed');
  });

  it('uses the first arg when multiple args are provided', () => {
    const input = sanitizer.sanitize([
      validInput('first', 1, true, '2024-01-01T00:00:00Z', 'a'),
      validInput('second', 2, false, '2024-01-01T00:00:00Z', 'b')
    ]);

    expect(input.exampleStringField).toBe('first');
    expect(input.exampleIntField).toBe(1);
  });

  it('ignores an unknown scalar property', () => {
    expect(sanitizer.sanitize([toJson({ ...VALID_FIELDS, unknownField: '1' })])).toEqual(EXPECTED);
  });

  it('ignores an unknown nested property', () => {
    const unknownObject = '{"nested":[1,{"deep":true}],"label":"z"}';

    expect(sanitizer.sanitize([toJson({ ...VALID_FIELDS, unknownObject })])).toEqual(EXPECTED);
  });

  it.each(FIELD_NAMES)('rejects missing property %s', (name) => {
    const json = toJson(withoutField(name));

    expect(sanitizationError([json]).message).toContain('Input validation failed');
  });

  it.each(FIELD_NAMES)('rejects null property %s', (name) => {
    expect(sanitizationError([toJson({ ...VALID_FIELDS, [name]: 'null' })]).message)
      .toContain('Input validation failed');
  });

  it.each([
    ['an int field given a float', 'exampleIntField', '5.5'],
    ['an int field given an int64', 'exampleIntField', '2147483648'],
    ['a boolean field given a string', 'exampleBooleanField', '"true"'],
    ['a string field given a number', 'exampleStringField', '1'],
    ['a list field given a single value', 'exampleListField', '"x"']
  ])('rejects %s', (_description, name, value) => {
    expect(sanitizationError([toJson({ ...VALID_FIELDS, [name]: value })]).message)
      .toContain('Input validation failed');
  });

  it('rejects a duplicate property', () => {
    const json = toJson(VALID_FIELDS).replace('{', '{"exampleStringField":"b",');

    expect(sanitizationError([json]).message).toContain('Invalid input JSON');
  });

  it('rejects a duplicate nested property', () => {
    const json = toJson({ ...VALID_FIELDS, unknownObject: '[{"a":1,"a":2}]' });

    expect(sanitizationError([json]).message).toContain('Invalid input JSON');
  });

  it.each(['__proto__', 'constructor', 'prototype'])('rejects the prototype poisoning key %s', (key) => {
    const json = toJson({ ...VALID_FIELDS, unknownObject: `{"${key}":{"polluted":true}}` });

    expect(sanitizationError([json]).message).toContain('Invalid input JSON');
  });
});
