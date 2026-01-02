// src/app/game/swipe.tsx
// ============================================================================
// MAIN GAMEPLAY SCREEN
// Complete integration: Deck → AI → Swipe → Gamification → SRS
// ============================================================================

import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  ActivityIndicator,
  Pressable,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "../../components/layout/SafeAreaView";
import { SwipeCard } from "../../components/game/SwipeCard/SwipeCard";
import { HUD } from "../../components/game/HUD";
import { LevelUpModal } from "../../components/game/LevelUpModal";
import { FloatingXP } from "../../components/game/FloatingXP";
import { ScreenShake } from "../../components/game/ScreenShake";
import { FireModeOverlay } from "../../components/game/FireModeOverlay";
import { EnhancedConfetti } from "../../components/game/EnhancedConfetti";
import { COLORS, SPACING, RADIUS } from "../../core/theme/constants";
import { Card } from "../../types";
import {
  useStore,
  selectCurrentXP,
  selectCurrentLevel,
  selectComboCount,
  selectCurrentTitle,
  selectDeckQueue,
  selectRemainingCards,
} from "../../store";
import { DeckService } from "../../features/deck/deckService";
import { ReviewScheduler } from "../../features/spaced-rep/reviewScheduler";
import {
  calculateXP,
  isSpeedBonusEligible,
} from "../../features/gamification/xpCalculator";
import { useHaptics } from "../../core/hooks/useHaptics";
import { useSounds } from "../../core/hooks/useSounds";
import { useResponseTime } from "../../core/hooks/useTimer";
import { logger } from "../../utils/validation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function GameSwipeScreen() {
  const router = useRouter();
  // const params = useLocalSearchParams(); // Not currently used

  // Store state
  const currentXP = useStore(selectCurrentXP);
  const currentLevel = useStore(selectCurrentLevel);
  const comboCount = useStore(selectComboCount);
  const currentTitle = useStore(selectCurrentTitle);
  const queue = useStore(selectDeckQueue);
  const remainingCards = useStore(selectRemainingCards);

  // Store actions
  const recordCorrect = useStore((state) => state.recordCorrect);
  const recordWrong = useStore((state) => state.recordWrong);
  const startSession = useStore((state) => state.startSession);
  const endSession = useStore((state) => state.endSession);
  const addXP = useStore((state) => state.addXP);
  const checkLevelUp = useStore((state) => state.checkLevelUp);
  const consumeCard = useStore((state) => state.consumeCard);
  const addCards = useStore((state) => state.addCards);
  const setQueue = useStore((state) => state.setQueue);
  const loadout = useStore((state) => state.loadout);

  // Local state
  const [localDeck, setLocalDeck] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [floatingXPs, setFloatingXPs] = useState<
    Array<{ id: string; amount: number; x: number; y: number }>
  >([]);
  const [shouldShake, setShouldShake] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Services
  const deckService = new DeckService();
  const reviewScheduler = new ReviewScheduler();

  // Hooks
  const { trigger: triggerHaptic } = useHaptics();
  const { play: playSound } = useSounds();
  const {
    start: startTimer,
    end: endTimer,
    reset: resetTimer,
  } = useResponseTime();

  // Initialize session
  useEffect(() => {
    initializeSession();
  }, []);

  // Monitor queue and prefetch when low
  useEffect(() => {
    if (remainingCards <= 3 && !isPrefetching && loadout) {
      prefetchCards();
    }
  }, [remainingCards, isPrefetching]);

  // Check level up
  useEffect(() => {
    const interval = setInterval(() => {
      if (checkLevelUp()) {
        logger.info("Level up detected!");
        setShowLevelUp(true);
        triggerHaptic("success");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check for perfect session
  useEffect(() => {
    const checkPerfectSession = () => {
      const stats = useStore.getState().sessionStats;
      if (stats.correct >= 5 && stats.wrong === 0 && stats.correct >= stats.wrong) {
        setShowConfetti(true);
      }
    };

    checkPerfectSession();
  }, []);

  // ========================================
  // INITIALIZATION
  // ========================================
  const initializeSession = async () => {
    try {
      logger.info("Initializing gameplay session", { loadout });

      if (!loadout) {
        logger.error("No loadout found");
        router.replace("/loadout");
        return;
      }

      setLoading(true);
      startSession();

      // Fetch initial cards
      const initialCount = loadout.sessionLength || 10;
      logger.info(`Fetching initial card batch (${initialCount})`);
      const cards = await deckService.fetchCards(loadout, initialCount);

      logger.info("Cards fetched successfully", {
        count: cards.length,
        languages: [...new Set(cards.map((c) => c.lang))],
      });

      setQueue(cards);
      setLocalDeck(cards);
      setLoading(false);

      // Start response timer for first card
      startTimer();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      logger.error("Failed to initialize session", err);
      setError(errorMsg);
      setLoading(false);
    }
  };

  // ========================================
  // PREFETCHING
  // ========================================
  const prefetchCards = async () => {
    if (!loadout || isPrefetching) return;

    try {
      setIsPrefetching(true);
      logger.info("Prefetching next batch of cards");

      const newCards = await deckService.prefetchCards(loadout, 5);
      
      if (newCards.length > 0) {
        addCards(newCards);
        setLocalDeck((prev) => [...prev, ...newCards]);
        logger.info("Prefetch completed and added to deck", { count: newCards.length });
      } else {
        logger.warn("Prefetch returned no cards");
      }
    } catch (err) {
      logger.error("Prefetch failed", err);
    } finally {
      setIsPrefetching(false);
    }
  };

  // ========================================
  // CARD HANDLING
  // ========================================
  const handleSwipe = useCallback(
    async (direction: "left" | "right", card: Card) => {
      // Stop timer and get response time
      const responseTime = endTimer() || 0;
      logger.debug("Card swiped", { direction, cardId: card.id, responseTime });

      // Remove card from visual deck
      setTimeout(() => {
        setLocalDeck((prev) => prev.filter((c) => c.id !== card.id));
      }, 200);

      if (direction === "right") {
        // ✅ CORRECT
        await handleCorrectAnswer(card, responseTime);
      } else {
        // ❌ WRONG
        await handleWrongAnswer(card, responseTime);
      }

      // Consume from queue
      const nextCard = consumeCard();

      if (nextCard) {
        // Reset timer for next card
        resetTimer();
        startTimer();
      } else {
        // Session complete
        logger.info("Session completed - no more cards");
        await completeSession();
      }
    },
    [endTimer, resetTimer, startTimer]
  );

  // ========================================
  // CORRECT ANSWER FLOW
  // ========================================
  const handleCorrectAnswer = async (card: Card, responseTime: number) => {
    logger.info("Correct answer", { cardId: card.id, responseTime });

    // Haptics & Sound
    triggerHaptic("medium");
    playSound("correct");

    // Record in state
    recordCorrect();

    // Calculate XP with bonuses
    const isSpeedBonus = isSpeedBonusEligible(responseTime, card.difficulty);
    const xpBreakdown = calculateXP({
      baseXP: 20,
      combo: comboCount,
      difficulty: card.difficulty,
      isSpeedBonus,
      isReviewMode: false,
    });

    logger.info("XP calculated", xpBreakdown);

    // Add XP to store
    addXP(xpBreakdown.total);

    // Show floating XP
    showFloatingXP(xpBreakdown.total);

    // Fire mode haptic
    if (comboCount >= 5 && comboCount < 10) {
      triggerHaptic("heavy");
      playSound("combo");
    }

    // Record in review system (for future reviews)
    try {
      await reviewScheduler.recordReview(card.id, true, responseTime);
      logger.debug("Review recorded in SRS");
    } catch (err) {
      logger.warn("Failed to record review", err as any);
    }
  };

  // ========================================
  // WRONG ANSWER FLOW
  // ========================================
  const handleWrongAnswer = async (card: Card, responseTime: number) => {
    logger.warn("Wrong answer", { cardId: card.id, responseTime });

    // Haptics & Sound
    triggerHaptic("error");
    playSound("wrong");

    // Screen shake effect
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 300);

    // Record in state
    recordWrong();

    // Add to review deck
    try {
      await reviewScheduler.addToReviewDeck(card);
      logger.info("Card added to review deck", { cardId: card.id });
    } catch (err) {
      logger.error("Failed to add to review deck", err);
    }

    // Record in review system
    try {
      await reviewScheduler.recordReview(card.id, false, responseTime);
    } catch (err) {
      logger.warn("Failed to record review", err as any);
    }
  };

  // ========================================
  // FLOATING XP ANIMATION
  // ========================================
  const showFloatingXP = (amount: number) => {
    const id = `xp_${Date.now()}`;
    const x = SCREEN_WIDTH / 2 - 40;
    const y = 200;

    setFloatingXPs((prev) => [...prev, { id, amount, x, y }]);

    // Remove after animation
    setTimeout(() => {
      setFloatingXPs((prev) => prev.filter((xp) => xp.id !== id));
    }, 1500);
  };

  // ========================================
  // SESSION COMPLETION
  // ========================================
  const completeSession = async () => {
    logger.info("Completing session");

    try {
      const summary = endSession();
      logger.info("Session summary", summary);

      // Navigate to summary screen
      router.replace({
        pathname: "/summary",
        params: {
          totalCards: summary.totalCards,
          correct: summary.correct,
          wrong: summary.wrong,
          accuracy: summary.accuracy,
          xpEarned: summary.xpEarned,
        },
      });
    } catch (err) {
      logger.error("Failed to complete session", err);
      router.replace("/");
    }
  };

  // ========================================
  // EXIT HANDLER
  // ========================================
  const handleExit = () => {
    logger.info("User exiting session early");
    completeSession();
  };

  // ========================================
  // RENDER
  // ========================================

  // Loading state
  if (loading) {
    return (
      <SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.green} />
          <Text style={styles.loadingText}>Loading cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.errorButton}
            onPress={() => router.replace("/loadout")}
          >
            <Text style={styles.errorButtonText}>Back to Loadout</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate next level XP
  const nextLevelXP = Math.floor(100 * Math.pow(currentLevel + 1, 1.5));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView>
        <ScreenShake trigger={shouldShake}>
          {/* Fire Mode Overlay */}
          <FireModeOverlay active={comboCount >= 5} />

          {/* Confetti for perfect session */}
          {showConfetti && (
            <EnhancedConfetti
              active={showConfetti}
              onComplete={() => setShowConfetti(false)}
              type="celebration"
              count={100}
            />
          )}
          <View style={styles.container}>
            {/* HUD */}
            <HUD
              stats={{
                level: currentLevel,
                currentXP,
                nextLevelXP,
                combo: comboCount,
                title: currentTitle,
              }}
            />

            {/* Exit Button */}
            <Pressable style={styles.exitButton} onPress={handleExit}>
              <Text style={styles.exitText}>✕</Text>
            </Pressable>

            {/* Card Deck */}
            <View style={styles.deckContainer}>
              {localDeck.length > 0 ? (
                localDeck.map((card, index) => {
                  // Only render top 2 cards for performance
                  if (index < localDeck.length - 2) return null;

                  const isTopCard = index === localDeck.length - 1;

                  return (
                    <View
                      key={card.id}
                      style={StyleSheet.absoluteFill}
                      pointerEvents={isTopCard ? "auto" : "none"}
                    >
                      {isTopCard ? (
                        <SwipeCard
                          card={card}
                          onSwipeLeft={() => handleSwipe("left", card)}
                          onSwipeRight={() => handleSwipe("right", card)}
                        />
                      ) : (
                        <View
                          style={[
                            styles.cardPlaceholder,
                            {
                              top: 20 * (localDeck.length - 1 - index),
                              transform: [{ scale: 0.95 }],
                            },
                          ]}
                        />
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={COLORS.accent.green} />
                  <Text style={styles.emptyText}>Loading next card...</Text>
                </View>
              )}
            </View>

            {/* Footer Info */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Card {queue.length - remainingCards + 1} / {queue.length}
              </Text>
              {isPrefetching && (
                <Text style={styles.prefetchText}>⚡ Prefetching...</Text>
              )}
            </View>

            {/* Floating XP Animations */}
            {floatingXPs.map((xp) => (
              <FloatingXP
                key={xp.id}
                amount={xp.amount}
                position={{ x: xp.x, y: xp.y }}
                onComplete={() => {
                  setFloatingXPs((prev) => prev.filter((x) => x.id !== xp.id));
                }}
              />
            ))}

            {/* Level Up Modal */}
            <LevelUpModal
              visible={showLevelUp}
              level={currentLevel}
              title={currentTitle}
              xpBonus={100}
              onClose={() => setShowLevelUp(false)}
            />
          </View>
        </ScreenShake>
      </SafeAreaView>
    </GestureHandlerRootView>
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
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
    backgroundColor: COLORS.background.primary,
  },
  errorTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.accent.red,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text.primary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  errorButton: {
    backgroundColor: COLORS.accent.green,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  errorButtonText: {
    color: COLORS.text.inverse,
    fontSize: 16,
    fontWeight: "700",
  },
  exitButton: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background.secondary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  exitText: {
    fontSize: 24,
    color: COLORS.text.secondary,
  },
  deckContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  cardPlaceholder: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 1.3,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: RADIUS.lg,
    position: "absolute",
    alignSelf: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  footer: {
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: "600",
  },
  prefetchText: {
    marginTop: SPACING.xs,
    fontSize: 12,
    color: COLORS.accent.yellow,
  },
});
