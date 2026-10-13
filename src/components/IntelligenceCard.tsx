import { ReactNode, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../constants/theme';

interface IntelligenceCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
  refreshKey?: string | number | null;
  footer?: ReactNode;
}

export function IntelligenceCard({
  title,
  icon: Icon,
  children,
  emptyMessage = 'No data for this panel yet.',
  isEmpty = false,
  refreshKey,
  footer,
}: IntelligenceCardProps) {
  const highlight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshKey == null) return;
    Animated.sequence([
      Animated.timing(highlight, {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.timing(highlight, {
        toValue: 0,
        duration: 700,
        useNativeDriver: false,
      }),
    ]).start();
  }, [refreshKey, highlight]);

  const borderColor = highlight.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.panelBorder, colors.panelBorderActive],
  });

  return (
    <Animated.View style={[styles.card, { borderColor }]}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon size={14} color={colors.cyan} strokeWidth={2} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      {isEmpty ? (
        <Text style={styles.empty}>{emptyMessage}</Text>
      ) : (
        <View style={styles.body}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
  },
  title: {
    ...typography.label,
    color: colors.cyan,
  },
  body: {
    gap: spacing.xs,
  },
  empty: {
    ...typography.body,
    color: colors.textDim,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.panelBorder,
    paddingTop: spacing.sm,
  },
});
