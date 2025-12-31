// src/components/game/HUD.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { COLORS, RADIUS, SPACING } from "../../core/theme/constants";
import { UserStats } from "../../types";

interface HUDProps {
  stats: UserStats;
}

export function HUD({ stats }: HUDProps) {
  // Animasi Progress Bar
  const progressWidth = useSharedValue(0);
  // Animasi Combo Scale
  const comboScale = useSharedValue(1);

  useEffect(() => {
    // Hitung persentase XP
    const percent = (stats.currentXP / stats.nextLevelXP) * 100;
    progressWidth.value = withTiming(percent, { duration: 500 });
  }, [stats.currentXP, stats.nextLevelXP]);

  useEffect(() => {
    // Efek "Denyut" saat combo bertambah
    if (stats.combo > 0) {
      comboScale.value = withSequence(withSpring(1.5), withSpring(1));
    }
  }, [stats.combo]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const comboStyle = useAnimatedStyle(() => ({
    transform: [{ scale: comboScale.value }],
  }));

  // Fire Mode: Kalau combo > 5 warna jadi kuning/api
  const isFireMode = stats.combo >= 5;

  return (
    <View style={styles.container}>
      {/* Top Row: Level & Title */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.levelText}>LVL {stats.level}</Text>
          <Text style={styles.titleText}>{stats.title}</Text>
        </View>

        {/* Combo Counter */}
        {stats.combo > 1 && (
          <Animated.View
            style={[
              styles.comboBadge,
              isFireMode && styles.fireBadge,
              comboStyle,
            ]}
          >
            <Text style={[styles.comboText, isFireMode && styles.fireText]}>
              {stats.combo}x COMBO {isFireMode ? "🔥" : ""}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* XP Bar Container */}
      <View style={styles.xpTrack}>
        <Animated.View style={[styles.xpFill, progressStyle]} />
        <Text style={styles.xpText}>
          {stats.currentXP} / {stats.nextLevelXP} XP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    width: "100%",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  levelText: {
    color: COLORS.accent.green,
    fontWeight: "900",
    fontSize: 20,
    fontFamily: "monospace",
  },
  titleText: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  comboBadge: {
    backgroundColor: "rgba(88, 166, 255, 0.2)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.accent.blue,
  },
  fireBadge: {
    backgroundColor: "rgba(210, 153, 34, 0.2)",
    borderColor: COLORS.accent.yellow,
  },
  comboText: {
    color: COLORS.accent.blue,
    fontWeight: "bold",
    fontSize: 14,
  },
  fireText: {
    color: COLORS.accent.yellow,
  },
  xpTrack: {
    height: 14,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: RADIUS.full,
    overflow: "hidden",
    justifyContent: "center",
  },
  xpFill: {
    height: "100%",
    backgroundColor: COLORS.accent.purple,
    borderRadius: RADIUS.full,
  },
  xpText: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.text.primary,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 2,
  },
});
