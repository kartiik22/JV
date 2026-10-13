import { Type } from 'lucide-react-native';
import { Text, StyleSheet } from 'react-native';
import { IntelligenceCard } from './IntelligenceCard';
import { colors, typography } from '../constants/theme';
import type { VisionAnalysis } from '../types/vision';

interface Props {
  analysis: VisionAnalysis | null;
  refreshKey?: string | number | null;
}

export function TextRecognitionCard({ analysis, refreshKey }: Props) {
  const textItems = analysis?.textRecognition?.text ?? [];
  const status = analysis?.textRecognition?.status;
  const empty = !analysis;

  return (
    <IntelligenceCard
      title="Text & OCR"
      icon={Type}
      isEmpty={empty}
      emptyMessage="Readable text will appear here when available."
      refreshKey={refreshKey}
    >
      {status ? <Text style={styles.status}>{status}</Text> : null}
      {textItems.length > 0 ? (
        textItems.map((line, index) => (
          <Text key={`${line}-${index}`} style={styles.line}>
            “{line}”
          </Text>
        ))
      ) : (
        <Text style={styles.emptyLine}>No clearly readable text in frame.</Text>
      )}
    </IntelligenceCard>
  );
}

const styles = StyleSheet.create({
  status: {
    ...typography.body,
    color: colors.electric,
    marginBottom: 6,
  },
  line: {
    ...typography.body,
    color: colors.text,
    marginBottom: 4,
  },
  emptyLine: {
    ...typography.body,
    color: colors.textDim,
    fontStyle: 'italic',
  },
});
