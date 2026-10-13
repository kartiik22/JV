import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import { IntelligenceCard } from './IntelligenceCard';
import { colors, radii, spacing, typography } from '../constants/theme';
import type { AskResponse } from '../types/vision';

interface Props {
  onAsk: (question: string) => Promise<void>;
  isAsking: boolean;
  answer: AskResponse | null;
  error: string | null;
  disabled?: boolean;
}

export function AskJarvisPanel({
  onAsk,
  isAsking,
  answer,
  error,
  disabled = false,
}: Props) {
  const [question, setQuestion] = useState('');

  const submit = async () => {
    if (!question.trim() || isAsking || disabled) return;
    await onAsk(question.trim());
  };

  return (
    <IntelligenceCard
      title="Ask Jarvis"
      icon={MessageSquare}
      emptyMessage=""
      isEmpty={false}
    >
      <Text style={styles.hint}>
        Ask about the latest captured frame. Example: “What is next to the keyboard?”
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Ask about the current scene…"
        placeholderTextColor={colors.textDim}
        value={question}
        onChangeText={setQuestion}
        editable={!isAsking && !disabled}
        multiline
        maxLength={500}
      />
      <Pressable
        style={[
          styles.button,
          (isAsking || disabled || !question.trim()) && styles.buttonDisabled,
        ]}
        onPress={() => {
          void submit();
        }}
        disabled={isAsking || disabled || !question.trim()}
      >
        {isAsking ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <Text style={styles.buttonText}>SEND QUERY</Text>
        )}
      </Pressable>

      {disabled ? (
        <Text style={styles.warn}>Capture a frame first to enable Ask Jarvis.</Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {answer ? (
        <View style={styles.answerBox}>
          <Text style={styles.answerLabel}>RESPONSE</Text>
          <Text style={styles.answer}>{answer.answer}</Text>
          {answer.limitations?.length ? (
            <Text style={styles.limit}>
              Note: {answer.limitations.join(' · ')}
            </Text>
          ) : null}
        </View>
      ) : null}
    </IntelligenceCard>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    borderRadius: radii.sm,
    padding: spacing.sm,
    color: colors.text,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    textAlignVertical: 'top',
    ...typography.body,
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.cyan,
    borderRadius: radii.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    ...typography.label,
    color: colors.background,
  },
  warn: {
    ...typography.body,
    color: colors.warning,
    marginTop: spacing.sm,
  },
  error: {
    ...typography.body,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  answerBox: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.panelBorderActive,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  answerLabel: {
    ...typography.label,
    color: colors.teal,
    marginBottom: 4,
  },
  answer: {
    ...typography.body,
    color: colors.text,
  },
  limit: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 6,
    fontSize: 11,
  },
});
