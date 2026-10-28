export function validEnvironment(): Record<string, string | undefined> {
  return {
    STAGE: 'BETA',
    AWS_REGION: 'us-east-1',
    CALCULATION_RESULTS_TABLE_NAME: 'CalculationResults',
    EXAMPLE_STRING_VAR: 'test',
    EXAMPLE_INT_VAR: '1',
    EXAMPLE_BOOLEAN_VAR: 'true'
  };
}
