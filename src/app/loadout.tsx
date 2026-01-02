// src/app/loadout.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../components/layout/Screen";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { COLORS, SPACING, RADIUS } from "../core/theme/constants";
import { SUPPORTED_LANGUAGES, DIFFICULTIES } from "../constants/config";
import { TOPICS_BY_LANGUAGE } from "../core/ai/prompts";
import { useStore } from "../store";
import { logger } from "../utils/validation";

export default function LoadoutScreen() {
  const router = useRouter();
  const setLoadout = useStore((state) => state.setLoadout);

  // State
  const [selectedLanguage, setSelectedLanguage] = useState<
    "JS" | "TS" | "Python" | "Go"
  >("JS");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "easy" | "medium" | "hard" | "god"
  >("medium");
  const [sessionLength, setSessionLength] = useState(10);

  const availableTopics = TOPICS_BY_LANGUAGE[selectedLanguage] || [];

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleStart = () => {
    if (selectedTopics.length === 0) {
      alert("Please select at least one topic");
      return;
    }

    const loadout = {
      language: selectedLanguage,
      topics: selectedTopics,
      difficulty: selectedDifficulty,
      sessionLength,
    };

    logger.info("Starting session with loadout", loadout);
    setLoadout(loadout);
    router.push("/game/swipe");
  };

  return (
    <Screen safe padded>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Challenge</Text>
          <Text style={styles.subtitle}>
            Select language, topics, and difficulty
          </Text>
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.optionsGrid}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <Pressable
                key={lang.id}
                style={[
                  styles.languageCard,
                  selectedLanguage === lang.id && styles.languageCard_selected,
                ]}
                onPress={() => {
                  setSelectedLanguage(lang.id as any);
                  setSelectedTopics([]); // Reset topics when language changes
                }}
              >
                <Text style={styles.languageIcon}>{lang.icon}</Text>
                <Text style={styles.languageName}>{lang.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Topics Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Topics ({selectedTopics.length} selected)
          </Text>
          <View style={styles.topicsContainer}>
            {availableTopics.map((topic) => (
              <Pressable
                key={topic}
                onPress={() => toggleTopic(topic)}
                style={styles.topicBadge}
              >
                <Badge
                  text={topic}
                  variant={
                    selectedTopics.includes(topic) ? "success" : "default"
                  }
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Difficulty Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Difficulty</Text>
          <View style={styles.optionsGrid}>
            {DIFFICULTIES.map((diff) => (
              <Pressable
                key={diff.id}
                style={[
                  styles.difficultyCard,
                  selectedDifficulty === diff.id &&
                    styles.difficultyCard_selected,
                  { borderColor: diff.color },
                ]}
                onPress={() => setSelectedDifficulty(diff.id as any)}
              >
                <Text style={styles.difficultyName}>{diff.name}</Text>
                <Text style={styles.difficultyDescription}>
                  {diff.description}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Session Length */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Length</Text>
          <View style={styles.lengthOptions}>
            {[5, 10, 15, 20].map((length) => (
              <Pressable
                key={length}
                style={[
                  styles.lengthButton,
                  sessionLength === length && styles.lengthButton_selected,
                ]}
                onPress={() => setSessionLength(length)}
              >
                <Text
                  style={[
                    styles.lengthText,
                    sessionLength === length && styles.lengthText_selected,
                  ]}
                >
                  {length}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Start Button */}
        <View style={styles.footer}>
          <Button
            title="START SESSION"
            onPress={handleStart}
            size="large"
            disabled={selectedTopics.length === 0}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  languageCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.background.tertiary,
    alignItems: "center",
  },
  languageCard_selected: {
    borderColor: COLORS.accent.green,
    backgroundColor: "rgba(57, 211, 83, 0.1)",
  },
  languageIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  languageName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  topicBadge: {
    marginBottom: SPACING.xs,
  },
  difficultyCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.background.tertiary,
  },
  difficultyCard_selected: {
    backgroundColor: "rgba(57, 211, 83, 0.1)",
  },
  difficultyName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  difficultyDescription: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  lengthOptions: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  lengthButton: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.background.tertiary,
    alignItems: "center",
  },
  lengthButton_selected: {
    borderColor: COLORS.accent.green,
    backgroundColor: "rgba(57, 211, 83, 0.1)",
  },
  lengthText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text.secondary,
  },
  lengthText_selected: {
    color: COLORS.accent.green,
  },
  footer: {
    marginVertical: SPACING.xl,
  },
});
