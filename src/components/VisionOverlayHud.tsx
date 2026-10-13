import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { colors, radii, spacing, typography } from '../constants/theme';
import { mapImagePointToView, mapImageRectToView } from '../utils/coords';
import type { DetectedObject, OverlayCallout } from '../types/vision';

interface Props {
  overlays: OverlayCallout[];
  objects?: DetectedObject[];
  isStale?: boolean;
  width: number;
  height: number;
  /** Dimensions of the analyzed frame (for cover-fit mapping). */
  imageWidth?: number | null;
  imageHeight?: number | null;
}

const CARD_W = 148;

export function VisionOverlayHud({
  overlays,
  objects = [],
  isStale = false,
  width,
  height,
  imageWidth,
  imageHeight,
}: Props) {
  const fade = useRef(new Animated.Value(1)).current;
  const imgW = imageWidth && imageWidth > 0 ? imageWidth : width;
  const imgH = imageHeight && imageHeight > 0 ? imageHeight : height;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: isStale ? 0.55 : 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [overlays, isStale, fade]);

  const boxes = useMemo(
    () =>
      objects
        .filter((o) => o.anchor)
        .slice(0, 5)
        .map((o) => {
          const a = o.anchor!;
          const r = mapImageRectToView(
            a.x,
            a.y,
            a.w,
            a.h,
            imgW,
            imgH,
            width,
            height
          );
          return { name: o.name, ...r };
        }),
    [objects, width, height, imgW, imgH]
  );

  const placed = useMemo(
    () =>
      overlays.map((o) => {
        const pin = mapImagePointToView(
          o.targetX,
          o.targetY,
          imgW,
          imgH,
          width,
          height
        );
        const rawCard = mapImagePointToView(o.x, o.y, imgW, imgH, width, height);
        const cardX = Math.min(Math.max(rawCard.x, 8), Math.max(width - CARD_W - 8, 8));
        const cardY = Math.min(Math.max(rawCard.y, 8), Math.max(height - 80, 8));
        return { o, pin, cardX, cardY };
      }),
    [overlays, width, height, imgW, imgH]
  );

  if (width <= 0 || height <= 0) return null;

  return (
    <Animated.View style={[styles.root, { opacity: fade }]} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {placed.map(({ o, pin, cardX, cardY }, i) => (
          <Line
            key={`line-${i}-${o.title}`}
            x1={cardX + CARD_W / 2}
            y1={cardY + 28}
            x2={pin.x}
            y2={pin.y}
            stroke={colors.cyan}
            strokeWidth={1.2}
            strokeOpacity={0.7}
            strokeDasharray="4 3"
          />
        ))}
      </Svg>

      {boxes.map((b, i) => (
        <View
          key={`box-${i}-${b.name}`}
          style={[
            styles.bbox,
            {
              left: b.left,
              top: b.top,
              width: b.width,
              height: b.height,
            },
          ]}
        />
      ))}

      {placed.map(({ o, cardX, cardY }, i) => (
        <View
          key={`card-${i}-${o.title}`}
          style={[styles.card, { left: cardX, top: cardY, width: CARD_W }]}
        >
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle} numberOfLines={1}>
            {o.title}
          </Text>
          <Text style={styles.cardDetail} numberOfLines={3}>
            {o.detail}
          </Text>
        </View>
      ))}

      {placed.map(({ o, pin }, i) => (
        <View
          key={`dot-${i}-${o.title}`}
          style={[
            styles.pin,
            {
              left: pin.x - 6,
              top: pin.y - 6,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 4,
  },
  bbox: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.55)',
    borderRadius: 4,
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
  },
  card: {
    position: 'absolute',
    backgroundColor: 'rgba(5, 12, 20, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.45)',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.cyan,
  },
  cardTitle: {
    ...typography.label,
    color: colors.cyan,
    fontSize: 9,
    marginBottom: 2,
  },
  cardDetail: {
    ...typography.body,
    color: colors.text,
    fontSize: 11,
    lineHeight: 14,
  },
  pin: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.cyan,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: colors.cyan,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
});
