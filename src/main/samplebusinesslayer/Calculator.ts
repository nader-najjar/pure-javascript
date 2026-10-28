import { injectable } from 'inversify';
import { CalculationException } from './exceptions/CalculationException.ts';
import type { CalculationRequest } from './models/CalculationRequest.ts';
import type { CalculationResult } from './models/CalculationResult.ts';

@injectable()
export class Calculator {
  public calculate(request: CalculationRequest): CalculationResult {
    return { result: this.compute(request), operation: request.operation };
  }

  private compute(request: CalculationRequest): number {
    const { operandA, operandB } = request;

    switch (request.operation.toUpperCase()) {
      case 'ADD': {
        return operandA + operandB;
      }
      case 'SUBTRACT': {
        return operandA - operandB;
      }
      case 'MULTIPLY': {
        return operandA * operandB;
      }
      case 'DIVIDE': {
        if (operandB === 0) {
          throw new CalculationException('Division by zero');
        }
        return operandA / operandB;
      }
      default: {
        throw new CalculationException(`Unknown operation: ${request.operation}`);
      }
    }
  }
}
