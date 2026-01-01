/**
 * Review Session Screen
 *
 * Dedicated mode for reviewing failed cards (Dungeon Mode)
 * - Same swipe mechanics as arcade
 * - No XP penalty for wrong answers
 * - Always show correct answer
 * - Quick Review (5 cards due today) or Boss Rush (overdue cards)
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Alert, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS, SPACING, RADIUS } from "../../core/theme/constants";
import { Card, UserStats } from "../../types";
import { ReviewScheduler } from "../../features/spaced-rep/reviewScheduler";
import { SwipeCard } from "../../components/game/SwipeCard/SwipeCard";
import { HUD } from "../../components/game/HUD";
import { FloatingXP } from "../../components/game/FloatingXP";
import { useHaptics } from "../../core/hooks/useHaptics";
import { useSounds } from "../../core/hooks/useSounds";
import { useStore } from "../../store";
import { logger } from "../../utils/logger";

interface ReviewSessionStats {
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
  maxCombo: number;
  startTime: number;
}

export default function ReviewSessionScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [stats, setStats] = useState<ReviewSessionStats>({
    total: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
    maxCombo: 0,
    startTime: Date.now(),
  });
  const [comboCount, setComboCount] = useState(0);
  const [floatingXP, setFloatingXP] = useState<
    { id: string; amount: number; position: { x: number; y: number } }[]
  >([]);

  const { trigger: triggerHaptic } = useHaptics();
  const { play: playSound } = useSounds();
  const { currentXP, currentLevel } = useStore();
  const reviewScheduler = new ReviewScheduler();

  // Load cards based on mode
  useEffect(() => {
    loadReviewCards();
  }, [mode]);

  const loadReviewCards = async () => {
    try {
      setLoading(true);
      let loadedCards: Card[] = [];

      if (mode === "boss-rush") {
        // Get overdue cards
        loadedCards = await reviewScheduler.getOverdueCards();
        if (loadedCards.length === 0) {
          Alert.alert("No Overdue Cards", "No overdue cards to review!");
          router.back();
          return;
        }
      } else {
        // Quick review - get cards due today
        loadedCards = await reviewScheduler.getDueCards(10);
        if (loadedCards.length === 0) {
          Alert.alert("No Due Cards", "No cards due for review today!");
          router.back();
          return;
        }
      }

      setCards(loadedCards);
      setStats((prev) => ({
        ...prev,
        total: loadedCards.length,
      }));
    } catch (error) {
      logger.error("Failed to load review cards", error);
      Alert.alert("Error", "Failed to load review cards");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const currentCard = useMemo(() => {
    if (currentCardIndex >= cards.length) return null;
    return cards[currentCardIndex];
  }, [cards, currentCardIndex]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentCard) return;

    try {
      const responseTime = Date.now() - stats.startTime;
      const newCombo = comboCount + 1;
      const maxCombo = Math.max(stats.maxCombo, newCombo);

      // Record correct review in SRS
      await reviewScheduler.recordReview(currentCard.id, true, responseTime);

      // No XP in review mode, but show feedback
      triggerHaptic("medium");
      playSound("correct");

      setComboCount(newCombo);
      setStats((prev) => ({
        ...prev,
        correct: prev.correct + 1,
        accuracy: Math.round(((prev.correct + 1) / prev.total) * 100),
        maxCombo,
      }));

      // Move to next card
      setTimeout(() => {
        if (currentCardIndex < cards.length - 1) {
          setCurrentCardIndex((prev) => prev + 1);
        } else {
          endSession();
        }
      }, 300);
    } catch (error) {
      logger.error("Failed to record review", error);
    }
  }, [currentCard, stats, comboCount, cards, currentCardIndex]);

  const handleSwipeLeft = useCallback(async () => {
    if (!currentCard) return;

    try {
      const responseTime = Date.now() - stats.startTime;
      const newCombo = 0;

      // Record wrong review in SRS
      await reviewScheduler.recordReview(currentCard.id, false, responseTime);

      // Wrong answer feedback
      triggerHaptic("heavy");
      playSound("wrong");

      setComboCount(newCombo);
      setStats((prev) => ({
        ...prev,
        wrong: prev.wrong + 1,
        accuracy: Math.round((prev.correct / prev.total) * 100),
      }));

      // Move to next card
      setTimeout(() => {
        if (currentCardIndex < cards.length - 1) {
          setCurrentCardIndex((prev) => prev + 1);
        } else {
          endSession();
        }
      }, 300);
    } catch (error) {
      logger.error("Failed to record review", error);
    }
  }, [currentCard, stats, comboCount, cards, currentCardIndex]);

  const endSession = () => {
    router.push({
      pathname: "/summary",
      params: {
        mode: "review",
        total: stats.total,
        correct: stats.correct,
        wrong: stats.wrong,
        accuracy: stats.accuracy,
        maxCombo: stats.maxCombo,
        xpEarned: 0,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading review session...</Text>
      </View>
    );
  }

  if (!currentCard) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No cards to review</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HUD */}
      <HUD
        stats={
          {
            level: currentLevel,
            currentXP,
            nextLevelXP: 1000,
            combo: comboCount,
            title: "Learner",
          } as UserStats
        }
      />

      {/* Progress */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${((currentCardIndex + 1) / cards.length) * 100}%`,
            },
          ]}
        />
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        <SwipeCard
          card={currentCard}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        />
      </View>

      {/* Floating XP */}
      {floatingXP.map((xp) => (
        <FloatingXP
          key={xp.id}
          amount={xp.amount}
          position={xp.position}
          onComplete={() => {
            setFloatingXP((prev) => prev.filter((f) => f.id !== xp.id));
          }}
        />
      ))}

      {/* End Button */}
      <View style={styles.bottomButtonContainer}>
        <Pressable
          style={styles.endButton}
          onPress={() => {
            Alert.alert(
              "End Review Session?",
              `You've reviewed ${stats.correct + stats.wrong} cards.`,
              [
                { text: "Cancel", onPress: () => {} },
                { text: "End", onPress: endSession, style: "destructive" },
              ]
            );
          }}
        >
          <Text style={styles.endButtonText}>End Session</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background.primary,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.background.secondary,
    width: "100%",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.accent.cyan,
  },
  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  bottomButtonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  endButton: {
    backgroundColor: COLORS.accent.red,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  endButtonText: {
    color: COLORS.text.inverse,
    fontSize: 16,
    fontWeight: "700",
  },
});
