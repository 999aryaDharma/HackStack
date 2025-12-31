// src/features/gamification/achievementTracker.ts
import { db } from "../../core/db/client";
import { achievements } from "../../core/db/schema";
import { eq, and } from "drizzle-orm";
import {
  Achievement,
  UserAchievementStats,
  checkUnlockableAchievements,
} from "../../constants/achievements";
import * as Haptics from "expo-haptics";

export class AchievementTracker {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async checkAchievements(stats: UserAchievementStats): Promise<Achievement[]> {
    // Get already unlocked achievement IDs
    const unlocked = await db
      .select({ achievementId: achievements.achievementId })
      .from(achievements)
      .where(
        and(
          eq(achievements.userId, this.userId),
          eq(achievements.isUnlocked, true)
        )
      );

    const unlockedIds = unlocked.map((a) => a.achievementId);

    // Check which achievements can be unlocked now
    const unlockable = checkUnlockableAchievements(stats, unlockedIds);

    // Unlock each achievement
    const newlyUnlocked: Achievement[] = [];
    for (const achievement of unlockable) {
      const success = await this.unlockAchievement(achievement);
      if (success) {
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  private async unlockAchievement(achievement: Achievement): Promise<boolean> {
    try {
      const now = Date.now();

      await db.insert(achievements).values({
        id: `${this.userId}_${achievement.id}`,
        userId: this.userId,
        achievementId: achievement.id,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        rarity: achievement.rarity,
        xpReward: achievement.xpReward,
        isUnlocked: true,
        progressCurrent: 100,
        progressTarget: 100,
        unlockedAt: now,
      });

      // Trigger haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      console.log(`Achievement unlocked: ${achievement.name}`);
      return true;
    } catch (error) {
      console.error("Failed to unlock achievement:", error);
      return false;
    }
  }

  async getUserAchievements(): Promise<Achievement[]> {
    const userAchievements = await db
      .select()
      .from(achievements)
      .where(
        and(
          eq(achievements.userId, this.userId),
          eq(achievements.isUnlocked, true)
        )
      );

    // Convert DB records to Achievement objects
    return userAchievements.map((a) => ({
      id: a.achievementId,
      name: a.name,
      description: a.description,
      category: a.category as any,
      rarity: a.rarity as any,
      icon: "", // Icon would be mapped from constants
      xpReward: a.xpReward,
      condition: () => true, // Already unlocked
    }));
  }

  async getTotalXPFromAchievements(): Promise<number> {
    const userAchievements = await db
      .select({ xpReward: achievements.xpReward })
      .from(achievements)
      .where(
        and(
          eq(achievements.userId, this.userId),
          eq(achievements.isUnlocked, true)
        )
      );

    return userAchievements.reduce((total, a) => total + a.xpReward, 0);
  }

  async getAchievementProgress(achievementId: string): Promise<number> {
    const achievement = await db
      .select()
      .from(achievements)
      .where(
        and(
          eq(achievements.userId, this.userId),
          eq(achievements.achievementId, achievementId)
        )
      )
      .limit(1);

    if (achievement.length === 0) return 0;

    const { progressCurrent, progressTarget } = achievement[0];
    return Math.round((progressCurrent / progressTarget) * 100);
  }
}
