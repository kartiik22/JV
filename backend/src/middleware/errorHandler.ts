import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image exceeds the maximum upload size'
        : err.message;
    res.status(400).json({
      error: message,
      code: err.code,
    });
    return;
  }

  if (err instanceof Error && /Unsupported image type/i.test(err.message)) {
    res.status(400).json({
      error: err.message,
      code: 'INVALID_IMAGE_TYPE',
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(502).json({
      error: 'Vision model returned an invalid response schema',
      code: 'INVALID_MODEL_RESPONSE',
      details: err.issues,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  const anyErr = err as {
    statusCode?: number;
    status?: number;
    code?: string;
    message?: string;
  };

  const status =
    anyErr.statusCode ||
    anyErr.status ||
    (anyErr.code === 'AI_NOT_CONFIGURED' ? 503 : 500);

  let message = anyErr.message || 'Unexpected server error';
  let code = anyErr.code || 'INTERNAL_ERROR';

  if (status === 429 || code === 'rate_limit_exceeded') {
    message = 'AI provider rate limit reached. Pause scanning and try again shortly.';
    code = 'RATE_LIMITED';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error('[sight-ai]', message);
  }

  res.status(status >= 400 && status < 600 ? status : 500).json({
    error: message,
    code,
  });
}
