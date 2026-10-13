import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../constants/theme';

interface Props {
  countdownSec: number;
  isActive: boolean;
  isBusy: boolean;
}

export function CountdownIndicator({ countdownSec, isActive, isBusy }: Props) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!isActive) {
      Animated.timing(pulse, {
        toValue: 0.35,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, pulse]);

  let label = 'STANDBY';
  if (isBusy) label = 'PROCESSING';
  else if (isActive) label = `NEXT ${countdownSec}s`;

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.ring, { opacity: pulse }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
  },
  ring: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: colors.cyan,
  },
  label: {
    ...typography.label,
    color: colors.cyan,
    fontSize: 9,
    letterSpacing: 1.2,
  },
});
