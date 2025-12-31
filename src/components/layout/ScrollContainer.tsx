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
