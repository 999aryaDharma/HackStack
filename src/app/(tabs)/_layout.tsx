// src/app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { runMigrations, seedDatabase } from "../core/db/client";
import { logger } from "../utils/validation";
import { COLORS } from "../core/theme/constants";
import OnboardingScreen from "./onboarding";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Prevent auto-hiding splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        logger.info("Initializing app...");

        // Run database migrations
        await runMigrations();
        logger.info("Database migrations completed");

        // Seed initial data
        await seedDatabase();
        logger.info("Database seeding completed");

        // Check if onboarding was completed
        const onboardingComplete = await AsyncStorage.getItem(
          "onboarding_complete"
        );

        if (!onboardingComplete) {
          setShowOnboarding(true);
          logger.info("First time user - showing onboarding");
        }

        // Small delay to ensure everything is loaded
        await new Promise((resolve) => setTimeout(resolve, 500));

        setIsReady(true);
        logger.info("App initialization complete");
      } catch (error) {
        logger.error("App initialization failed", error);
        // Still set ready to prevent infinite loading
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem("onboarding_complete", "true");
      setShowOnboarding(false);
      logger.info("Onboarding completed");
    } catch (error) {
      logger.error("Failed to save onboarding state", error);
      setShowOnboarding(false);
    }
  };

  if (!isReady) {
    return null; // Splash screen is still visible
  }

  if (showOnboarding) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </GestureHandlerRootView>
    );
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
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: COLORS.background.primary,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: "Profile",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: "Settings",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="dungeon"
          options={{
            title: "Review Dungeon",
            presentation: "card",
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
