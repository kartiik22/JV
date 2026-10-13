import { useCallback, useEffect, useRef, useState } from 'react';
import { analyzeFrame, askAboutFrame, checkHealth } from '../services/visionService';
import { ApiError } from '../services/api';
import { log } from '../utils/logger';
import type {
  AskResponse,
  CapturedFrame,
  HealthResponse,
  VisionAnalysis,
} from '../types/vision';

interface AnalysisState {
  analysis: VisionAnalysis | null;
  analyzedAt: string | null;
  durationMs: number | null;
  model: string | null;
  isStale: boolean;
  requestId: number | null;
  /** Size of the image the LLM analyzed — for pin → preview mapping. */
  frameWidth: number | null;
  frameHeight: number | null;
}

interface UseVisionAnalysisResult {
  analysisState: AnalysisState;
  isAnalyzing: boolean;
  analysisError: string | null;
  analysisErrorCode: string | null;
  health: HealthResponse | null;
  healthError: string | null;
  latestImageUri: string | null;
  askAnswer: AskResponse | null;
  isAsking: boolean;
  askError: string | null;
  processFrame: (frame: CapturedFrame) => Promise<void>;
  askQuestion: (question: string) => Promise<void>;
  refreshHealth: () => Promise<void>;
  clearAsk: () => void;
}

const emptyAnalysisState: AnalysisState = {
  analysis: null,
  analyzedAt: null,
  durationMs: null,
  model: null,
  isStale: false,
  requestId: null,
  frameWidth: null,
  frameHeight: null,
};

export function useVisionAnalysis(): UseVisionAnalysisResult {
  const [analysisState, setAnalysisState] = useState<AnalysisState>(emptyAnalysisState);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisErrorCode, setAnalysisErrorCode] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [latestImageUri, setLatestImageUri] = useState<string | null>(null);
  const [askAnswer, setAskAnswer] = useState<AskResponse | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const latestRequestIdRef = useRef(0);
  const inFlightRef = useRef(false);
  const latestImageRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      const result = await checkHealth();
      if (!mountedRef.current) return;
      setHealth(result);
      setHealthError(null);
      log.info('Vision', 'Health OK', {
        aiConfigured: result.aiConfigured,
        model: result.model,
      });
    } catch (error) {
      if (!mountedRef.current) return;
      const message =
        error instanceof Error ? error.message : 'Backend health check failed';
      log.error('Vision', 'Health check failed', error);
      setHealthError(message);
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    void refreshHealth();
    const id = setInterval(() => {
      void refreshHealth();
    }, 30000);
    return () => clearInterval(id);
  }, [refreshHealth]);

  const processFrame = useCallback(async (frame: CapturedFrame) => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    latestRequestIdRef.current = frame.requestId;
    latestImageRef.current = frame.uri;
    log.info('Vision', `Analyze frame #${frame.requestId}`);

    if (mountedRef.current) {
      setLatestImageUri(frame.uri);
      setIsAnalyzing(true);
      setAnalysisError(null);
      setAnalysisErrorCode(null);
      setAnalysisState((prev) =>
        prev.analysis ? { ...prev, isStale: true } : prev
      );
    }

    try {
      const result = await analyzeFrame(frame.uri);

      if (!mountedRef.current) return;

      if (frame.requestId !== latestRequestIdRef.current) {
        log.warn('Vision', `Ignoring stale response #${frame.requestId}`);
        return;
      }

      log.info('Vision', `Analyze OK #${frame.requestId}`, {
        durationMs: result.durationMs,
        model: result.model,
        objects: result.analysis.objects?.length ?? 0,
      });

      setAnalysisState({
        analysis: result.analysis,
        analyzedAt: result.analyzedAt,
        durationMs: result.durationMs,
        model: result.model,
        isStale: false,
        requestId: frame.requestId,
        frameWidth: frame.width,
        frameHeight: frame.height,
      });
      setAnalysisError(null);
      setAnalysisErrorCode(null);
    } catch (error) {
      if (!mountedRef.current) return;
      if (frame.requestId !== latestRequestIdRef.current) {
        return;
      }

      log.error('Vision', `Analyze failed #${frame.requestId}`, error);

      if (error instanceof ApiError) {
        setAnalysisError(error.message);
        setAnalysisErrorCode(error.code || null);
      } else {
        setAnalysisError(
          error instanceof Error ? error.message : 'Vision analysis failed'
        );
        setAnalysisErrorCode(null);
      }
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) {
        setIsAnalyzing(false);
      }
    }
  }, []);

  const askQuestion = useCallback(async (question: string) => {
    const imageUri = latestImageRef.current;
    if (!imageUri) {
      setAskError('Capture at least one frame before asking a question.');
      return;
    }

    const trimmed = question.trim();
    if (!trimmed) {
      setAskError('Enter a question about the current frame.');
      return;
    }

    setIsAsking(true);
    setAskError(null);

    try {
      const result = await askAboutFrame(imageUri, trimmed);
      if (!mountedRef.current) return;
      setAskAnswer(result);
    } catch (error) {
      if (!mountedRef.current) return;
      if (error instanceof ApiError) {
        setAskError(error.message);
      } else {
        setAskError(error instanceof Error ? error.message : 'Ask failed');
      }
    } finally {
      if (mountedRef.current) {
        setIsAsking(false);
      }
    }
  }, []);

  const clearAsk = useCallback(() => {
    setAskAnswer(null);
    setAskError(null);
  }, []);

  return {
    analysisState,
    isAnalyzing,
    analysisError,
    analysisErrorCode,
    health,
    healthError,
    latestImageUri,
    askAnswer,
    isAsking,
    askError,
    processFrame,
    askQuestion,
    refreshHealth,
    clearAsk,
  };
}
