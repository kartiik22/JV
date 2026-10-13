import { apiFetch, buildImageFormData } from './api';
import type { AnalyzeResponse, AskResponse, HealthResponse } from '../types/vision';

export async function checkHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/api/health');
}

export async function analyzeFrame(imageUri: string): Promise<AnalyzeResponse> {
  const formData = await buildImageFormData(imageUri);
  return apiFetch<AnalyzeResponse>('/api/vision/analyze', {
    method: 'POST',
    body: formData,
  });
}

export async function askAboutFrame(
  imageUri: string,
  question: string
): Promise<AskResponse> {
  const formData = await buildImageFormData(imageUri, { question });
  return apiFetch<AskResponse>('/api/vision/ask', {
    method: 'POST',
    body: formData,
  });
}
