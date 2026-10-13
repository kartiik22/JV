import { Sparkles } from 'lucide-react-native';
import { Text, StyleSheet } from 'react-native';
import { IntelligenceCard } from './IntelligenceCard';
import { colors, typography } from '../constants/theme';
import type { VisionAnalysis } from '../types/vision';

interface Props {
  analysis: VisionAnalysis | null;
  refreshKey?: string | number | null;
}

export function InsightsCard({ analysis, refreshKey }: Props) {
  const insights = analysis?.insights ?? [];
  const limitations = analysis?.limitations ?? [];
  const empty = insights.length === 0 && limitations.length === 0;

  return (
    <IntelligenceCard
      title="Insights"
      icon={Sparkles}
      isEmpty={empty}
      emptyMessage="Interesting observations will appear after a successful analysis."
      refreshKey={refreshKey}
    >
      {insights.map((item, index) => (
        <Text key={`i-${index}`} style={styles.item}>
          ▸ {item}
        </Text>
      ))}
      {limitations.length > 0 ? (
        <>
          <Text style={styles.limitTitle}>Limitations</Text>
          {limitations.map((item, index) => (
            <Text key={`l-${index}`} style={styles.limit}>
              ▸ {item}
            </Text>
          ))}
        </>
      ) : null}
    </IntelligenceCard>
  );
}

const styles = StyleSheet.create({
  item: {
    ...typography.body,
    color: colors.text,
    marginBottom: 4,
  },
  limitTitle: {
    ...typography.label,
    color: colors.warning,
    marginTop: 10,
    marginBottom: 4,
  },
  limit: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: 4,
  },
});
