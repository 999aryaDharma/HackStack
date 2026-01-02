// src/components/game/EnhancedConfetti.tsx
import React, { useEffect, useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { COLORS } from "../../core/theme/constants";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ConfettiPiece {
  id: string;
  startX: number;
  startY: number;
  color: string;
  size: number;
  rotation: number;
}

interface EnhancedConfettiProps {
  active: boolean;
  onComplete?: () => void;
  count?: number;
  type?: "celebration" | "achievement" | "level-up";
}

const COLORS_ARRAY = [
  COLORS.accent.green,
  COLORS.accent.red,
  COLORS.accent.blue,
  COLORS.accent.cyan,
  COLORS.accent.yellow,
  COLORS.accent.purple,
];

function SingleConfetti({
  piece,
  onComplete,
}: {
  piece: ConfettiPiece;
  onComplete: () => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(piece.rotation);

  useEffect(() => {
    const randomXOffset = (Math.random() - 0.5) * 300;
    const randomYOffset = Math.random() * 600 + 200;

    translateX.value = withTiming(randomXOffset, {
      duration: 2500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    translateY.value = withTiming(randomYOffset, {
      duration: 2500,
      easing: Easing.in(Easing.quad),
    });

    rotation.value = withTiming(
      piece.rotation + 360 * (Math.random() > 0.5 ? 3 : -3),
      { duration: 2500 }
    );

    opacity.value = withDelay(
      1800,
      withTiming(0, {
        duration: 700,
        easing: Easing.out(Easing.ease),
      })
    );

    const timeout = setTimeout(() => {
      runOnJS(onComplete)();
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
          width: piece.size,
          height: piece.size,
          backgroundColor: piece.color,
        },
        animatedStyle,
      ]}
    />
  );
}
  export function EnhancedConfetti({
  active,
  onComplete,
  count = 80,
  type = "celebration",
  }: EnhancedConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  useEffect(() => {
  if (active) {
  const newPieces: ConfettiPiece[] = Array.from(
  { length: count },
  (_, i) => {
  let startY = -20;
  let startX = Math.random() * SCREEN_WIDTH;
        // Different spawn patterns based on type
        if (type === "level-up") {
          startX = SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 200;
        } else if (type === "achievement") {
          startY = Math.random() * 100;
        }

        return {
          id: `confetti-${i}-${Date.now()}`,
          startX,
          startY,
          color: COLORS_ARRAY[Math.floor(Math.random() * COLORS_ARRAY.length)],
          size: Math.random() * 8 + 6,
          rotation: Math.random() * 360,
        };
      }
    );
    setPieces(newPieces);
    setCompletedCount(0);
  }
  }, [active, count, type]);
  useEffect(() => {
  if (completedCount === pieces.length && pieces.length > 0) {
  onComplete?.();
  }
  }, [completedCount, pieces.length]);
  if (!active) return null;
  return (
  <View style={styles.container} pointerEvents="none">
  {pieces.map((piece) => (
  <SingleConfetti
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
  zIndex: 9999,
  },
  piece: {
  position: "absolute",
  borderRadius: 4,
  },
  });


