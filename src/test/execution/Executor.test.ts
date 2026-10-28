import { beforeEach, describe, expect, it } from 'vitest';
import { createEnvironmentVariables } from '../../main/environment/EnvironmentVariablesFactory.ts';
import { InvalidInputException } from '../../main/execution/exceptions/InvalidInputException.ts';
import { Executor } from '../../main/execution/Executor.ts';
import { InputSanitizer } from '../../main/execution/InputSanitizer.ts';
import { CalculationResultStore } from '../../main/samplebusinesslayer/CalculationResultStore.ts';
import { Calculator } from '../../main/samplebusinesslayer/Calculator.ts';
import { mock } from '../testsupport/Mocks.ts';
import { exampleApplicationInput } from '../testsupport/SampleApplicationInputs.ts';
import { validEnvironment } from '../testsupport/SampleEnvironmentMaps.ts';

describe('Executor', () => {
  const args = ['opaque-input'];
  const expectedRequest = { operandA: 10, operandB: 5, operation: 'ADD' };
  const calculationResult = { result: 15, operation: 'ADD' };

  const inputSanitizer = mock(InputSanitizer);
  const calculator = mock(Calculator);
  const calculationResultStore = mock(CalculationResultStore);
  let executor: Executor;

  beforeEach(() => {
    executor = new Executor(
      createEnvironmentVariables(validEnvironment()),
      inputSanitizer,
      calculator,
      calculationResultStore
    );
  });

  it('executes with valid input', async () => {
    inputSanitizer.sanitize.mockReturnValue(exampleApplicationInput());
    calculator.calculate.mockReturnValue(calculationResult);

    await executor.execute(args);

    expect(inputSanitizer.sanitize).toHaveBeenCalledExactlyOnceWith(args);
    expect(calculator.calculate).toHaveBeenCalledExactlyOnceWith(expectedRequest);
    expect(calculationResultStore.save).toHaveBeenCalledExactlyOnceWith(expectedRequest, calculationResult);
  });

  it('executes in the correct order', async () => {
    inputSanitizer.sanitize.mockReturnValue(exampleApplicationInput());
    calculator.calculate.mockReturnValue(calculationResult);

    await executor.execute(args);

    expect(inputSanitizer.sanitize).toHaveBeenCalledBefore(calculator.calculate);
    expect(calculator.calculate).toHaveBeenCalledBefore(calculationResultStore.save);
  });

  it('propagates the exception when the input sanitizer fails', async () => {
    inputSanitizer.sanitize.mockImplementation(() => {
      throw new InvalidInputException('Invalid input JSON');
    });

    await expect(executor.execute(args)).rejects.toThrow(InvalidInputException);

    expect(inputSanitizer.sanitize).toHaveBeenCalledExactlyOnceWith(args);
    expect(calculator.calculate).not.toHaveBeenCalled();
    expect(calculationResultStore.save).not.toHaveBeenCalled();
  });
});
