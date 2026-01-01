// src/app/onboarding.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Animated,
  Dimensions,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS, SPACING, RADIUS } from "../core/theme/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/config";
import { logger } from "../utils/validation";
import { trackNavigation } from "../utils/debugNavigation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: "1",
    title: "Swipe to Learn",
    description:
      "Swipe right if you know the answer, left if you don't. It's that simple.",
    emoji: "👉",
  },
  {
    id: "2",
    title: "Level Up Your Skills",
    description:
      "Earn XP, unlock achievements, and climb the ranks from Script Kiddie to Code Wizard.",
    emoji: "📈",
  },
  {
    id: "3",
    title: "Master Through Repetition",
    description:
      "Cards you get wrong return later. The more you practice, the better you get.",
    emoji: "🔁",
  },
  {
    id: "4",
    title: "Fire Mode",
    description:
      "Get 5 correct in a row to activate Fire Mode for 2x XP. Keep the streak alive!",
    emoji: "🔥",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackNavigation("Onboarding", "mounted");
    return () => trackNavigation("Onboarding", "unmounted");
  }, []);

  const handleNext = async () => {
    logger.info("Onboarding: Next button pressed", {
      currentIndex,
      isLastSlide: currentIndex === SLIDES.length - 1,
    });

    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex });
      setCurrentIndex(nextIndex);
      logger.debug("Moved to slide", { index: nextIndex });
    } else {
      logger.info("Onboarding: Completing onboarding");
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    logger.info("Onboarding: Skip button pressed");
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      trackNavigation("Onboarding", "completing");
      logger.info("Saving onboarding completion status");
      await AsyncStorage.setItem(STORAGE_KEYS.onboardingComplete, "true");
      logger.info("✓ Onboarding completed");

      // Navigate to main app
      logger.info("Navigating to home");
      trackNavigation("Onboarding", "navigating to tabs");
      router.replace("/(tabs)");
    } catch (error) {
      logger.error("Failed to complete onboarding", error);
      trackNavigation("Onboarding", "error during completion");
      // Still navigate to avoid being stuck
      router.replace("/(tabs)");
    }
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={styles.slide}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {SLIDES.map((_, index) => {
          const opacity = scrollX.interpolate({
            inputRange: [
              (index - 1) * SCREEN_WIDTH,
              index * SCREEN_WIDTH,
              (index + 1) * SCREEN_WIDTH,
            ],
            outputRange: [0.3, 1, 0.3],
            extrapolate: "clamp",
          });

          const width = scrollX.interpolate({
            inputRange: [
              (index - 1) * SCREEN_WIDTH,
              index * SCREEN_WIDTH,
              (index + 1) * SCREEN_WIDTH,
            ],
            outputRange: [8, 24, 8],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={index}
              style={[styles.paginationDot, { opacity, width }]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {currentIndex < SLIDES.length - 1 && (
          <Pressable onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );
          setCurrentIndex(index);
          logger.debug("Scrolled to slide", { index });
        }}
      />

      {renderPagination()}

      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? "GET STARTED" : "NEXT"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  skipText: {
    color: COLORS.text.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  slide: {
    width: SCREEN_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  emoji: {
    fontSize: 120,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text.primary,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: SPACING.xl,
  },
  paginationDot: {
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent.green,
    marginHorizontal: 4,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  button: {
    backgroundColor: COLORS.accent.green,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.background.primary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
