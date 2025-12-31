// src/components/layout/SafeAreaView.tsx
import React from "react";
import {
  SafeAreaView as RNSafeAreaView,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { COLORS } from "../../core/theme/constants";

interface SafeAreaViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function SafeAreaView({ children, style }: SafeAreaViewProps) {
  return (
    <RNSafeAreaView style={[styles.container, style]}>
      {children}
    </RNSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
});

