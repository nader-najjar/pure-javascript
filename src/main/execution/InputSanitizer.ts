import { injectable } from 'inversify';
import { ZodError } from 'zod';
import { parseStrictJson } from '../shared/utilities/JsonParserUtility.ts';
import { describeViolations } from '../shared/utilities/ZodValidatorUtility.ts';
import { InvalidInputException } from './exceptions/InvalidInputException.ts';
import { ApplicationInputSchema, type ApplicationInput } from './models/ApplicationInput.ts';

@injectable()
export class InputSanitizer {
  public sanitize(args: readonly string[]): ApplicationInput {
    const jsonString = this.validateArgumentsStructure(args);
    return this.parseJson(jsonString);
  }

  private validateArgumentsStructure(args: readonly string[]): string {
    const [firstArg] = args;
    if (firstArg === undefined) {
      throw new InvalidInputException('No input provided');
    }
    return firstArg;
  }

  private parseJson(jsonString: string): ApplicationInput {
    try {
      return parseStrictJson(jsonString, ApplicationInputSchema);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new InvalidInputException(`Input validation failed: ${describeViolations(error)}`, { cause: error });
      }
      throw new InvalidInputException('Invalid input JSON', { cause: error });
    }
  }
}
