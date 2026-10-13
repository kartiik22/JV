import { useCallback, useEffect, useRef, useState } from 'react';
import type { CameraView } from 'expo-camera';
import { AppState, type AppStateStatus } from 'react-native';
import { prepareCaptureForUpload } from '../utils/imageUtils';
import {
  CAPTURE_QUALITY,
  DEFAULT_CAPTURE_INTERVAL_MS,
} from '../constants/theme';
import type { CapturedFrame, ScanningStatus } from '../types/vision';
import { log } from '../utils/logger';

interface UseCameraCaptureOptions {
  intervalMs?: number;
  cameraReady: boolean;
  onFrame: (frame: CapturedFrame) => Promise<void> | void;
  isAnalysisBusy: boolean;
}

interface UseCameraCaptureResult {
  scanningStatus: ScanningStatus;
  countdownSec: number;
  lastCaptureAt: number | null;
  captureError: string | null;
  startScanning: () => void;
  pauseScanning: () => void;
  resumeScanning: () => void;
  stopScanning: () => void;
  cameraRef: React.RefObject<CameraView | null>;
}

export function useCameraCapture({
  intervalMs = DEFAULT_CAPTURE_INTERVAL_MS,
  cameraReady,
  onFrame,
  isAnalysisBusy,
}: UseCameraCaptureOptions): UseCameraCaptureResult {
  const cameraRef = useRef<CameraView | null>(null);
  const [scanningStatus, setScanningStatus] = useState<ScanningStatus>('idle');
  const [countdownSec, setCountdownSec] = useState(Math.ceil(intervalMs / 1000));
  const [lastCaptureAt, setLastCaptureAt] = useState<number | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const scanningStatusRef = useRef<ScanningStatus>('idle');
  const isBusyRef = useRef(isAnalysisBusy);
  const isCapturingRef = useRef(false);
  const requestIdRef = useRef(0);
  const nextCaptureAtRef = useRef<number | null>(null);
  const intervalMsRef = useRef(intervalMs);
  const onFrameRef = useRef(onFrame);
  const cameraReadyRef = useRef(cameraReady);

  useEffect(() => {
    scanningStatusRef.current = scanningStatus;
    log.info('Capture', `Status → ${scanningStatus}`);
  }, [scanningStatus]);

  useEffect(() => {
    isBusyRef.current = isAnalysisBusy;
  }, [isAnalysisBusy]);

  useEffect(() => {
    intervalMsRef.current = intervalMs;
    log.info('Capture', `Interval set to ${intervalMs}ms`);
  }, [intervalMs]);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    cameraReadyRef.current = cameraReady;
    log.info('Capture', `Camera ready: ${cameraReady}`);
  }, [cameraReady]);

  const captureOnce = useCallback(async () => {
    if (
      scanningStatusRef.current !== 'scanning' ||
      isBusyRef.current ||
      isCapturingRef.current ||
      !cameraReadyRef.current ||
      !cameraRef.current
    ) {
      log.debug('Capture', 'Skip capture tick', {
        status: scanningStatusRef.current,
        busy: isBusyRef.current,
        capturing: isCapturingRef.current,
        ready: cameraReadyRef.current,
        hasRef: Boolean(cameraRef.current),
      });
      return;
    }

    isCapturingRef.current = true;
    setCaptureError(null);
    log.info('Capture', 'Taking picture…');

    try {
      let photo: { uri?: string } | undefined;
      try {
        photo = await cameraRef.current.takePictureAsync({
          quality: Math.min(CAPTURE_QUALITY + 0.1, 0.45),
          skipProcessing: true,
        });
      } catch (firstError) {
        log.warn('Capture', 'takePictureAsync failed once, retrying', firstError);
        photo = await cameraRef.current.takePictureAsync({
          quality: CAPTURE_QUALITY,
        });
      }

      if (!photo?.uri) {
        throw new Error('Camera returned an empty capture');
      }

      if (scanningStatusRef.current !== 'scanning') {
        log.info('Capture', 'Discarding frame — scanning no longer active');
        return;
      }

      const prepared = await prepareCaptureForUpload(photo.uri);
      const capturedAt = Date.now();
      requestIdRef.current += 1;

      log.info('Capture', `Frame ready #${requestIdRef.current}`, {
        uri: prepared.uri,
        width: prepared.width,
        height: prepared.height,
      });

      setLastCaptureAt(capturedAt);

      await onFrameRef.current({
        uri: prepared.uri,
        capturedAt,
        requestId: requestIdRef.current,
        width: prepared.width,
        height: prepared.height,
      });

      nextCaptureAtRef.current = Date.now() + intervalMsRef.current;
      setCountdownSec(Math.ceil(intervalMsRef.current / 1000));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to capture camera frame';
      log.error('Capture', message, error);
      setCaptureError(message);
      nextCaptureAtRef.current = Date.now() + intervalMsRef.current;
    } finally {
      isCapturingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (scanningStatus !== 'scanning') {
      return;
    }

    if (nextCaptureAtRef.current == null) {
      nextCaptureAtRef.current = Date.now();
    }

    const tick = setInterval(() => {
      if (scanningStatusRef.current !== 'scanning') {
        return;
      }

      if (isBusyRef.current || isCapturingRef.current) {
        setCountdownSec(0);
        return;
      }

      const target = nextCaptureAtRef.current ?? Date.now();
      const remaining = Math.max(0, target - Date.now());
      setCountdownSec(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        void captureOnce();
      }
    }, 250);

    return () => clearInterval(tick);
  }, [scanningStatus, captureOnce]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      log.info('Capture', `AppState → ${state}`);
      if (state !== 'active' && scanningStatusRef.current === 'scanning') {
        setScanningStatus('paused');
        nextCaptureAtRef.current = null;
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  const startScanning = useCallback(() => {
    log.info('Capture', 'Start scanning');
    setCaptureError(null);
    nextCaptureAtRef.current = Date.now();
    setCountdownSec(0);
    setScanningStatus('scanning');
  }, []);

  const pauseScanning = useCallback(() => {
    log.info('Capture', 'Pause scanning');
    setScanningStatus('paused');
    nextCaptureAtRef.current = null;
  }, []);

  const resumeScanning = useCallback(() => {
    log.info('Capture', 'Resume scanning');
    setCaptureError(null);
    nextCaptureAtRef.current = Date.now() + intervalMsRef.current;
    setCountdownSec(Math.ceil(intervalMsRef.current / 1000));
    setScanningStatus('scanning');
  }, []);

  const stopScanning = useCallback(() => {
    log.info('Capture', 'Stop scanning');
    setScanningStatus('stopped');
    nextCaptureAtRef.current = null;
    setCountdownSec(Math.ceil(intervalMsRef.current / 1000));
  }, []);

  return {
    scanningStatus,
    countdownSec,
    lastCaptureAt,
    captureError,
    startScanning,
    pauseScanning,
    resumeScanning,
    stopScanning,
    cameraRef,
  };
}
