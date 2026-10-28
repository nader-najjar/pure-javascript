import { describeViolations } from '../shared/utilities/ZodValidatorUtility.ts';
import { EnvironmentVariableException } from './exceptions/EnvironmentVariableException.ts';
import { AWS_REGIONS } from './models/AWSRegion.ts';
import { EnvironmentVariablesSchema, type EnvironmentVariables } from './models/EnvironmentVariables.ts';
import { STAGES } from './models/Stage.ts';

type Environment = Readonly<Record<string, string | undefined>>;

const INT32_PATTERN = /^[+-]?\d+$/;
const INT32_MIN = -2_147_483_648;
const INT32_MAX = 2_147_483_647;

export function createEnvironmentVariables(environment: Environment): EnvironmentVariables {
  const environmentVariables = {
    stage: extractOneOf(environment, 'STAGE', STAGES),
    awsRegion: extractOneOf(environment, 'AWS_REGION', AWS_REGIONS),
    calculationResultsTableName: extractString(environment, 'CALCULATION_RESULTS_TABLE_NAME'),
    exampleStringVar: extractString(environment, 'EXAMPLE_STRING_VAR'),
    exampleIntVar: extractInt(environment, 'EXAMPLE_INT_VAR'),
    exampleBooleanVar: extractBoolean(environment, 'EXAMPLE_BOOLEAN_VAR')
  };

  return validateEnvironmentVariables(environmentVariables);
}

function validateEnvironmentVariables(environmentVariables: EnvironmentVariables): EnvironmentVariables {
  const result = EnvironmentVariablesSchema.safeParse(environmentVariables);
  if (!result.success) {
    throw new EnvironmentVariableException(`Environment validation failed: ${describeViolations(result.error)}`);
  }
  return result.data;
}

function extractString(environment: Environment, key: string): string {
  return requireVariable(environment, key);
}

function extractInt(environment: Environment, key: string): number {
  const value = requireVariable(environment, key);
  const parsed = Number(value);

  if (!INT32_PATTERN.test(value) || parsed < INT32_MIN || parsed > INT32_MAX) {
    throw new EnvironmentVariableException(`Environment variable '${key}' must be a valid integer, got: ${value}`);
  }
  return parsed;
}

function extractBoolean(environment: Environment, key: string): boolean {
  const value = requireVariable(environment, key);

  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new EnvironmentVariableException(`Environment variable '${key}' must be 'true' or 'false', got: ${value}`);
}

function extractOneOf<T extends string>(environment: Environment, key: string, allowedValues: readonly T[]): T {
  const value = requireVariable(environment, key);
  const match = allowedValues.find((allowedValue) => allowedValue === value);

  if (match === undefined) {
    const allowed = `[${allowedValues.join(', ')}]`;
    throw new EnvironmentVariableException(`Environment variable '${key}' must be one of ${allowed}, got: ${value}`);
  }
  return match;
}

function requireVariable(environment: Environment, key: string): string {
  const value = environment[key];

  if (value === undefined || value.trim() === '') {
    throw new EnvironmentVariableException(`Required environment variable '${key}' is not set`);
  }
  return value;
}
