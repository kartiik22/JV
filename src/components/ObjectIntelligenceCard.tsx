import { Brain } from 'lucide-react-native';
import { Text, View, StyleSheet } from 'react-native';
import { IntelligenceCard } from './IntelligenceCard';
import { colors, spacing, typography } from '../constants/theme';
import type { VisionAnalysis } from '../types/vision';

interface Props {
  analysis: VisionAnalysis | null;
  refreshKey?: string | number | null;
}

export function ObjectIntelligenceCard({ analysis, refreshKey }: Props) {
  const items =
    analysis?.objectIntelligence?.length
      ? analysis.objectIntelligence
      : (analysis?.objects ?? []).slice(0, 4).map((o) => ({
          name: o.name,
          facts: o.description,
          inferences: o.inferredPurpose || '',
        }));

  const empty = items.length === 0;

  return (
    <IntelligenceCard
      title="Object Intelligence"
      icon={Brain}
      isEmpty={empty}
      emptyMessage="Object details will appear after analysis."
      refreshKey={refreshKey}
    >
      {items.map((item, index) => (
        <View key={`${item.name}-${index}`} style={styles.block}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.facts}>{item.facts}</Text>
          {item.inferences ? (
            <Text style={styles.inference}>
              Inference: {item.inferences}
            </Text>
          ) : null}
        </View>
      ))}
    </IntelligenceCard>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.panelBorder,
  },
  name: {
    ...typography.body,
    color: colors.cyan,
    fontWeight: '600',
  },
  facts: {
    ...typography.body,
    color: colors.text,
    marginTop: 2,
  },
  inference: {
    ...typography.body,
    color: colors.warning,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
