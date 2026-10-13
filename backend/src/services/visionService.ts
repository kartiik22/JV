import OpenAI from 'openai';
import {
  AskResponseSchema,
  VisionAnalysisSchema,
  type AskResponse,
  type OverlayCallout,
  type VisionAnalysis,
} from '../schemas/visionSchema.js';

const ANALYSIS_SYSTEM_PROMPT = `You are Sight AI — a JARVIS-style visual HUD assistant.
Analyze ONLY what is visible. Do not invent objects or text.

COORDINATES (critical — the mobile app places a glowing pin on targetX/targetY):
- Origin is the TOP-LEFT of the image. x increases right, y increases down.
- All values are fractions of image width/height in range 0.0 to 1.0 (NOT pixels, NOT percent).
- For each object, set anchor to a TIGHT bounding box: x,y = top-left corner, w,h = size.
- For each overlay, targetX/targetY MUST be the exact visual CENTER of that object
  (same as anchor.x + anchor.w/2, anchor.y + anchor.h/2). Never put the pin on empty space.
- Overlay x,y is where the DESCRIPTION CARD floats (next to the object, not on it).
- If an object is on the left half, put the card on the right of it (and vice versa).

Keep JSON valid. No markdown. No trailing commas. Max 4 objects and 4 overlays.`;

const ANALYSIS_USER_PROMPT = `Locate each visible object and return ONLY this JSON:
{"sceneSummary":"one short sentence","mainActivity":"","objects":[{"name":"Cup","description":"white ceramic mug on desk","inferredPurpose":"drinking","isInferred":false,"anchor":{"x":0.18,"y":0.42,"w":0.16,"h":0.22},"labelSide":"right"}],"overlays":[{"title":"Cup","detail":"white ceramic mug on desk","x":0.42,"y":0.38,"targetX":0.26,"targetY":0.53}],"objectIntelligence":[],"textRecognition":{"text":[],"status":"none"},"spatialObservations":[],"insights":[],"limitations":[]}

Pin accuracy rules:
1) targetX = center of object horizontally (look carefully)
2) targetY = center of object vertically (look carefully)
3) target MUST sit inside the object's anchor box
4) Do not guess random mid-frame points — measure against what you see`;

const ASK_SYSTEM_PROMPT = `You are Sight AI answering a question about a camera image.
Answer only from what is visible. If unsure, say so.
Return valid JSON only. No markdown. No trailing commas.`;

function getClient(): OpenAI {
  // Local Ollama — no real API key required (OpenAI SDK still wants a string).
  // OpenRouter / cloud key path is commented out for now.

  const baseURL = process.env.AI_BASE_URL || 'http://127.0.0.1:11434/v1';
  const apiKey = process.env.AI_API_KEY || 'ollama';

  return new OpenAI({
    apiKey,
    baseURL,
    timeout: Number(process.env.AI_TIMEOUT_MS || 120000),
  });
}

function getModel(): string {
  return process.env.AI_MODEL || 'moondream';
}

function repairJson(text: string): string {
  let s = text.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }

  s = s
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/'/g, '"')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ');

  return s;
}

function extractJson(content: string): unknown {
  const attempts = [content.trim(), repairJson(content)];

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {
      // continue
    }
  }

  const repaired = repairJson(content);
  try {
    return JSON.parse(repaired);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Expected valid JSON from model (${message}). Raw: ${content.slice(0, 200)}`);
  }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0.5;
  if (n > 1 && n <= 100) return Math.min(1, Math.max(0, n / 100));
  return Math.min(1, Math.max(0, n));
}

function labelSideOffset(
  side: 'left' | 'right' | 'top' | 'bottom',
  cx: number,
  cy: number,
  w: number,
  h: number
): { x: number; y: number } {
  switch (side) {
    case 'left':
      return { x: clamp01(cx - w / 2 - 0.18), y: clamp01(cy - 0.04) };
    case 'top':
      return { x: clamp01(cx - 0.08), y: clamp01(cy - h / 2 - 0.12) };
    case 'bottom':
      return { x: clamp01(cx - 0.08), y: clamp01(cy + h / 2 + 0.04) };
    case 'right':
    default:
      return { x: clamp01(cx + w / 2 + 0.04), y: clamp01(cy - 0.04) };
  }
}

function objectCenter(
  analysis: VisionAnalysis,
  title: string
): { x: number; y: number } | null {
  const match = analysis.objects.find(
    (o) => o.anchor && o.name.trim().toLowerCase() === title.trim().toLowerCase()
  );
  if (!match?.anchor) return null;
  return {
    x: clamp01(match.anchor.x + match.anchor.w / 2),
    y: clamp01(match.anchor.y + match.anchor.h / 2),
  };
}

/**
 * Prefer LLM overlays, but snap each pin to the matching object's bbox center
 * when available so the HUD dot lands on the object, not empty space.
 */
function ensureOverlays(analysis: VisionAnalysis): VisionAnalysis {
  const existing = analysis.overlays ?? [];

  if (existing.length > 0) {
    return {
      ...analysis,
      overlays: existing.slice(0, 4).map((o) => {
        const center = objectCenter(analysis, o.title);
        return {
          ...o,
          x: clamp01(o.x),
          y: clamp01(o.y),
          targetX: center?.x ?? clamp01(o.targetX),
          targetY: center?.y ?? clamp01(o.targetY),
        };
      }),
    };
  }

  const overlays: OverlayCallout[] = [];

  for (let i = 0; i < Math.min(analysis.objects.length, 4); i++) {
    const obj = analysis.objects[i];
    if (!obj.anchor) continue; // never invent fake pin locations
    const a = obj.anchor;
    const cx = clamp01(a.x + a.w / 2);
    const cy = clamp01(a.y + a.h / 2);
    const side = obj.labelSide ?? (cx > 0.55 ? 'left' : 'right');
    const label = labelSideOffset(side, cx, cy, a.w, a.h);
    overlays.push({
      title: obj.name,
      detail: obj.description.slice(0, 120),
      x: label.x,
      y: label.y,
      targetX: cx,
      targetY: cy,
    });
  }

  if (overlays.length === 0 && analysis.sceneSummary) {
    overlays.push({
      title: 'Scene',
      detail: analysis.sceneSummary.slice(0, 140),
      x: 0.08,
      y: 0.72,
      targetX: 0.5,
      targetY: 0.5,
    });
  }

  return { ...analysis, overlays };
}

function coerceAnalysis(raw: unknown, fallbackText: string): VisionAnalysis {
  if (raw && typeof raw === 'object') {
    const result = VisionAnalysisSchema.safeParse(raw);
    if (result.success) {
      return ensureOverlays(result.data);
    }

    // Soften partial parses: try to salvage sceneSummary + objects
    const partial = raw as Record<string, unknown>;
    if (typeof partial.sceneSummary === 'string' && partial.sceneSummary.length > 0) {
      const softened = VisionAnalysisSchema.safeParse({
        sceneSummary: partial.sceneSummary,
        mainActivity: typeof partial.mainActivity === 'string' ? partial.mainActivity : '',
        objects: Array.isArray(partial.objects) ? partial.objects : [],
        overlays: Array.isArray(partial.overlays) ? partial.overlays : [],
        objectIntelligence: [],
        textRecognition: { text: [], status: 'partial' },
        spatialObservations: [],
        insights: [],
        limitations: ['Partial schema from model'],
      });
      if (softened.success) return ensureOverlays(softened.data);
    }
  }

  const summary = fallbackText.trim().slice(0, 400) || 'Unable to parse structured analysis';
  return ensureOverlays(
    VisionAnalysisSchema.parse({
      sceneSummary: summary,
      mainActivity: '',
      objects: [],
      overlays: [],
      objectIntelligence: [],
      textRecognition: { text: [], status: 'unavailable' },
      spatialObservations: [],
      insights: [],
      limitations: ['Model returned non-schema JSON; showing raw summary'],
    })
  );
}

function coerceAsk(raw: unknown, fallbackText: string): AskResponse {
  if (raw && typeof raw === 'object') {
    const result = AskResponseSchema.safeParse(raw);
    if (result.success) return result.data;
  }

  return AskResponseSchema.parse({
    answer: fallbackText.trim().slice(0, 800) || 'No answer returned',
    groundedInImage: true,
    limitations: ['Model returned non-schema JSON'],
  });
}

function toDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

export async function analyzeImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<{ analysis: VisionAnalysis; model: string; durationMs: number }> {
  const client = getClient();
  const model = getModel();
  const started = Date.now();

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.1,
    max_tokens: 700,
    messages: [
      { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: ANALYSIS_USER_PROMPT },
          {
            type: 'image_url',
            image_url: {
              url: toDataUrl(imageBuffer, mimeType),
              detail: 'low',
            },
          },
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('Empty response from vision model');
  }

  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch {
    parsed = null;
  }

  const analysis = coerceAnalysis(parsed, raw);

  return {
    analysis,
    model,
    durationMs: Date.now() - started,
  };
}

export async function askAboutImage(
  imageBuffer: Buffer,
  mimeType: string,
  question: string
): Promise<{ response: AskResponse; model: string; durationMs: number }> {
  const client = getClient();
  const model = getModel();
  const started = Date.now();

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.1,
    max_tokens: 300,
    messages: [
      { role: 'system', content: ASK_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Question: ${question}\n\nReturn ONLY JSON: {"answer":"...","groundedInImage":true,"limitations":[]}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: toDataUrl(imageBuffer, mimeType),
              detail: 'low',
            },
          },
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('Empty response from vision model');
  }

  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch {
    parsed = null;
  }

  const response = coerceAsk(parsed, raw);

  return {
    response,
    model,
    durationMs: Date.now() - started,
  };
}

export function isAiConfigured(): boolean {
  const base = process.env.AI_BASE_URL || 'http://127.0.0.1:11434/v1';
  if (base.includes('11434') || base.includes('localhost') || base.includes('127.0.0.1')) {
    return true;
  }
  return true;
}
