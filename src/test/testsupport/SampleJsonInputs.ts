export function validInput(
  exampleStringField: string,
  exampleIntField: number,
  exampleBooleanField: boolean,
  exampleTimestampField: string,
  ...exampleListElements: readonly string[]
): string {
  const list = exampleListElements.map((element) => `"${element}"`).join(',');

  return `{
  "exampleStringField": "${exampleStringField}",
  "exampleIntField": ${String(exampleIntField)},
  "exampleBooleanField": ${String(exampleBooleanField)},
  "exampleTimestampField": "${exampleTimestampField}",
  "exampleListField": [${list}]
}
`;
}

export const INVALID_JSON_MALFORMED = '{';

export const INVALID_JSON_EMPTY_STRING = '';

export const INVALID_JSON_NOT_JSON = 'not json at all';

export const INVALID_JSON_WITH_NON_NUMERIC_INT_FIELD = `{
  "exampleStringField": "hello",
  "exampleIntField": "not-a-number",
  "exampleBooleanField": true,
  "exampleTimestampField": "2024-01-01T00:00:00Z",
  "exampleListField": ["a","b"]
}`;

export const INVALID_JSON_WITH_INVALID_TIMESTAMP = `{
  "exampleStringField": "hello",
  "exampleIntField": 3,
  "exampleBooleanField": true,
  "exampleTimestampField": "invalid-date",
  "exampleListField": ["a","b"]
}`;

export const INVALID_JSON_WITH_NULL_STRING_FIELD = `{
  "exampleStringField": null,
  "exampleIntField": 3,
  "exampleBooleanField": true,
  "exampleTimestampField": "2024-01-01T00:00:00Z",
  "exampleListField": ["a","b"]
}`;
