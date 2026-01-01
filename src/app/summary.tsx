// src/app/summary.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Share } from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  FadeIn,
  SlideInUp,
} from "react-native-reanimated";
import { Screen } from "../components/layout/Screen";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { COLORS, SPACING } from "../core/theme/constants";
import { useStore } from "../store";
import { formatDuration } from "../utils/date";
import { logger } from "../utils/validation";
import * as Haptics from "expo-haptics";

export default function SummaryScreen() {
  const router = useRouter();
  const endSession = useStore((state) => state.endSession);

  const [summary, setSummary] = useState({
    totalCards: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
    maxCombo: 0,
    xpEarned: 0,
    duration: 0,
    perfectSession: false,
  });

  useEffect(() => {
    // Calculate final stats
    const finalStats = endSession();
    setSummary(finalStats);
    logger.info("Session completed", finalStats);

    // Trigger haptics based on performance
    if (finalStats.perfectSession) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Just completed a HackStack session! 🎯\n${summary.correct}/${summary.totalCards} correct (${summary.accuracy}%)\nMax Combo: ${summary.maxCombo}x\n+${summary.xpEarned} XP earned!`,
      });
    } catch (error) {
      logger.error("Failed to share", error);
    }
  };

  const handlePlayAgain = () => {
    router.push("/loadout");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  // Animations
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10 });

    if (summary.perfectSession) {
      rotation.value = withSequence(
        withDelay(500, withSpring(360)),
        withSpring(0)
      );
    }
  }, [summary.perfectSession]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  return (
    <Screen safe padded>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.header}>
          <Text style={styles.title}>Session Complete!</Text>
          {summary.perfectSession && (
            <Animated.Text style={[styles.badge, animatedStyle]}>
              PERFECT!
            </Animated.Text>
          )}
        </Animated.View>

        {/* Main Stats */}
        <Animated.View entering={SlideInUp.delay(200)}>
          <Card variant="elevated" style={styles.mainCard}>
            <View style={styles.mainStat}>
              <Text style={styles.mainStatLabel}>Accuracy</Text>
              <Text
                style={[
                  styles.mainStatValue,
                  { color: getAccuracyColor(summary.accuracy) },
                ]}
              >
                {summary.accuracy}%
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{summary.correct}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: COLORS.accent.red }]}>
                  {summary.wrong}
                </Text>
                <Text style={styles.statLabel}>Wrong</Text>
              </View>
              <View style={styles.statItem}>
                <Text
                  style={[styles.statValue, { color: COLORS.accent.yellow }]}
                >
                  {summary.maxCombo}x
                </Text>
                <Text style={styles.statLabel}>Max Combo</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* XP Earned */}
        <Animated.View entering={SlideInUp.delay(300)}>
          <Card style={styles.xpCard}>
            <Text style={styles.xpLabel}>XP Earned</Text>
            <Text style={styles.xpValue}>+{summary.xpEarned}</Text>
          </Card>
        </Animated.View>

        {/* Additional Info */}
        <Animated.View entering={SlideInUp.delay(400)}>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>
                {formatDuration(summary.duration)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cards Swiped</Text>
              <Text style={styles.infoValue}>{summary.totalCards}</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="PLAY AGAIN"
            onPress={handlePlayAgain}
            size="large"
            variant="primary"
          />
          <View style={styles.secondaryActions}>
            <Button
              title="Share Results"
              onPress={handleShare}
              size="medium"
              variant="ghost"
            />
            <Button
              title="Home"
              onPress={handleGoHome}
              size="medium"
              variant="ghost"
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy === 100) return COLORS.accent.green;
  if (accuracy >= 80) return COLORS.accent.blue;
  if (accuracy >= 60) return COLORS.accent.yellow;
  return COLORS.accent.red;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: SPACING.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  badge: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.accent.green,
  },
  mainCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.xl,
  },
  mainStat: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  mainStatLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  mainStatValue: {
    fontSize: 64,
    fontWeight: "900",
    color: COLORS.accent.green,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.background.tertiary,
    marginVertical: SPACING.lg,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.accent.green,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  xpCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.xl,
    alignItems: "center",
    backgroundColor: "rgba(57, 211, 83, 0.1)",
    borderWidth: 2,
    borderColor: COLORS.accent.green,
  },
  xpLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  xpValue: {
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.accent.green,
  },
  infoCard: {
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  actions: {
    marginTop: "auto",
  },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: SPACING.md,
  },
});
