import { Orbit } from 'lucide-react-native';
import { Text, StyleSheet } from 'react-native';
import { IntelligenceCard } from './IntelligenceCard';
import { colors, typography } from '../constants/theme';
import type { VisionAnalysis } from '../types/vision';

interface Props {
  analysis: VisionAnalysis | null;
  refreshKey?: string | number | null;
}

export function SpatialObservationsCard({ analysis, refreshKey }: Props) {
  const items = analysis?.spatialObservations ?? [];
  const empty = items.length === 0;

  return (
    <IntelligenceCard
      title="Spatial Observations"
      icon={Orbit}
      isEmpty={empty}
      emptyMessage="Spatial relationships will appear when objects are arranged in view."
      refreshKey={refreshKey}
    >
      {items.map((item, index) => (
        <Text key={`${item}-${index}`} style={styles.item}>
          • {item}
        </Text>
      ))}
      <Text style={styles.note}>
        Relative layout only — no depth or distance claims.
      </Text>
    </IntelligenceCard>
  );
}

const styles = StyleSheet.create({
  item: {
    ...typography.body,
    color: colors.text,
    marginBottom: 4,
  },
  note: {
    ...typography.body,
    color: colors.textDim,
    marginTop: 8,
    fontSize: 11,
  },
});
