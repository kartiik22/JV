import * as ImageManipulator from 'expo-image-manipulator';
import { CAPTURE_MAX_WIDTH, CAPTURE_QUALITY } from '../constants/theme';

export interface PreparedImage {
  uri: string;
  width: number;
  height: number;
}

/**
 * Resize and heavily JPEG-compress a camera capture.
 * Smaller frames → fewer vision tokens → lower cost and fewer rate-limit hits.
 */
export async function prepareCaptureForUpload(
  uri: string,
  maxWidth = CAPTURE_MAX_WIDTH,
  quality = CAPTURE_QUALITY
): Promise<PreparedImage> {
  // First pass: shrink + compress
  let result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  // Second pass if still wide (some platforms ignore resize oddly)
  if (result.width > maxWidth) {
    result = await ImageManipulator.manipulateAsync(
      result.uri,
      [{ resize: { width: maxWidth } }],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
  }

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}

export function formatTimestamp(isoOrMs: string | number | null | undefined): string {
  if (isoOrMs == null) return '—';
  const date = typeof isoOrMs === 'number' ? new Date(isoOrMs) : new Date(isoOrMs);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}
