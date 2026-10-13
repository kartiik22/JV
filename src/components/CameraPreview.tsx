import { RefObject, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { colors, spacing, typography } from '../constants/theme';
import { CountdownIndicator } from './CountdownIndicator';
import { VisionOverlayHud } from './VisionOverlayHud';
import { formatTimestamp } from '../utils/imageUtils';
import { resolveOverlays } from '../utils/overlays';
import type { ScanningStatus, VisionAnalysis } from '../types/vision';
import { log } from '../utils/logger';

interface Props {
  cameraRef: RefObject<CameraView | null>;
  permissionGranted: boolean;
  onCameraReady: () => void;
  scanningStatus: ScanningStatus;
  countdownSec: number;
  isAnalyzing: boolean;
  lastCaptureAt: number | null;
  lastAnalyzedAt: string | null;
  isStale: boolean;
  analysis: VisionAnalysis | null;
  /** Analyzed frame size for accurate pin placement on cover-fitted preview */
  frameWidth?: number | null;
  frameHeight?: number | null;
  /** Fill parent instead of fixed aspect card */
  fullscreen?: boolean;
}

export function CameraPreview({
  cameraRef,
  permissionGranted,
  onCameraReady,
  scanningStatus,
  countdownSec,
  isAnalyzing,
  lastCaptureAt,
  lastAnalyzedAt,
  isStale,
  analysis,
  frameWidth = null,
  frameHeight = null,
  fullscreen = true,
}: Props) {
  const [mountCamera, setMountCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const scanLine = useRef(new Animated.Value(0)).current;

  const overlays = resolveOverlays(analysis);

  useEffect(() => {
    if (!permissionGranted) {
      setMountCamera(false);
      return;
    }
    const id = setTimeout(() => {
      log.info('Camera', 'Mounting CameraView');
      setMountCamera(true);
    }, Platform.OS === 'web' ? 0 : 350);
    return () => clearTimeout(id);
  }, [permissionGranted]);

  useEffect(() => {
    if (scanningStatus !== 'scanning') {
      Animated.timing(scanLine, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return;
    }

    const loop = Animated.loop(
      Animated.timing(scanLine, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [scanningStatus, scanLine]);

  const scanTranslate = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(layout.height - 40, 420)],
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== layout.width || height !== layout.height) {
      setLayout({ width, height });
    }
  };

  if (!permissionGranted) {
    return (
      <View style={[styles.frame, fullscreen && styles.fullscreen, styles.placeholder]}>
        <Text style={styles.placeholderText}>CAMERA PERMISSION REQUIRED</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.frame, fullscreen && styles.fullscreen]}
      onLayout={onLayout}
    >
      {mountCamera ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onCameraReady={() => {
            log.info('Camera', 'onCameraReady');
            setCameraError(null);
            onCameraReady();
          }}
          onMountError={(event) => {
            log.error('Camera', 'Mount error', event.message);
            setCameraError(event.message);
          }}
        />
      ) : (
        <View style={[styles.camera, styles.placeholder]}>
          <Text style={styles.placeholderText}>INITIALIZING CAMERA…</Text>
        </View>
      )}

      {cameraError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{cameraError}</Text>
        </View>
      ) : null}

      {/* JARVIS description divs — AI tells x/y, we render here */}
      <VisionOverlayHud
        overlays={overlays}
        objects={analysis?.objects ?? []}
        isStale={isStale}
        width={layout.width}
        height={layout.height}
        imageWidth={frameWidth}
        imageHeight={frameHeight}
      />

      <View style={styles.chrome} pointerEvents="none">
        <View style={[styles.bracket, styles.tl]} />
        <View style={[styles.bracket, styles.tr]} />
        <View style={[styles.bracket, styles.bl]} />
        <View style={[styles.bracket, styles.br]} />
        <Animated.View
          style={[
            styles.scanBeam,
            {
              opacity: scanningStatus === 'scanning' ? 0.55 : 0,
              transform: [{ translateY: scanTranslate }],
            },
          ]}
        />
      </View>

      {analysis?.sceneSummary ? (
        <View style={styles.sceneBanner}>
          <Text style={styles.sceneLabel}>SIGHT</Text>
          <Text style={styles.sceneText} numberOfLines={2}>
            {analysis.sceneSummary}
          </Text>
        </View>
      ) : null}

      <View style={styles.hudTop}>
        <Text style={styles.hudLabel}>
          {isAnalyzing
            ? '◈ ANALYZING'
            : scanningStatus === 'scanning'
              ? '● LIVE HUD'
              : '○ PREVIEW'}
        </Text>
        <CountdownIndicator
          countdownSec={countdownSec}
          isActive={scanningStatus === 'scanning'}
          isBusy={isAnalyzing}
        />
      </View>

      <View style={styles.hudBottom}>
        <Text style={styles.hudMeta}>
          CAP {formatTimestamp(lastCaptureAt)}
        </Text>
        <Text style={styles.hudMeta}>
          HUD {overlays.length} · {formatTimestamp(lastAnalyzedAt)}
          {isStale ? ' · HOLD' : ''}
        </Text>
      </View>
    </View>
  );
}

const BRACKET = 28;

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 3 / 4,
    maxHeight: 480,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  fullscreen: {
    flex: 1,
    aspectRatio: undefined,
    maxHeight: undefined,
    borderRadius: 0,
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    ...typography.label,
    color: colors.textMuted,
  },
  errorBanner: {
    position: 'absolute',
    top: 56,
    left: 12,
    right: 12,
    zIndex: 8,
    backgroundColor: 'rgba(248,113,113,0.9)',
    padding: 8,
    borderRadius: 6,
  },
  errorText: {
    ...typography.body,
    color: '#fff',
    fontSize: 12,
  },
  chrome: {
    ...StyleSheet.absoluteFill,
    zIndex: 3,
  },
  bracket: {
    position: 'absolute',
    width: BRACKET,
    height: BRACKET,
    borderColor: 'rgba(0, 229, 255, 0.7)',
  },
  tl: {
    top: 52,
    left: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  tr: {
    top: 52,
    right: 14,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bl: {
    bottom: 88,
    left: 14,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  br: {
    bottom: 88,
    right: 14,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  scanBeam: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    height: 1.5,
    backgroundColor: colors.cyan,
  },
  sceneBanner: {
    position: 'absolute',
    top: 48,
    left: spacing.md,
    right: spacing.md,
    zIndex: 5,
    backgroundColor: 'rgba(5, 12, 20, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  sceneLabel: {
    ...typography.label,
    color: colors.cyan,
    fontSize: 8,
    marginTop: 2,
  },
  sceneText: {
    ...typography.body,
    color: colors.text,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  hudTop: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudBottom: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudLabel: {
    ...typography.label,
    color: colors.cyan,
    backgroundColor: colors.overlay,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  hudMeta: {
    ...typography.label,
    fontSize: 8,
    color: colors.text,
    backgroundColor: colors.overlay,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    overflow: 'hidden',
  },
});
