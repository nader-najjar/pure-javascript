import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ContainerModule } from 'inversify';
import { ENVIRONMENT_VARIABLES, type EnvironmentVariables } from '../environment/models/EnvironmentVariables.ts';

const CONNECTION_TIMEOUT_MS = 2000;
const REQUEST_TIMEOUT_MS = 30_000;

export const awsClientsModule = new ContainerModule(({ bind }) => {
  bind(DynamoDBClient)
    .toResolvedValue(
      (environmentVariables: EnvironmentVariables) => new DynamoDBClient({
        region: environmentVariables.awsRegion,
        requestHandler: { connectionTimeout: CONNECTION_TIMEOUT_MS, requestTimeout: REQUEST_TIMEOUT_MS }
      }),
      [ENVIRONMENT_VARIABLES]
    )
    .inSingletonScope()
    .onDeactivation((dynamoDBClient) => {
      dynamoDBClient.destroy();
    });
});
