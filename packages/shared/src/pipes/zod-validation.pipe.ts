import {
  type PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';

/**
 * Validates incoming request body/payload against a Zod schema.
 * Throws BadRequestException with a structured error message on failure.
 *
 * Usage:
 *   @Body(new ZodValidationPipe(createTaskRequestSchema)) body: CreateTaskRequest
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const error = result.error as ZodError;
    const messages = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    throw new BadRequestException({
      statusCode: 400,
      error: 'Validation Failed',
      messages,
    });
  }
}
