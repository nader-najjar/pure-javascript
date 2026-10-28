import { z } from 'zod';

export const ApplicationInputSchema = z.object({
  exampleStringField: z.string(),
  exampleIntField: z.int32(),
  exampleBooleanField: z.boolean(),
  exampleTimestampField: z.iso.datetime({ offset: true }).transform((timestamp) => new Date(timestamp)),
  exampleListField: z.array(z.string()).readonly()
}).readonly();

export type ApplicationInput = z.infer<typeof ApplicationInputSchema>;
