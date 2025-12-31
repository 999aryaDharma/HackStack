// src/components/ui/ProgressBar.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { COLORS, SPACING, RADIUS } from "../../core/theme/constants";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showValue?: boolean;
  color?: string;
  height?: number;
}

export function ProgressBar({
  current,
  total,
  label,
  showValue = true,
  color = COLORS.accent.green,
  height = 8,
}: ProgressBarProps) {
  const percentage = Math.min((current / total) * 100, 100);
  const width = useSharedValue(percentage);

  React.useEffect(() => {
    width.value = withTiming(percentage, { duration: 300 });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={styles.container}>
      {(label || showValue) && (
        <View style={styles.header}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showValue && (
            <Text style={styles.value}>
              {current} / {total}
            </Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[styles.fill, { backgroundColor: color }, animatedStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  value: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  track: {
    width: "100%",
    backgroundColor: COLORS.background.tertiary,
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: RADIUS.full,
  },
});
