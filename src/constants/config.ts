import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Backend base URL.
 * - Web (same machine): prefer localhost
 * - iOS Simulator: localhost
 * - Android Emulator: 10.0.2.2
 * - Physical device: EXPO_PUBLIC_API_URL = http://YOUR_LAN_IP:4000
 */
function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim()?.replace(/\/$/, '');

  // Browser on the same computer should hit localhost, not the LAN IP.
  // LAN IPs often cause flaky "Failed to fetch" during long vision requests.
  if (Platform.OS === 'web') {
    if (fromEnv && /localhost|127\.0\.0\.1/.test(fromEnv)) {
      return fromEnv;
    }
    return 'http://localhost:4000';
  }

  if (fromEnv) {
    return fromEnv;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.linkingUri ||
    '';

  const lanHost = hostUri.split(':')[0];

  if (Platform.OS === 'android') {
    if (lanHost && lanHost !== '127.0.0.1' && lanHost !== 'localhost') {
      return `http://${lanHost}:4000`;
    }
    return 'http://10.0.2.2:4000';
  }

  if (lanHost && lanHost !== '127.0.0.1' && lanHost !== 'localhost') {
    return `http://${lanHost}:4000`;
  }

  return 'http://localhost:4000';
}

export const API_BASE_URL = resolveApiBaseUrl();

/** Client-side abort for slow vision calls (ms) */
export const VISION_FETCH_TIMEOUT_MS = 90_000;
