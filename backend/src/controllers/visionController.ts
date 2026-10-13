import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { analyzeImage, askAboutImage, isAiConfigured } from '../services/visionService.js';
import { AppError } from '../middleware/errorHandler.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

function getUploadedImage(req: Request): { buffer: Buffer; mimeType: string } {
  const file = req.file;
  if (!file) {
    throw new AppError('Image file is required (field name: image)', 400, 'MISSING_IMAGE');
  }

  const mimeType = (file.mimetype || 'image/jpeg').toLowerCase();
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new AppError(
      'Unsupported image type. Use JPEG, PNG, or WebP.',
      400,
      'INVALID_IMAGE_TYPE'
    );
  }

  if (!file.buffer || file.buffer.length === 0) {
    throw new AppError('Uploaded image is empty', 400, 'EMPTY_IMAGE');
  }

  return { buffer: file.buffer, mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType };
}

function ensureConfigured(): void {
  if (!isAiConfigured()) {
    throw new AppError(
      'AI_API_KEY is not configured on the server. Add it to backend/.env and restart.',
      503,
      'AI_NOT_CONFIGURED'
    );
  }
}

export async function analyzeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    ensureConfigured();
    const { buffer, mimeType } = getUploadedImage(req);
    const result = await analyzeImage(buffer, mimeType);

    res.json({
      success: true,
      analyzedAt: new Date().toISOString(),
      model: result.model,
      durationMs: result.durationMs,
      analysis: result.analysis,
    });
  } catch (error) {
    next(error);
  }
}

const AskBodySchema = z.object({
  question: z.string().trim().min(1).max(500),
});

export async function askHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    ensureConfigured();
    const { buffer, mimeType } = getUploadedImage(req);

    const questionRaw =
      typeof req.body?.question === 'string' ? req.body.question : '';
    const { question } = AskBodySchema.parse({ question: questionRaw });

    const result = await askAboutImage(buffer, mimeType, question);

    res.json({
      success: true,
      askedAt: new Date().toISOString(),
      model: result.model,
      durationMs: result.durationMs,
      question,
      ...result.response,
    });
  } catch (error) {
    next(error);
  }
}

export function healthHandler(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    service: 'sight-ai-backend',
    aiConfigured: isAiConfigured(),
    model: process.env.AI_MODEL || 'gpt-4o-mini',
    timestamp: new Date().toISOString(),
  });
}
