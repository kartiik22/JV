import { Platform } from 'react-native';
import { API_BASE_URL, VISION_FETCH_TIMEOUT_MS } from '../constants/config';
import type { ApiErrorBody } from '../types/vision';
import { log } from '../utils/logger';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const timeoutMs = init?.timeoutMs ?? VISION_FETCH_TIMEOUT_MS;
  log.debug('API', `${init?.method || 'GET'} ${url}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    const { timeoutMs: _ignored, signal: _userSignal, ...rest } = init || {};
    response = await fetch(url, {
      ...rest,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    const aborted =
      (error instanceof Error && error.name === 'AbortError') ||
      (typeof DOMException !== 'undefined' &&
        error instanceof DOMException &&
        error.name === 'AbortError');

    if (aborted) {
      log.error('API', `Timed out after ${timeoutMs}ms → ${url}`);
      throw new ApiError(
        `Vision request timed out after ${Math.round(timeoutMs / 1000)}s. Try again or increase the interval.`,
        0,
        'TIMEOUT'
      );
    }

    log.error('API', `Network failure → ${url}`, error);
    throw new ApiError(
      `Cannot reach Sight AI backend at ${API_BASE_URL}. Is the server running? (${
        error instanceof Error ? error.message : 'Failed to fetch'
      })`,
      0,
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timer);
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const errBody = body as ApiErrorBody | null;
    log.error('API', `HTTP ${response.status} ${url}`, errBody);
    throw new ApiError(
      errBody?.error || `Request failed (${response.status})`,
      response.status,
      errBody?.code
    );
  }

  log.debug('API', `OK ${response.status} ${url}`);
  return body as T;
}

async function uriToBlob(uri: string): Promise<{ blob: Blob; mime: string }> {
  if (uri.startsWith('data:')) {
    const match = uri.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new ApiError('Invalid data-URI image', 400, 'INVALID_IMAGE');
    }
    const mime = match[1] || 'image/jpeg';
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { blob: new Blob([bytes], { type: mime }), mime };
  }

  const response = await fetch(uri);
  if (!response.ok) {
    throw new ApiError(
      `Could not read captured image (${response.status})`,
      400,
      'INVALID_IMAGE'
    );
  }
  const blob = await response.blob();
  const mime = blob.type || 'image/jpeg';
  return { blob, mime };
}

/**
 * Build multipart form data that works on both native and web.
 * Do NOT set Content-Type manually — the browser must add the boundary.
 */
export async function buildImageFormData(
  imageUri: string,
  extraFields?: Record<string, string>
): Promise<FormData> {
  const formData = new FormData();
  const filename = `capture-${Date.now()}.jpg`;

  if (Platform.OS === 'web') {
    const { blob, mime } = await uriToBlob(imageUri);
    const type = mime && mime !== 'application/octet-stream' ? mime : 'image/jpeg';
    const file = new File([blob], filename, { type });
    formData.append('image', file);
    log.debug('API', 'Web FormData image attached', {
      size: file.size,
      type: file.type,
      uriPrefix: imageUri.slice(0, 32),
    });
  } else {
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: filename,
    } as unknown as Blob);
    log.debug('API', 'Native FormData image attached', {
      uriPrefix: imageUri.slice(0, 48),
    });
  }

  if (extraFields) {
    Object.entries(extraFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  return formData;
}
