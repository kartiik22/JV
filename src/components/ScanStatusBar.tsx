import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import type { ScanningStatus, SystemStatus } from '../types/vision';

interface Props {
  systemStatus: SystemStatus;
  scanningStatus: ScanningStatus;
  cameraReady: boolean;
  model?: string | null;
}

function statusColor(status: SystemStatus): string {
  switch (status) {
    case 'ONLINE':
      return colors.success;
    case 'ANALYZING':
      return colors.cyan;
    case 'PAUSED':
      return colors.warning;
    default:
      return colors.danger;
  }
}

export function ScanStatusBar({
  systemStatus,
  scanningStatus,
  cameraReady,
  model,
}: Props) {
  const scanPulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (scanningStatus !== 'scanning') {
      Animated.timing(scanPulse, {
        toValue: 0.25,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(scanPulse, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanningStatus, scanPulse]);

  return (
    <View style={styles.bar}>
      <View>
        <Text style={styles.wordmark}>SIGHT AI</Text>
        <Text style={styles.sub}>VISUAL INTELLIGENCE</Text>
      </View>

      <View style={styles.right}>
        <View style={styles.statusRow}>
          <View
            style={[styles.dot, { backgroundColor: statusColor(systemStatus) }]}
          />
          <Text style={[styles.statusText, { color: statusColor(systemStatus) }]}>
            {systemStatus}
          </Text>
        </View>
        <Text style={styles.meta}>
          CAM {cameraReady ? 'LINKED' : 'WAIT'} ·{' '}
          {model ? model.toUpperCase() : 'MODEL —'}
        </Text>
      </View>

      <Animated.View style={[styles.scanOrb, { opacity: scanPulse }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.18)',
    backgroundColor: 'rgba(5, 12, 20, 0.72)',
  },
  wordmark: {
    color: colors.cyan,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 4,
  },
  sub: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 8,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    marginRight: 28,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    ...typography.label,
    fontSize: 11,
  },
  meta: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 8,
    marginTop: 3,
  },
  scanOrb: {
    position: 'absolute',
    right: spacing.lg,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cyan,
  },
});
