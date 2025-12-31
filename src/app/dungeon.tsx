// src/app/dungeon.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { COLORS, SPACING, RADIUS } from "../core/theme/constants";
import { ReviewScheduler } from "../features/spaced-rep/reviewScheduler";
import { Card } from "../types";

interface MonsterCardProps {
  card: Card;
  masteryScore: number;
  dueDate: Date;
  onPress: () => void;
}

function MonsterCard({
  card,
  masteryScore,
  dueDate,
  onPress,
}: MonsterCardProps) {
  const isOverdue = dueDate < new Date();
  const isBoss = masteryScore < 30;

  const getMonsterEmoji = () => {
    if (isBoss) return "👹"; // Boss monster
    if (masteryScore < 50) return "👾"; // Regular monster
    return "👻"; // Weak monster
  };

  const getHPBarColor = () => {
    if (masteryScore < 30) return COLORS.accent.red;
    if (masteryScore < 70) return COLORS.accent.yellow;
    return COLORS.accent.green;
  };

  return (
    <Pressable style={styles.monsterCard} onPress={onPress}>
      <View style={styles.monsterHeader}>
        <Text style={styles.monsterEmoji}>{getMonsterEmoji()}</Text>
        <View style={styles.monsterInfo}>
          <Text style={styles.monsterLang}>{card.lang}</Text>
          <Text style={styles.monsterType}>{card.type.toUpperCase()}</Text>
        </View>
        {isOverdue && (
          <View style={styles.overdueBadge}>
            <Text style={styles.overdueText}>OVERDUE</Text>
          </View>
        )}
      </View>

      <View style={styles.hpBarContainer}>
        <Text style={styles.hpLabel}>HP (Mastery)</Text>
        <View style={styles.hpBar}>
          <View
            style={[
              styles.hpFill,
              {
                width: `${masteryScore}%`,
                backgroundColor: getHPBarColor(),
              },
            ]}
          />
        </View>
        <Text style={styles.hpText}>{masteryScore}%</Text>
      </View>

      <Text style={styles.dueText} numberOfLines={1}>
        {card.question.substring(0, 50)}...
      </Text>
    </Pressable>
  );
}

export default function DungeonScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [dueCards, setDueCards] = useState<any[]>([]);
  const [overdueCards, setOverdueCards] = useState<any[]>([]);
  const [stats, setStats] = useState({
    dueToday: 0,
    overdue: 0,
    learning: 0,
    mastered: 0,
  });

  const reviewScheduler = new ReviewScheduler();

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setLoading(true);

      const [due, overdue, reviewStats] = await Promise.all([
        reviewScheduler.getDueCards(20),
        reviewScheduler.getOverdueCards(),
        reviewScheduler.getReviewStats(),
      ]);

      setDueCards(due);
      setOverdueCards(overdue);
      setStats(reviewStats);
    } catch (error) {
      console.error("Failed to load review data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuickReview = () => {
    // TODO: Navigate to review session with due cards
    console.log("Start quick review");
  };

  const handleStartBossRush = () => {
    // TODO: Navigate to review session with overdue cards
    console.log("Start boss rush");
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent.green} />
          <Text style={styles.loadingText}>Loading dungeon...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Review Dungeon</Text>
          <Text style={styles.headerSubtitle}>
            Defeat the monsters you've encountered before
          </Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.dueToday}</Text>
            <Text style={styles.statLabel}>Due Today</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: COLORS.accent.red }]}>
              {stats.overdue}
            </Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: COLORS.accent.yellow }]}>
              {stats.learning}
            </Text>
            <Text style={styles.statLabel}>Learning</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: COLORS.accent.green }]}>
              {stats.mastered}
            </Text>
            <Text style={styles.statLabel}>Mastered</Text>
          </View>
        </View>

        {/* Quick Actions */}
        {stats.dueToday > 0 && (
          <View style={styles.actionSection}>
            <Pressable
              style={[styles.actionButton, styles.primaryAction]}
              onPress={handleStartQuickReview}
            >
              <Text style={styles.actionEmoji}>⚔️</Text>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Quick Review</Text>
                <Text style={styles.actionSubtitle}>
                  {stats.dueToday} monsters waiting
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {stats.overdue > 0 && (
          <View style={styles.actionSection}>
            <Pressable
              style={[styles.actionButton, styles.bossAction]}
              onPress={handleStartBossRush}
            >
              <Text style={styles.actionEmoji}>👹</Text>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Boss Rush</Text>
                <Text style={styles.actionSubtitle}>
                  {stats.overdue} overdue bosses
                </Text>
              </View>
            </Pressable>
          </View>
        )}

        {/* Empty State */}
        {stats.dueToday === 0 && stats.overdue === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptySubtitle}>
              No monsters to fight today. Come back tomorrow!
            </Text>
          </View>
        )}

        {/* Monster List */}
        {dueCards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monsters Due Today</Text>
            {dueCards.map((card) => (
              <MonsterCard
                key={card.id}
                card={card}
                masteryScore={card.masteryScore || 0}
                dueDate={new Date(card.nextReview || Date.now())}
                onPress={() => console.log("Fight", card.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  },
  loadingText: {
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  header: {
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background.tertiary,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  statsContainer: {
    flexDirection: "row",
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.accent.blue,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.text.secondary,
    textAlign: "center",
  },
  actionSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
  },
  primaryAction: {
    backgroundColor: COLORS.background.secondary,
    borderColor: COLORS.accent.green,
  },
  bossAction: {
    backgroundColor: COLORS.background.secondary,
    borderColor: COLORS.accent.red,
  },
  actionEmoji: {
    fontSize: 48,
    marginRight: SPACING.md,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  monsterCard: {
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.background.tertiary,
  },
  monsterHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  monsterEmoji: {
    fontSize: 32,
    marginRight: SPACING.sm,
  },
  monsterInfo: {
    flex: 1,
  },
  monsterLang: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accent.cyan,
  },
  monsterType: {
    fontSize: 10,
    color: COLORS.text.secondary,
  },
  overdueBadge: {
    backgroundColor: COLORS.accent.red,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  overdueText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.text.inverse,
  },
  hpBarContainer: {
    marginBottom: SPACING.sm,
  },
  hpLabel: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  hpBar: {
    height: 6,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: RADIUS.full,
    overflow: "hidden",
    marginBottom: 4,
  },
  hpFill: {
    height: "100%",
  },
  hpText: {
    fontSize: 10,
    color: COLORS.text.secondary,
    textAlign: "right",
  },
  dueText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontFamily: "monospace",
  },
});
