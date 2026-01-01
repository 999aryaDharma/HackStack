/**
 * Confetti Animation Component
 *
 * Celebratory particle effect
 * Used on:
 * - Perfect sessions
 * - Milestone achievements
 * - Level ups
 */

import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "../../core/theme/constants";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ConfettiPiece {
  id: string;
  startX: number;
  startY: number;
  color: string;
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
  count?: number;
}

const COLORS_ARRAY = [
  COLORS.accent.green,
  COLORS.accent.red,
  COLORS.accent.blue,
  COLORS.accent.cyan,
  COLORS.accent.yellow,
  COLORS.accent.purple,
];

function ConfettiPiece({
  piece,
  onComplete,
}: {
  piece: ConfettiPiece;
  onComplete: () => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const randomXOffset = (Math.random() - 0.5) * 200;
    const randomYOffset = Math.random() * 400;

    translateX.value = withTiming(randomXOffset, {
      duration: 2000,
      easing: Easing.in(Easing.ease),
    });

    translateY.value = withTiming(randomYOffset, {
      duration: 2000,
      easing: Easing.in(Easing.quad),
    });

    rotation.value = withTiming(360 * (Math.random() > 0.5 ? 1 : -1), {
      duration: 2000,
    });

    opacity.value = withDelay(
      1500,
      withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      })
    );

    const timeout = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: piece.startX,
          top: piece.startY,
          backgroundColor: piece.color,
        },
        animatedStyle,
      ]}
    />
  );
}

export function Confetti({ active, onComplete, count = 50 }: ConfettiProps) {
  const [pieces, setPieces] = React.useState<ConfettiPiece[]>([]);
  const [completedCount, setCompletedCount] = React.useState(0);

  useEffect(() => {
    if (active) {
      const newPieces: ConfettiPiece[] = Array.from(
        { length: count },
        (_, i) => ({
          id: `confetti-${i}`,
          startX: Math.random() * SCREEN_WIDTH,
          startY: -20,
          color: COLORS_ARRAY[Math.floor(Math.random() * COLORS_ARRAY.length)],
        })
      );
      setPieces(newPieces);
      setCompletedCount(0);
    }
  }, [active, count]);

  useEffect(() => {
    if (completedCount === pieces.length && pieces.length > 0) {
      onComplete?.();
    }
  }, [completedCount, pieces.length, onComplete]);

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          piece={piece}
          onComplete={() => setCompletedCount((prev) => prev + 1)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    overflow: "hidden",
  },
  piece: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
