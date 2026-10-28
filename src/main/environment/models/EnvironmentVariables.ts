import { z } from 'zod';
import { AWS_REGIONS } from './AWSRegion.ts';
import { STAGES } from './Stage.ts';

export const EnvironmentVariablesSchema = z.object({
  stage: z.enum(STAGES),
  awsRegion: z.enum(AWS_REGIONS),
  calculationResultsTableName: z.string(),
  exampleStringVar: z.string(),
  exampleIntVar: z.int32(),
  exampleBooleanVar: z.boolean()
}).readonly();

export type EnvironmentVariables = z.infer<typeof EnvironmentVariablesSchema>;

export const ENVIRONMENT_VARIABLES = Symbol('EnvironmentVariables');
