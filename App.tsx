// App.tsx
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LinkPreviewContextProvider } from "expo-router/build/link/preview/LinkPreviewContext";
import { NavigationContainer } from "@react-navigation/native";
import RootLayout from "./src/app/_layout";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LinkPreviewContextProvider>
          <NavigationContainer>
            <RootLayout />
          </NavigationContainer>
        </LinkPreviewContextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
