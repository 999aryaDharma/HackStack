// src/app/(tabs)/index.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "../../components/ui/Button";
import { COLORS, SPACING } from "../../core/theme/constants";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  const handleStartGame = () => {
    router.push("/loadout");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to HackStack!</Text>
      <Text style={styles.subtitle}>Level up your coding skills</Text>

      <Button
        title="Start Learning"
        onPress={handleStartGame}
        size="large"
        variant="primary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
    backgroundColor: COLORS.background.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xl,
    textAlign: "center",
  },
});
