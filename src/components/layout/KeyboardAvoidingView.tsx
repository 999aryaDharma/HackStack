// src/components/layout/KeyboardAvoidingView.tsx
import React from "react";
import {
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
} from "react-native";

interface KeyboardAvoidingViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function KeyboardAvoidingView({
  children,
  style,
}: KeyboardAvoidingViewProps) {
  return (
    <RNKeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, style]}
    >
      {children}
    </RNKeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
