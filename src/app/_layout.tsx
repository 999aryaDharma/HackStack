// src/app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { runMigrations, seedDatabase } from "../core/db/client";
import { COLORS } from "../core/theme/constants";
import OnboardingScreen from "./onboarding";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/config";
import { setupNotificationListeners } from "../core/notifications/notificationService";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Run database migrations
        await runMigrations();

        // Seed initial data
        await seedDatabase();

        // Setup notification listeners without router (will be setup in tabs)
        setupNotificationListeners();

        // Check if onboarding completed
        const onboardingComplete = await AsyncStorage.getItem(
          STORAGE_KEYS.onboardingComplete
        );

        setShowOnboarding(!onboardingComplete);
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.onboardingComplete, "true");
    setShowOnboarding(false);
  };

  if (!isReady) {
    return null; // Or splash screen
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

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
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="loadout" options={{ title: "Loadout" }} />
        <Stack.Screen name="game/swipe" options={{ headerShown: false }} />
        <Stack.Screen name="game/review" options={{ headerShown: false }} />
        <Stack.Screen name="summary" options={{ title: "Summary" }} />
        <Stack.Screen name="dungeon" options={{ title: "Review Dungeon" }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
