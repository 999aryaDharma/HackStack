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

// src/components/layout/ScrollContainer.tsx
import React from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { COLORS } from "../../core/theme/constants";

interface ScrollContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
  horizontal?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
}

export function ScrollContainer({
  children,
  style,
  onRefresh,
  refreshing = false,
  horizontal = false,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
}: ScrollContainerProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(refreshing);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, style]}
      horizontal={horizontal}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent.green}
            colors={[COLORS.accent.green]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

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
