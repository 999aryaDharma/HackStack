// src/components/ui/Button.tsx
import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { COLORS, SPACING, RADIUS } from "../../core/theme/constants";
import { useHaptics } from "../../core/hooks/useHaptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  icon,
  style,
}: ButtonProps) {
  const { trigger } = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.95);
      trigger("light");
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1);
    }
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      trigger("medium");
      onPress();
    }
  };

  const containerStyle = [
    styles.container,
    styles[`container_${variant}`],
    styles[`container_${size}`],
    disabled && styles.container_disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    disabled && styles.text_disabled,
  ];

  return (
    <AnimatedPressable
      style={[containerStyle, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary" || variant === "danger"
              ? COLORS.text.inverse
              : COLORS.text.primary
          }
        />
      ) : (
        <>
          {icon}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
  },
  container_primary: {
    backgroundColor: COLORS.accent.green,
  },
  container_secondary: {
    backgroundColor: COLORS.background.secondary,
    borderWidth: 1,
    borderColor: COLORS.accent.blue,
  },
  container_danger: {
    backgroundColor: COLORS.accent.red,
  },
  container_ghost: {
    backgroundColor: "transparent",
  },
  container_disabled: {
    opacity: 0.5,
  },
  container_small: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  container_medium: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  container_large: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  text: {
    fontWeight: "700",
    textAlign: "center",
  },
  text_primary: {
    color: COLORS.text.inverse,
  },
  text_secondary: {
    color: COLORS.accent.blue,
  },
  text_danger: {
    color: COLORS.text.inverse,
  },
  text_ghost: {
    color: COLORS.text.primary,
  },
  text_disabled: {
    opacity: 0.5,
  },
  text_small: {
    fontSize: 12,
  },
  text_medium: {
    fontSize: 14,
  },
  text_large: {
    fontSize: 16,
  },
});








