import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { beforeEach, describe, expect, it } from 'vitest';
import { createEnvironmentVariables } from '../../main/environment/EnvironmentVariablesFactory.ts';
import { CalculationResultStore } from '../../main/samplebusinesslayer/CalculationResultStore.ts';
import type { CalculationRequest } from '../../main/samplebusinesslayer/models/CalculationRequest.ts';
import { shutdownSignal } from '../../main/shared/utilities/ShutdownSignalUtility.ts';
import { mock } from '../testsupport/Mocks.ts';
import { validEnvironment } from '../testsupport/SampleEnvironmentMaps.ts';

describe('CalculationResultStore', () => {
  const dynamoDBClient = mock(DynamoDBClient);
  let calculationResultStore: CalculationResultStore;

  beforeEach(() => {
    calculationResultStore = new CalculationResultStore(dynamoDBClient, createEnvironmentVariables(validEnvironment()));
  });

  async function saveAndCapture(request: CalculationRequest): Promise<PutItemCommand['input']> {
    dynamoDBClient.send.mockClear();
    await calculationResultStore.save(request, { result: 15, operation: 'ADD' });

    expect(dynamoDBClient.send).toHaveBeenCalledOnce();
    const [command, options] = dynamoDBClient.send.mock.calls[0] ?? [];
    expect(command).toBeInstanceOf(PutItemCommand);
    expect(options).toEqual({ abortSignal: shutdownSignal });
    return (command as PutItemCommand).input;
  }

  it('saves the result to the configured table', async () => {
    const input = await saveAndCapture({ operandA: 10, operandB: 5, operation: 'ADD' });

    expect(input.TableName).toBe('CalculationResults');
    expect(Object.keys(input.Item ?? {})).toEqual(['id', 'operation', 'result']);
    expect(input.Item?.['operation']).toEqual({ S: 'ADD' });
    expect(input.Item?.['result']).toEqual({ N: '15' });
  });

  it('uses the same id for the same request', async () => {
    const firstInput = await saveAndCapture({ operandA: 10, operandB: 5, operation: 'ADD' });
    const secondInput = await saveAndCapture({ operandA: 10, operandB: 5, operation: 'ADD' });

    expect(firstInput.Item?.['id']).toEqual(secondInput.Item?.['id']);
  });

  it('uses a different id for a different request', async () => {
    const firstInput = await saveAndCapture({ operandA: 10, operandB: 5, operation: 'ADD' });
    const secondInput = await saveAndCapture({ operandA: 7, operandB: 8, operation: 'ADD' });

    expect(firstInput.Item?.['id']).not.toEqual(secondInput.Item?.['id']);
  });
});
