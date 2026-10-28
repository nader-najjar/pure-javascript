import { describe, expect, it } from 'vitest';
import { createEnvironmentVariables } from '../../main/environment/EnvironmentVariablesFactory.ts';
import { EnvironmentVariableException } from '../../main/environment/exceptions/EnvironmentVariableException.ts';
import { AWS_REGIONS } from '../../main/environment/models/AWSRegion.ts';
import { EnvironmentVariablesSchema } from '../../main/environment/models/EnvironmentVariables.ts';
import { STAGES } from '../../main/environment/models/Stage.ts';
import { validEnvironment } from '../testsupport/SampleEnvironmentMaps.ts';

const REQUIRED_KEYS = [
  'STAGE',
  'AWS_REGION',
  'CALCULATION_RESULTS_TABLE_NAME',
  'EXAMPLE_STRING_VAR',
  'EXAMPLE_INT_VAR',
  'EXAMPLE_BOOLEAN_VAR'
];

function environmentWith(key: string, value: string | undefined): Record<string, string | undefined> {
  return { ...validEnvironment(), [key]: value };
}

function expectFailure(environment: Record<string, string | undefined>, ...messageParts: string[]): void {
  const create = (): unknown => createEnvironmentVariables(environment);

  expect(create).toThrow(EnvironmentVariableException);
  for (const messagePart of messageParts) {
    expect(create).toThrow(messagePart);
  }
}

describe('EnvironmentVariablesFactory', () => {
  it('provides environment variables with valid values', () => {
    const result = createEnvironmentVariables(validEnvironment());

    expect(result.stage).toBe('BETA');
    expect(result.awsRegion).toBe('us-east-1');
    expect(result.calculationResultsTableName).toBe('CalculationResults');
    expect(result.exampleStringVar).toBe('test');
    expect(result.exampleIntVar).toBe(1);
    expect(result.exampleBooleanVar).toBe(true);
  });

  it.each([
    { stage: 'invalid' },
    { awsRegion: 'invalid' },
    { exampleIntVar: 1.5 },
    { exampleBooleanVar: 'true' }
  ])('declares model constraints for %j', (invalidValue) => {
    const environmentVariables = createEnvironmentVariables(validEnvironment());

    expect(EnvironmentVariablesSchema.safeParse({ ...environmentVariables, ...invalidValue }).success).toBe(false);
  });

  it('provides environment variables with false boolean', () => {
    const result = createEnvironmentVariables(environmentWith('EXAMPLE_BOOLEAN_VAR', 'false'));

    expect(result.exampleBooleanVar).toBe(false);
    expect(result.stage).toBe('BETA');
    expect(result.exampleIntVar).toBe(1);
  });

  it.each(REQUIRED_KEYS)('throws when %s is missing', (key) => {
    expectFailure(environmentWith(key, undefined), key, 'not set');
  });

  it.each(REQUIRED_KEYS)('throws when %s is blank', (key) => {
    expectFailure(environmentWith(key, ''), key, 'not set');
  });

  it.each(REQUIRED_KEYS)('throws when %s is whitespace', (key) => {
    expectFailure(environmentWith(key, ' '.repeat(3)), key, 'not set');
  });

  it.each(['not-a-number', '3.14', '2147483648', '-2147483649', ' 1', '1e3', '0x10'])(
    'throws when the int var is %j',
    (value) => {
      expectFailure(environmentWith('EXAMPLE_INT_VAR', value), 'EXAMPLE_INT_VAR', 'valid integer', `got: ${value}`);
    }
  );

  it.each([['-42', -42], ['0', 0], ['+7', 7], ['2147483647', 2_147_483_647], ['-2147483648', -2_147_483_648]])(
    'parses the int var %j',
    (value, expected) => {
      expect(createEnvironmentVariables(environmentWith('EXAMPLE_INT_VAR', value)).exampleIntVar).toBe(expected);
    }
  );

  it.each(['yes', 'True', 'FALSE', '1'])('throws when the boolean var is %j', (value) => {
    expectFailure(environmentWith('EXAMPLE_BOOLEAN_VAR', value), 'EXAMPLE_BOOLEAN_VAR', `'true' or 'false'`, value);
  });

  it.each(STAGES)('provides environment variables with stage %s', (stage) => {
    expect(createEnvironmentVariables(environmentWith('STAGE', stage)).stage).toBe(stage);
  });

  it.each(AWS_REGIONS)('provides environment variables with AWS region %s', (awsRegion) => {
    expect(createEnvironmentVariables(environmentWith('AWS_REGION', awsRegion)).awsRegion).toBe(awsRegion);
  });

  it.each(['us-fake-1', 'US-EAST-1', 'US_EAST_1', ' us-east-1', 'us-east-1 '])(
    'throws when the AWS region is %j',
    (value) => {
      expectFailure(environmentWith('AWS_REGION', value), 'AWS_REGION', 'must be one of', `got: ${value}`);
    }
  );

  it.each(['dev', 'Production', ' PRODUCTION'])('throws when the stage is %j', (value) => {
    expectFailure(environmentWith('STAGE', value), 'STAGE', 'must be one of', `got: ${value}`);
  });
});
