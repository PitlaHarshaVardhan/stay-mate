import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodSchema } from 'zod';
import { badRequest } from '../errors/AppError';

type ValidationTarget = 'body' | 'params' | 'query';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const issue = result.error.issues[0];
      const field = issue?.path.join('.') || target;
      return next(badRequest(issue?.message ? `${field}: ${issue.message}` : 'Invalid request', 'VALIDATION_ERROR'));
    }
    (req as Request & Record<string, unknown>)[target] = result.data;
    return next();
  };
}
