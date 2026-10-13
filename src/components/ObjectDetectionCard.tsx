import { Boxes } from 'lucide-react-native';
import { Text, View, StyleSheet } from 'react-native';
import { IntelligenceCard } from './IntelligenceCard';
import { colors, spacing, typography } from '../constants/theme';
import type { VisionAnalysis } from '../types/vision';

interface Props {
  analysis: VisionAnalysis | null;
  refreshKey?: string | number | null;
}

export function ObjectDetectionCard({ analysis, refreshKey }: Props) {
  const objects = analysis?.objects ?? [];
  const empty = objects.length === 0;

  return (
    <IntelligenceCard
      title="Object Detection"
      icon={Boxes}
      isEmpty={empty}
      emptyMessage="No objects detected in the current frame."
      refreshKey={refreshKey}
    >
      {objects.map((obj, index) => (
        <View key={`${obj.name}-${index}`} style={styles.row}>
          <View style={styles.dot} />
          <View style={styles.content}>
            <Text style={styles.name}>{obj.name}</Text>
            <Text style={styles.desc}>{obj.description}</Text>
          </View>
        </View>
      ))}
    </IntelligenceCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.teal,
    marginTop: 6,
  },
  content: {
    flex: 1,
  },
  name: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  desc: {
    ...typography.body,
    color: colors.textMuted,
  },
});
