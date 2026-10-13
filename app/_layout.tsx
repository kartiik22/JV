import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox, StyleSheet } from 'react-native';
import { colors } from '../src/constants/theme';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { installGlobalErrorHandlers, log } from '../src/utils/logger';
import { API_BASE_URL } from '../src/constants/config';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export default function RootLayout() {
  useEffect(() => {
    installGlobalErrorHandlers();
    log.info('App', 'Root layout mounted', { apiBaseUrl: API_BASE_URL });
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'fade',
            }}
          />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
