// src/components/game/FireModeOverlay.tsx
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";


interface FireModeOverlayProps {
  active: boolean;
}

export function FireModeOverlay({ active }: FireModeOverlayProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      // Pulsing effect
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite
        false
      );

      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
    } else {
      opacity.value = withTiming(0, { duration: 500 });
      scale.value = withTiming(1, { duration: 500 });
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!active) return null;

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[
          "rgba(210, 153, 34, 0.3)",
          "rgba(247, 129, 102, 0.2)",
          "rgba(210, 153, 34, 0.3)",
        ]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  gradient: {
    flex: 1,
  },
});
