import { z } from 'zod';

/** Accept 0–1, or 0–100 percentages from local models. */
const Norm = z.preprocess((v) => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return undefined;
  if (n > 1 && n <= 100) return n / 100;
  return n;
}, z.number().min(0).max(1));

const NormSize = z.preprocess((v) => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return undefined;
  if (n > 1 && n <= 100) return n / 100;
  return n;
}, z.number().min(0.02).max(1));

/** Normalized 0–1 rectangle in the camera frame (origin top-left). */
export const AnchorSchema = z.object({
  x: Norm,
  y: Norm,
  w: NormSize.default(0.2),
  h: NormSize.default(0.15),
});

export const DetectedObjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  inferredPurpose: z.string().optional(),
  isInferred: z.boolean().optional(),
  /** Tight bbox around the object (normalized). */
  anchor: AnchorSchema.optional(),
  /** Preferred side for the floating description card. */
  labelSide: z.enum(['left', 'right', 'top', 'bottom']).optional().default('right'),
});

/** Explicit HUD callout the client renders as a floating div. */
export const OverlayCalloutSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  /** Label card position (normalized 0–1) — NOT on the object. */
  x: Norm,
  y: Norm,
  /**
   * Pin tip: exact center of the object in the image (normalized 0–1).
   * Must match the visual center of that object — this is where the HUD dot goes.
   */
  targetX: Norm,
  targetY: Norm,
});

export const TextRecognitionSchema = z.object({
  text: z.array(z.string()),
  status: z.string().min(1),
});

export const VisionAnalysisSchema = z.object({
  sceneSummary: z.string().min(1),
  mainActivity: z.string().optional().default(''),
  objects: z.array(DetectedObjectSchema).default([]),
  overlays: z.array(OverlayCalloutSchema).optional().default([]),
  objectIntelligence: z
    .array(
      z.object({
        name: z.string(),
        facts: z.string(),
        inferences: z.string().optional().default(''),
      })
    )
    .optional()
    .default([]),
  textRecognition: TextRecognitionSchema,
  spatialObservations: z.array(z.string()).default([]),
  insights: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
});

export type VisionAnalysis = z.infer<typeof VisionAnalysisSchema>;
export type OverlayCallout = z.infer<typeof OverlayCalloutSchema>;
export type DetectedObject = z.infer<typeof DetectedObjectSchema>;

export const AskResponseSchema = z.object({
  answer: z.string().min(1),
  groundedInImage: z.boolean().default(true),
  limitations: z.array(z.string()).default([]),
});

export type AskResponse = z.infer<typeof AskResponseSchema>;
