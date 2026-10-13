import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Shield } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../constants/theme';

interface Props {
  onRequest: () => void;
  denied?: boolean;
}

export function PermissionGate({ onRequest, denied = false }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Shield size={28} color={colors.cyan} />
        </View>
        <Text style={styles.title}>CAMERA ACCESS</Text>
        <Text style={styles.body}>
          Sight AI uses your camera to observe surroundings while scanning is
          active. Frames are sent to a secure backend for AI vision analysis and
          are not stored by default.
        </Text>
        <Text style={styles.body}>
          You control when scanning starts, pauses, and stops. No capture occurs
          while scanning is disabled.
        </Text>
        {denied ? (
          <Text style={styles.denied}>
            Permission was denied. Enable camera access in system settings to
            continue.
          </Text>
        ) : null}
        <Pressable style={styles.button} onPress={onRequest}>
          <Text style={styles.buttonText}>
            {denied ? 'TRY AGAIN' : 'GRANT CAMERA ACCESS'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    borderRadius: radii.lg,
    padding: spacing.xl,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.panelBorderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.label,
    color: colors.cyan,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  denied: {
    ...typography.body,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
    backgroundColor: colors.cyan,
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.label,
    color: colors.background,
  },
});
