import { NextFunction, Request, Response } from 'express';

import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    return res.status(400).json({
      success: false,
      message: issue?.message ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid request',
      code: 'VALIDATION_ERROR',
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  const status = typeof err === 'object' && err !== null && 'statusCode' in err
    ? Number((err as { statusCode: unknown }).statusCode)
    : 500;
  const code = typeof err === 'object' && err !== null && 'code' in err
    ? String((err as { code: unknown }).code)
    : 'INTERNAL_ERROR';

  return res.status(status >= 400 && status < 600 ? status : 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err instanceof Error ? err.message : 'Internal server error'),
    code: process.env.NODE_ENV === 'production' ? 'INTERNAL_ERROR' : code,
  });
}
