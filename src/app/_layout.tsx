// src/app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { runMigrations, seedDatabase } from "../core/db/client";
import { COLORS, SPACING } from "../core/theme/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/config";
import { logger } from "../utils/validation";

// Safe notification setup
async function setupNotificationsIfAvailable() {
  try {
    // Dynamic import to avoid issues if module is not available
    const notificationModule =
      await import("../core/notifications/notificationService");

    if (notificationModule && notificationModule.setupNotificationListeners) {
      notificationModule.setupNotificationListeners();
      logger.info("Notifications setup successful");
    }
  } catch (error) {
    logger.warn(
      "Notification module not available or setup function missing",
      error
    );
  }
}

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
        logger.info("Database migrations complete");

        // Seed initial data
        logger.info("Step 2/5: Seeding database");
        await seedDatabase();
        logger.info("Database seeded");

        // Setup notification listeners (safe)
        logger.info("Step 3/5: Setting up notification system");
        await setupNotificationsIfAvailable();
        logger.info("Notification system ready");

        // Check if onboarding completed
        logger.info("Step 4/5: Checking onboarding status");
        const onboardingComplete = await AsyncStorage.getItem(
          STORAGE_KEYS.onboardingComplete
        );

        logger.info("Step 5/5: Finalizing setup");

        // Small delay to ensure everything is ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (onboardingComplete) {
          logger.info("Onboarding already completed");
        } else {
          logger.info("Onboarding not completed");
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
        <Text style={styles.errorText}>Error</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <Text style={styles.errorHint}>Please restart the app</Text>
      </View>
    );
  }

  // Main app
  return (
    <>
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
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
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
    </>
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
