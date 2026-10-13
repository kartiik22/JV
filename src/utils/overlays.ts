import type { OverlayCallout, VisionAnalysis } from '../types/vision';
import { normalizeUnit } from './coords';

/**
 * Build HUD callouts. Pin (targetX/Y) always prefers the object's bbox center
 * when the LLM gave an anchor — that is the true "where it is" point.
 * Card (x/y) stays where the LLM placed the label (or beside the object).
 */
export function resolveOverlays(analysis: VisionAnalysis | null | undefined): OverlayCallout[] {
  if (!analysis) return [];

  const objects = analysis.objects ?? [];

  const pinFor = (title: string, fallbackX: number, fallbackY: number) => {
    const match = objects.find(
      (o) => o.anchor && o.name.trim().toLowerCase() === title.trim().toLowerCase()
    );
    if (match?.anchor) {
      return {
        targetX: normalizeUnit(match.anchor.x + match.anchor.w / 2),
        targetY: normalizeUnit(match.anchor.y + match.anchor.h / 2),
      };
    }
    return {
      targetX: normalizeUnit(fallbackX),
      targetY: normalizeUnit(fallbackY),
    };
  };

  const fromAi = (analysis.overlays ?? [])
    .filter((o) => o.title && o.detail)
    .slice(0, 5)
    .map((o) => {
      const pin = pinFor(o.title, o.targetX, o.targetY);
      return {
        title: o.title,
        detail: o.detail,
        x: normalizeUnit(o.x),
        y: normalizeUnit(o.y),
        targetX: pin.targetX,
        targetY: pin.targetY,
      };
    });

  if (fromAi.length > 0) return fromAi;

  const fromObjects: OverlayCallout[] = [];
  for (let i = 0; i < Math.min(objects.length, 5); i++) {
    const obj = objects[i];
    if (!obj.anchor) continue; // no inventing fake pin positions

    const a = obj.anchor;
    const cx = normalizeUnit(a.x + a.w / 2);
    const cy = normalizeUnit(a.y + a.h / 2);
    const preferLeft = cx > 0.55;
    fromObjects.push({
      title: obj.name,
      detail: obj.description.slice(0, 120),
      x: normalizeUnit(preferLeft ? cx - 0.28 : cx + a.w / 2 + 0.04),
      y: normalizeUnit(cy - 0.06),
      targetX: cx,
      targetY: cy,
    });
  }

  if (fromObjects.length > 0) return fromObjects;

  // Scene-only: no pin claim — put card bottom-left, tip at frame center
  if (analysis.sceneSummary) {
    return [
      {
        title: 'Scene',
        detail: analysis.sceneSummary.slice(0, 140),
        x: 0.06,
        y: 0.72,
        targetX: 0.5,
        targetY: 0.5,
      },
    ];
  }

  return [];
}
