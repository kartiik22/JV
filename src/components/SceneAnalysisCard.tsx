import { Eye } from 'lucide-react-native';
import { Text, StyleSheet } from 'react-native';
import { IntelligenceCard } from './IntelligenceCard';
import { colors, typography } from '../constants/theme';
import type { VisionAnalysis } from '../types/vision';

interface Props {
  analysis: VisionAnalysis | null;
  refreshKey?: string | number | null;
}

export function SceneAnalysisCard({ analysis, refreshKey }: Props) {
  const empty = !analysis?.sceneSummary;

  return (
    <IntelligenceCard
      title="Scene Analysis"
      icon={Eye}
      isEmpty={empty}
      emptyMessage="Start scanning to receive a scene overview."
      refreshKey={refreshKey}
    >
      <Text style={styles.summary}>{analysis?.sceneSummary}</Text>
      {analysis?.mainActivity ? (
        <Text style={styles.meta}>
          Context: <Text style={styles.metaValue}>{analysis.mainActivity}</Text>
        </Text>
      ) : null}
    </IntelligenceCard>
  );
}

const styles = StyleSheet.create({
  summary: {
    ...typography.body,
    color: colors.text,
  },
  meta: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 6,
  },
  metaValue: {
    color: colors.electric,
  },
});
