import { createHash } from 'node:crypto';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { inject, injectable } from 'inversify';
import { ENVIRONMENT_VARIABLES, type EnvironmentVariables } from '../environment/models/EnvironmentVariables.ts';
import { shutdownSignal } from '../shared/utilities/ShutdownSignalUtility.ts';
import type { CalculationRequest } from './models/CalculationRequest.ts';
import type { CalculationResult } from './models/CalculationResult.ts';

@injectable()
export class CalculationResultStore {
  private readonly dynamoDBClient: DynamoDBClient;
  private readonly tableName: string;

  public constructor(
    dynamoDBClient: DynamoDBClient,
    @inject(ENVIRONMENT_VARIABLES) environmentVariables: EnvironmentVariables
  ) {
    this.dynamoDBClient = dynamoDBClient;
    this.tableName = environmentVariables.calculationResultsTableName;
  }

  public async save(request: CalculationRequest, result: CalculationResult): Promise<void> {
    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: {
        id: { S: idFor(request) },
        operation: { S: result.operation },
        result: { N: String(result.result) }
      }
    });
    await this.dynamoDBClient.send(command, { abortSignal: shutdownSignal });
  }
}

function idFor(request: CalculationRequest): string {
  const key = `${String(request.operandA)}:${String(request.operandB)}:${request.operation}`;
  return createHash('sha256').update(key, 'utf8').digest('hex');
}
