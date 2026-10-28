import { inject, injectable } from 'inversify';
import { ENVIRONMENT_VARIABLES, type EnvironmentVariables } from '../environment/models/EnvironmentVariables.ts';
import { CalculationResultStore } from '../samplebusinesslayer/CalculationResultStore.ts';
import { Calculator } from '../samplebusinesslayer/Calculator.ts';
import type { CalculationRequest } from '../samplebusinesslayer/models/CalculationRequest.ts';
import { getLogger } from '../shared/utilities/LoggerUtility.ts';
import { InputSanitizer } from './InputSanitizer.ts';

const LOGGER = getLogger('Executor');

@injectable()
export class Executor {
  private readonly environmentVariables: EnvironmentVariables;
  private readonly inputSanitizer: InputSanitizer;
  private readonly calculator: Calculator;
  private readonly calculationResultStore: CalculationResultStore;

  public constructor(
    @inject(ENVIRONMENT_VARIABLES) environmentVariables: EnvironmentVariables,
    inputSanitizer: InputSanitizer,
    calculator: Calculator,
    calculationResultStore: CalculationResultStore
  ) {
    this.environmentVariables = environmentVariables;
    this.inputSanitizer = inputSanitizer;
    this.calculator = calculator;
    this.calculationResultStore = calculationResultStore;
  }

  public async execute(args: readonly string[]): Promise<void> {
    const { stage, awsRegion } = this.environmentVariables;
    LOGGER.info(`Executing with stage: ${stage}, awsRegion: ${awsRegion}`);

    const input = this.inputSanitizer.sanitize(args);
    LOGGER.info({ input }, 'Sanitized input');

    await this.invokeSampleLogic();
  }

  private async invokeSampleLogic(): Promise<void> {
    const request: CalculationRequest = { operandA: 10, operandB: 5, operation: 'ADD' };
    const result = this.calculator.calculate(request);
    await this.calculationResultStore.save(request, result);
  }
}
