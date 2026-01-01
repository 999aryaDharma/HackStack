// src/app/(tabs)/_layout.tsx
import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "../../core/theme/constants";
import { setupNotificationListeners } from "../../core/notifications/notificationService";

export default function TabLayout() {
  const router = useRouter();

  useEffect(() => {
    // Setup notification listeners with router access for navigation
    const unsubscribe = setupNotificationListeners(router);
    return unsubscribe;
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
