// src/app/(tabs)/_layout.tsx
import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "../../core/theme/constants";
import {
  subscribeToNavigationEvents,
  NotificationNavigationEvent,
} from "../../core/notifications/notificationService";
import { logger } from "../../utils/validation";

export default function TabLayout() {
  const router = useRouter();

  useEffect(() => {
    logger.info("Tab layout mounted, setting up navigation listener");

    // Subscribe to notification navigation events
    const unsubscribe = subscribeToNavigationEvents(
      (event: NotificationNavigationEvent) => {
        logger.info("Handling notification navigation", {
          type: event.type,
          data: event.data,
        });

        // Handle based on notification type
        switch (event.type) {
          case "review":
            logger.info("Navigating to dungeon");
            router.push("/dungeon");
            break;

          case "achievement":
            logger.info("Navigating to profile");
            router.push("/(tabs)/profile");
            break;

          case "streak":
            logger.info("Navigating to profile");
            router.push("/(tabs)/profile");
            break;

          case "level_up":
            logger.info("Level up notification, showing celebration");
            // Could trigger a modal or animation here
            break;

          default:
            logger.warn("Unknown notification type", { type: event.type });
        }
      }
    );

    logger.info("Navigation listener setup complete");

    return () => {
      logger.info("Cleaning up navigation listener");
      unsubscribe();
    };
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.background.primary,
          },
          headerTintColor: COLORS.text.primary,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          tabBarActiveTintColor: COLORS.accent.green,
          tabBarInactiveTintColor: COLORS.text.secondary,
          tabBarStyle: {
            backgroundColor: COLORS.background.secondary,
            borderTopColor: COLORS.background.tertiary,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: true,
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
  