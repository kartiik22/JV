import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Pause, Play, Square, ScanLine } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../constants/theme';
import type { ScanningStatus } from '../types/vision';

interface Props {
  status: ScanningStatus;
  disabled?: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function ScanningControls({
  status,
  disabled = false,
  onStart,
  onPause,
  onResume,
  onStop,
}: Props) {
  const isIdle = status === 'idle' || status === 'stopped';
  const isScanning = status === 'scanning';
  const isPaused = status === 'paused';

  return (
    <View style={styles.row}>
      {isIdle ? (
        <Pressable
          style={[styles.primary, disabled && styles.disabled]}
          onPress={onStart}
          disabled={disabled}
        >
          <ScanLine size={16} color={colors.background} />
          <Text style={styles.primaryText}>START SCANNING</Text>
        </Pressable>
      ) : null}

      {isScanning ? (
        <Pressable style={styles.secondary} onPress={onPause}>
          <Pause size={14} color={colors.warning} />
          <Text style={[styles.secondaryText, { color: colors.warning }]}>
            PAUSE
          </Text>
        </Pressable>
      ) : null}

      {isPaused ? (
        <Pressable style={styles.secondary} onPress={onResume}>
          <Play size={14} color={colors.success} />
          <Text style={[styles.secondaryText, { color: colors.success }]}>
            RESUME
          </Text>
        </Pressable>
      ) : null}

      {!isIdle ? (
        <Pressable style={styles.danger} onPress={onStop}>
          <Square size={12} color={colors.danger} fill={colors.danger} />
          <Text style={[styles.secondaryText, { color: colors.danger }]}>
            STOP
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cyan,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radii.sm,
  },
  primaryText: {
    ...typography.label,
    color: colors.background,
  },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  danger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
  },
  secondaryText: {
    ...typography.label,
    fontSize: 10,
  },
  disabled: {
    opacity: 0.4,
  },
});
