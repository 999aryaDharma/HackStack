// src/app/index.tsx
/**
 * Root redirect - This component is INSIDE NavigationContainer
 * Safe to use useRouter() here
 */
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../core/theme/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/config";
import { logger } from "../utils/validation";
import { trackNavigation } from "../utils/debugNavigation";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    trackNavigation("Index", "mounted");

    async function checkRoute() {
      try {
        logger.info("Index: Checking initial route");
        trackNavigation("Index", "checking route");

        // Check onboarding status
        const onboardingComplete = await AsyncStorage.getItem(
          STORAGE_KEYS.onboardingComplete
        );

        if (onboardingComplete) {
          logger.info("Index: Redirecting to main app");
          trackNavigation("Index", "redirect to tabs");
          router.replace("/(tabs)");
        } else {
          logger.info("Index: Redirecting to onboarding");
          trackNavigation("Index", "redirect to onboarding");
          router.replace("/onboarding");
        }
      } catch (error) {
        logger.error("Index: Navigation error", error);
        trackNavigation("Index", "error - fallback to onboarding");
        // Fallback to onboarding if error
        router.replace("/onboarding");
      }
    }

    checkRoute();

    return () => trackNavigation("Index", "unmounted");
  }, []);

  // Show loading while checking
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.accent.green} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background.primary,
  },
});
