import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../constants/theme';
import { log } from '../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    log.error('ErrorBoundary', 'Render crash caught', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  private reset = () => {
    log.info('ErrorBoundary', 'User reset after crash');
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>SIGHT AI CRASH</Text>
        <Text style={styles.body}>{error.message}</Text>
        {error.stack ? (
          <Text style={styles.stack} numberOfLines={18}>
            {error.stack}
          </Text>
        ) : null}
        <Pressable style={styles.button} onPress={this.reset}>
          <Text style={styles.buttonText}>TRY AGAIN</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  title: {
    ...typography.label,
    color: colors.danger,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.md,
  },
  stack: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.cyan,
    borderRadius: radii.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.label,
    color: colors.background,
  },
});
