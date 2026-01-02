// src/app/(tabs)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "../../core/theme/constants";

export default function TabLayout() {
  return (
    <>
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
            tabBarLabel: "Home",
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: true,
            tabBarLabel: "Profile",
          }}
        />
      </Tabs>
    </>
  );
}
