import { describe, expect, it } from 'vitest';
import { Calculator } from '../../main/samplebusinesslayer/Calculator.ts';
import { CalculationException } from '../../main/samplebusinesslayer/exceptions/CalculationException.ts';

describe('Calculator', () => {
  const calculator = new Calculator();

  it.each([
    [2, 3, 'add', 5],
    [10, 4, 'SUBTRACT', 6],
    [3, 4, 'multiply', 12],
    [10, 4, 'DIVIDE', 2.5]
  ])('calculates %d and %d with %s', (operandA, operandB, operation, expected) => {
    expect(calculator.calculate({ operandA, operandB, operation })).toEqual({ result: expected, operation });
  });

  it('throws on division by zero', () => {
    expect(() => calculator.calculate({ operandA: 10, operandB: 0, operation: 'divide' }))
      .toThrow(new CalculationException('Division by zero'));
  });

  it('throws on unknown operation', () => {
    expect(() => calculator.calculate({ operandA: 10, operandB: 5, operation: 'UNKNOWN' }))
      .toThrow(new CalculationException('Unknown operation: UNKNOWN'));
  });
});
