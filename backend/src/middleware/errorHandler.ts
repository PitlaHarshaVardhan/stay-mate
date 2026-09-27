import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err?.statusCode ?? err?.status ?? 500;
  const code = err?.code ?? 'INTERNAL_ERROR';
  const message = err?.message ?? 'Internal server error';

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV !== 'production' && err?.stack ? { stack: err.stack } : {}),
    },
  });
}
