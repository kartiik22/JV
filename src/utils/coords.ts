/**
 * Map a normalized image point (0–1, top-left origin) onto a camera preview
 * that uses object-fit: cover (fills the view, crops overflow).
 */
export function mapImagePointToView(
  nx: number,
  ny: number,
  imageW: number,
  imageH: number,
  viewW: number,
  viewH: number
): { x: number; y: number } {
  if (imageW <= 0 || imageH <= 0 || viewW <= 0 || viewH <= 0) {
    return { x: nx * viewW, y: ny * viewH };
  }

  const scale = Math.max(viewW / imageW, viewH / imageH);
  const dispW = imageW * scale;
  const dispH = imageH * scale;
  const offsetX = (viewW - dispW) / 2;
  const offsetY = (viewH - dispH) / 2;

  return {
    x: nx * dispW + offsetX,
    y: ny * dispH + offsetY,
  };
}

/** Map a normalized image rect onto a cover-fitted preview. */
export function mapImageRectToView(
  x: number,
  y: number,
  w: number,
  h: number,
  imageW: number,
  imageH: number,
  viewW: number,
  viewH: number
): { left: number; top: number; width: number; height: number } {
  const tl = mapImagePointToView(x, y, imageW, imageH, viewW, viewH);
  const br = mapImagePointToView(x + w, y + h, imageW, imageH, viewW, viewH);
  return {
    left: tl.x,
    top: tl.y,
    width: Math.max(br.x - tl.x, 8),
    height: Math.max(br.y - tl.y, 8),
  };
}

/** Accept 0–1, or 0–100 percentages from sloppy model output. */
export function normalizeUnit(n: unknown, fallback = 0.5): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  if (v > 1 && v <= 100) return Math.min(1, Math.max(0, v / 100));
  return Math.min(1, Math.max(0, v));
}
