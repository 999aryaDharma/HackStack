// src/app/profile.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from "react-native";
import { COLORS, SPACING, RADIUS } from "../core/theme/constants";
import { useStore } from "../store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

function StatCard({
  label,
  value,
  subtitle,
  color = COLORS.accent.green,
}: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderColor: color }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

interface ProgressBarProps {
  label: string;
  current: number;
  total: number;
  color?: string;
}

function ProgressBar({
  label,
  current,
  total,
  color = COLORS.accent.green,
}: ProgressBarProps) {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressText}>
          {current} / {total}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const currentXP = useStore((state) => state.currentXP);
  const currentLevel = useStore((state) => state.currentLevel);
  const currentTitle = useStore((state) => state.currentTitle);
  const totalCardsSwiped = useStore((state) => state.totalCardsSwiped);
  const dailyStreak = useStore((state) => state.dailyStreak);
  const maxCombo = useStore((state) => state.maxCombo);

  // Mock data - replace with real data from store
  const stats = {
    totalSessions: 42,
    accuracy: 78,
    totalXP: currentXP + currentLevel * 100,
    achievementsUnlocked: 12,
    languagesMastered: 2,
  };

  const nextLevelXP = Math.floor(100 * Math.pow(currentLevel + 1, 1.5));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{currentTitle.charAt(0)}</Text>
          </View>
          <Text style={styles.level}>LEVEL {currentLevel}</Text>
          <Text style={styles.title}>{currentTitle}</Text>
        </View>

        {/* XP Progress */}
        <View style={styles.xpSection}>
          <ProgressBar
            label="Progress to Next Level"
            current={currentXP}
            total={nextLevelXP}
            color={COLORS.accent.purple}
          />
        </View>

        {/* Core Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Total XP"
            value={stats.totalXP.toLocaleString()}
            color={COLORS.accent.purple}
          />
          <StatCard
            label="Cards Swiped"
            value={totalCardsSwiped}
            color={COLORS.accent.cyan}
          />
          <StatCard
            label="Daily Streak"
            value={dailyStreak}
            subtitle="days"
            color={COLORS.accent.yellow}
          />
          <StatCard
            label="Max Combo"
            value={`${maxCombo}x`}
            color={COLORS.accent.red}
          />
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.sectionContent}>
            <ProgressBar
              label="Overall Accuracy"
              current={stats.accuracy}
              total={100}
              color={COLORS.accent.green}
            />
            <ProgressBar
              label="Sessions Completed"
              current={stats.totalSessions}
              total={100}
              color={COLORS.accent.blue}
            />
          </View>
        </View>

        {/* Language Mastery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language Mastery</Text>
          <View style={styles.sectionContent}>
            <ProgressBar
              label="JavaScript"
              current={85}
              total={100}
              color={COLORS.accent.yellow}
            />
            <ProgressBar
              label="TypeScript"
              current={72}
              total={100}
              color={COLORS.accent.blue}
            />
            <ProgressBar
              label="Python"
              current={45}
              total={100}
              color={COLORS.accent.green}
            />
          </View>
        </View>

        {/* Achievements Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <View style={styles.achievementsPreview}>
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementIcon}>🏆</Text>
            </View>
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementIcon}>🔥</Text>
            </View>
            <View style={styles.achievementBadge}>
              <Text style={styles.achievementIcon}>⚡</Text>
            </View>
            <View
              style={[styles.achievementBadge, styles.achievementBadgeLocked]}
            >
              <Text style={styles.achievementIcon}>🔒</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Member since December 2025</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.tertiary,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accent.green,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.background.primary,
  },
  level: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accent.green,
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text.primary,
  },
  xpSection: {
    padding: SPACING.xl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.accent.green,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.accent.green,
  },
  statSubtitle: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  section: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  sectionContent: {
    gap: SPACING.md,
  },
  progressContainer: {
    marginBottom: SPACING.sm,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: RADIUS.full,
  },
  achievementsPreview: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  achievementBadge: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.accent.green,
    justifyContent: "center",
    alignItems: "center",
  },
  achievementBadgeLocked: {
    borderColor: COLORS.background.tertiary,
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: 28,
  },
  footer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
});
