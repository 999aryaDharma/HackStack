// src/components/ui/Badge.tsx
import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../core/theme/constants";

interface BadgeProps {
  text: string;
  variant?: "success" | "warning" | "error" | "info" | "default";
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
}

export function Badge({
  text,
  variant = "default",
  size = "medium",
  style,
}: BadgeProps) {
  return (
    <View
      style={[
        styles.container,
        styles[`container_${variant}`],
        styles[`container_${size}`],
        style,
      ]}
    >
      <Text style={[styles.text, styles[`text_${size}`]]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.sm,
    alignSelf: "flex-start",
  },
  container_default: {
    backgroundColor: COLORS.background.tertiary,
  },
  container_success: {
    backgroundColor: COLORS.accent.green,
  },
  container_warning: {
    backgroundColor: COLORS.accent.yellow,
  },
  container_error: {
    backgroundColor: COLORS.accent.red,
  },
  container_info: {
    backgroundColor: COLORS.accent.blue,
  },
  container_small: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  container_medium: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  container_large: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  text: {
    fontWeight: "700",
    color: COLORS.text.inverse,
  },
  text_small: {
    fontSize: 10,
  },
  text_medium: {
    fontSize: 12,
  },
  text_large: {
    fontSize: 14,
  },
});