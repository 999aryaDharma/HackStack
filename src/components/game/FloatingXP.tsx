// src/components/game/FloatingXP.tsx
import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "../../core/theme/constants";

interface FloatingXPProps {
  amount: number;
  position: { x: number; y: number };
  onComplete: () => void;
}

export function FloatingXP({ amount, position, onComplete }: FloatingXPProps) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSpring(1.2, { damping: 10 });

    setTimeout(() => {
      opacity.value = withTiming(0, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
      });

      translateY.value = withTiming(-80, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
      });
    }, 200);

    setTimeout(onComplete, 1200);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { left: position.x, top: position.y },
        animatedStyle,
      ]}
    >
      <Text style={styles.text}>+{amount} XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
  text: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.accent.green,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});



