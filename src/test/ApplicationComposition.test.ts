import 'reflect-metadata';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ContainerModule } from 'inversify';
import { describe, expect, it } from 'vitest';
import { createContainer } from '../main/composition/ContainerFactory.ts';
import { createEnvironmentVariables } from '../main/environment/EnvironmentVariablesFactory.ts';
import { ENVIRONMENT_VARIABLES, type EnvironmentVariables } from '../main/environment/models/EnvironmentVariables.ts';
import { Executor } from '../main/execution/Executor.ts';
import { mock } from './testsupport/Mocks.ts';
import { validEnvironment } from './testsupport/SampleEnvironmentMaps.ts';

describe('Application composition', () => {
  it('assembles the application', () => {
    const testModule = new ContainerModule(({ bind }) => {
      bind<EnvironmentVariables>(ENVIRONMENT_VARIABLES).toConstantValue(createEnvironmentVariables(validEnvironment()));
      bind(DynamoDBClient).toConstantValue(mock(DynamoDBClient));
    });

    expect(createContainer(testModule).get(Executor)).toBeInstanceOf(Executor);
  });
});
