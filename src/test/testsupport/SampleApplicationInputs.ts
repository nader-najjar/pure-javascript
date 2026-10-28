import type { ApplicationInput } from '../../main/execution/models/ApplicationInput.ts';

export function exampleApplicationInput(): ApplicationInput {
  return {
    exampleStringField: 'test',
    exampleIntField: 1,
    exampleBooleanField: true,
    exampleTimestampField: new Date('2024-01-01T00:00:00Z'),
    exampleListField: ['a']
  };
}
