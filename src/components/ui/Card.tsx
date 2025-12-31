// src/components/ui/Card.tsx
import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { COLORS, SPACING, RADIUS } from "../../core/theme/constants";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "outlined";
}

export function Card({ children, style, variant = "default" }: CardProps) {
  return (
    <View style={[styles.container, styles[`container_${variant}`], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  container_default: {
    borderWidth: 1,
    borderColor: COLORS.background.tertiary,
  },
  container_elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  container_outlined: {
    borderWidth: 2,
    borderColor: COLORS.accent.green,
  },
});