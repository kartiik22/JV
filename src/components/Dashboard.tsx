import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare, PanelBottom } from 'lucide-react-native';
import { log } from '../utils/logger';
import { ScanStatusBar } from './ScanStatusBar';
import { CameraPreview } from './CameraPreview';
import { ScanningControls } from './ScanningControls';
import { SceneAnalysisCard } from './SceneAnalysisCard';
import { ObjectDetectionCard } from './ObjectDetectionCard';
import { ObjectIntelligenceCard } from './ObjectIntelligenceCard';
import { TextRecognitionCard } from './TextRecognitionCard';
import { SpatialObservationsCard } from './SpatialObservationsCard';
import { InsightsCard } from './InsightsCard';
import { AskJarvisPanel } from './AskJarvisPanel';
import { PermissionGate } from './PermissionGate';
import { useCameraCapture } from '../hooks/useCameraCapture';
import { useVisionAnalysis } from '../hooks/useVisionAnalysis';
import {
  colors,
  DEFAULT_CAPTURE_INTERVAL_MS,
  radii,
  spacing,
  typography,
} from '../constants/theme';
import { API_BASE_URL } from '../constants/config';
import { formatDuration } from '../utils/imageUtils';
import type { SystemStatus } from '../types/vision';

export function Dashboard() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [intervalMs, setIntervalMs] = useState(DEFAULT_CAPTURE_INTERVAL_MS);
  const [intervalInput, setIntervalInput] = useState(
    String(DEFAULT_CAPTURE_INTERVAL_MS / 1000)
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => {
    log.info('Dashboard', 'Mounted HUD mode', {
      apiBaseUrl: API_BASE_URL,
      intervalMs: DEFAULT_CAPTURE_INTERVAL_MS,
    });
  }, []);

  const {
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
  } = useVisionAnalysis();

  const onFrame = useCallback(
    async (frame: Parameters<typeof processFrame>[0]) => {
      await processFrame(frame);
    },
    [processFrame]
  );

  const {
    scanningStatus,
    countdownSec,
    lastCaptureAt,
    captureError,
    startScanning,
    pauseScanning,
    resumeScanning,
    stopScanning,
    cameraRef,
  } = useCameraCapture({
    intervalMs,
    cameraReady,
    onFrame,
    isAnalysisBusy: isAnalyzing,
  });

  const systemStatus: SystemStatus = useMemo(() => {
    if (healthError || (health && !health.aiConfigured)) return 'OFFLINE';
    if (isAnalyzing) return 'ANALYZING';
    if (scanningStatus === 'paused') return 'PAUSED';
    if (scanningStatus === 'scanning') return 'ONLINE';
    if (health?.aiConfigured) return 'ONLINE';
    return 'OFFLINE';
  }, [health, healthError, isAnalyzing, scanningStatus]);

  const refreshKey = analysisState.analyzedAt;

  useEffect(() => {
    if (analysisErrorCode === 'RATE_LIMITED' && scanningStatus === 'scanning') {
      log.warn('Dashboard', 'Rate limited — auto-pausing scan');
      pauseScanning();
    }
  }, [analysisErrorCode, scanningStatus, pauseScanning]);

  const applyInterval = () => {
    const seconds = Number(intervalInput);
    if (!Number.isFinite(seconds) || seconds < 3 || seconds > 60) {
      setIntervalInput(String(intervalMs / 1000));
      return;
    }
    setIntervalMs(Math.round(seconds * 1000));
  };

  if (!permission) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Initializing Sight AI…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <PermissionGate
        onRequest={() => {
          void requestPermission();
        }}
        denied={permission.canAskAgain === false}
      />
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <CameraPreview
        cameraRef={cameraRef}
        permissionGranted
        onCameraReady={() => setCameraReady(true)}
        scanningStatus={scanningStatus}
        countdownSec={countdownSec}
        isAnalyzing={isAnalyzing}
        lastCaptureAt={lastCaptureAt}
        lastAnalyzedAt={analysisState.analyzedAt}
        isStale={analysisState.isStale}
        analysis={analysisState.analysis}
        frameWidth={analysisState.frameWidth}
        frameHeight={analysisState.frameHeight}
        fullscreen
      />

      <SafeAreaView style={styles.topChrome} edges={['top']} pointerEvents="box-none">
        <ScanStatusBar
          systemStatus={systemStatus}
          scanningStatus={scanningStatus}
          cameraReady={cameraReady}
          model={analysisState.model || health?.model}
        />
      </SafeAreaView>

      <SafeAreaView style={styles.bottomChrome} edges={['bottom']} pointerEvents="box-none">
        {(healthError ||
          analysisError ||
          captureError ||
          (health && !health.aiConfigured)) && (
          <View style={styles.alert}>
            {health && !health.aiConfigured ? (
              <Text style={styles.alertText}>
                Backend online but AI not configured.
              </Text>
            ) : null}
            {healthError ? (
              <Text style={styles.alertText}>Backend: {healthError}</Text>
            ) : null}
            {analysisError ? (
              <Text style={styles.alertText}>Analysis: {analysisError}</Text>
            ) : null}
            {captureError ? (
              <Text style={styles.alertText}>Capture: {captureError}</Text>
            ) : null}
          </View>
        )}

        <View style={styles.controlsDock}>
          <ScanningControls
            status={scanningStatus}
            disabled={!cameraReady}
            onStart={startScanning}
            onPause={pauseScanning}
            onResume={resumeScanning}
            onStop={stopScanning}
          />

          <View style={styles.dockRow}>
            <View style={styles.intervalRow}>
              <Text style={styles.intervalLabel}>SEC</Text>
              <TextInput
                style={styles.intervalInput}
                keyboardType="number-pad"
                value={intervalInput}
                onChangeText={setIntervalInput}
                onBlur={applyInterval}
                onSubmitEditing={applyInterval}
                maxLength={2}
              />
              <Text style={styles.metaChip}>
                {formatDuration(analysisState.durationMs)}
              </Text>
            </View>

            <Pressable style={styles.iconBtn} onPress={() => setAskOpen(true)}>
              <MessageSquare size={16} color={colors.cyan} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => setSheetOpen(true)}>
              <PanelBottom size={16} color={colors.cyan} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <Modal
        visible={sheetOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setSheetOpen(false)}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable style={styles.sheetDismiss} onPress={() => setSheetOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>FULL INTEL</Text>
            <ScrollView
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
            >
              <SceneAnalysisCard
                analysis={analysisState.analysis}
                refreshKey={refreshKey}
              />
              <ObjectDetectionCard
                analysis={analysisState.analysis}
                refreshKey={refreshKey}
              />
              <ObjectIntelligenceCard
                analysis={analysisState.analysis}
                refreshKey={refreshKey}
              />
              <TextRecognitionCard
                analysis={analysisState.analysis}
                refreshKey={refreshKey}
              />
              <SpatialObservationsCard
                analysis={analysisState.analysis}
                refreshKey={refreshKey}
              />
              <InsightsCard
                analysis={analysisState.analysis}
                refreshKey={refreshKey}
              />
              <View style={{ height: spacing.xxl }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={askOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setAskOpen(false)}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable style={styles.sheetDismiss} onPress={() => setAskOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>ASK JARVIS</Text>
            <View style={styles.sheetContent}>
              <AskJarvisPanel
                onAsk={askQuestion}
                isAsking={isAsking}
                answer={askAnswer}
                error={askError}
                disabled={!latestImageUri}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.label,
    color: colors.cyan,
  },
  topChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomChrome: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  controlsDock: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(5, 12, 20, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.28)',
    gap: spacing.md,
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  intervalLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 9,
  },
  intervalInput: {
    width: 44,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    borderRadius: radii.sm,
    color: colors.cyan,
    textAlign: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  metaChip: {
    ...typography.label,
    color: colors.electric,
    fontSize: 9,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  alert: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    backgroundColor: 'rgba(20, 8, 8, 0.85)',
    gap: spacing.sm,
  },
  alertText: {
    ...typography.body,
    color: colors.danger,
    fontSize: 12,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetDismiss: {
    flex: 1,
  },
  sheet: {
    maxHeight: '72%',
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    paddingTop: spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.panelBorder,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    ...typography.label,
    color: colors.cyan,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
