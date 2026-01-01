// src/app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { runMigrations, seedDatabase } from "../core/db/client";
import { COLORS, SPACING } from "../core/theme/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/config";
import { setupNotificationListeners } from "../core/notifications/notificationService";
import { logger } from "../utils/validation";

type AppState = "loading" | "ready" | "error";

export default function RootLayout() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        logger.info("=== App initialization started ===");
        setAppState("loading");

        // Run database migrations
        logger.info("Step 1/5: Running database migrations");
        await runMigrations();
        logger.info("✓ Database migrations complete");

        // Seed initial data
        logger.info("Step 2/5: Seeding database");
        await seedDatabase();
        logger.info("✓ Database seeded");

        // Setup notification listeners (no router dependency)
        logger.info("Step 3/5: Setting up notification system");
        setupNotificationListeners();
        logger.info("✓ Notification system ready");

        // Check if onboarding completed
        logger.info("Step 4/5: Checking onboarding status");
        const onboardingComplete = await AsyncStorage.getItem(
          STORAGE_KEYS.onboardingComplete
        );

        logger.info("Step 5/5: Finalizing setup");

        // Small delay to ensure everything is ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (onboardingComplete) {
          logger.info("✓ Onboarding already completed");
        } else {
          logger.info("⚠ Onboarding not completed");
        }

        setAppState("ready");
        logger.info("=== App initialization complete ===");
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        logger.error("Failed to initialize app", err);
        setError(errorMsg);
        setAppState("error");
      }
    }

    prepare();
  }, []);

  const handleOnboardingComplete = async () => {
    // This function is no longer needed since onboarding
    // handles its own completion and navigation
    logger.info("Onboarding completion callback (deprecated)");
  };

  // Loading screen
  if (appState === "loading") {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent.green} />
        <Text style={styles.loadingText}>Initializing HackStack...</Text>
      </View>
    );
  }

  // Error screen
  if (appState === "error") {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>❌ Error</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <Text style={styles.errorHint}>Please restart the app</Text>
      </View>
    );
  }

  // Main app (ready state includes both onboarding and main app)
  // Onboarding will be shown as a route inside the navigation
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.background.primary,
          },
          headerTintColor: COLORS.text.primary,
          headerTitleStyle: {
            fontWeight: "700",
          },
          contentStyle: {
            backgroundColor: COLORS.background.primary,
          },
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="loadout" options={{ title: "Choose Loadout" }} />
        <Stack.Screen name="game/swipe" options={{ headerShown: false }} />
        <Stack.Screen name="game/review" options={{ headerShown: false }} />
        <Stack.Screen
          name="summary"
          options={{ title: "Session Summary", headerBackVisible: false }}
        />
        <Stack.Screen
          name="dungeon"
          options={{ title: "Review Dungeon", headerShown: true }}
        />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background.primary,
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: 16,
    color: COLORS.text.secondary,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.accent.red,
    marginBottom: SPACING.md,
  },
  errorSubtext: {
    fontSize: 16,
    color: COLORS.text.primary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  errorHint: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: "center",
  },
});
