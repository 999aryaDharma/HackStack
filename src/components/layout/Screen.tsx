// src/components/layout/Screen.tsx
import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "./SafeAreaView";
import { KeyboardAvoidingView } from "./KeyboardAvoidingView";
import { SPACING } from "../../core/theme/constants";

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safe?: boolean;
  keyboard?: boolean;
  padded?: boolean;
}

export function Screen({
  children,
  style,
  safe = true,
  keyboard = false,
  padded = false,
}: ScreenProps) {
  const content = (
    <View style={[styles.container, padded && styles.padded, style]}>
      {children}
    </View>
  );

  if (keyboard) {
    return (
      <KeyboardAvoidingView>
        {safe ? <SafeAreaView>{content}</SafeAreaView> : content}
      </KeyboardAvoidingView>
    );
  }

  return safe ? <SafeAreaView>{content}</SafeAreaView> : content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: SPACING.lg,
  },
});
