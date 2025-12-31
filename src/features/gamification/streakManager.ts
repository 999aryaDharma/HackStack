// src/features/gamification/streakManager.ts
import { db } from "../../core/db/client";
import { profiles } from "../../core/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../utils/validation";
import {
  getStartOfDay,
  getEndOfDay,
  isWithinStreakGracePeriod,
} from "../../utils/date";

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  isActiveToday: boolean;
  gracePeriodActive: boolean;
  nextDeadline: Date;
}

export class StreakManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Check and update streak status
   * Call this on app open or session completion
   */
  async checkAndUpdateStreak(): Promise<StreakInfo> {
    try {
      logger.info("Checking streak status", { userId: this.userId });

      const profile = await this.getProfile();
      if (!profile) {
        throw new Error("Profile not found");
      }

      const { dailyStreak, longestStreak, lastActiveDate } = profile;

      const now = new Date();
      const todayStart = getStartOfDay(now);
      const todayEnd = getEndOfDay(now);

      // Check if user was active today
      if (lastActiveDate) {
        const lastActive = new Date(lastActiveDate);
        const isActiveToday =
          lastActive >= todayStart && lastActive <= todayEnd;

        if (isActiveToday) {
          logger.debug("User already active today, streak maintained");
          return this.buildStreakInfo(profile, true);
        }
      }

      // Check if streak is broken or continuing
      const streakInfo = await this.calculateStreakStatus(
        dailyStreak,
        longestStreak,
        lastActiveDate
      );

      logger.info("Streak status calculated", streakInfo);
      return streakInfo;
    } catch (error) {
      logger.error("Failed to check streak", error);
      throw error;
    }
  }

  /**
   * Record activity to maintain/increment streak
   */
  async recordActivity(): Promise<StreakInfo> {
    try {
      logger.info("Recording activity for streak", { userId: this.userId });

      const profile = await this.getProfile();
      if (!profile) {
        throw new Error("Profile not found");
      }

      const now = new Date();
      const todayStart = getStartOfDay(now);

      // Check if already recorded today
      if (profile.lastActiveDate) {
        const lastActive = new Date(profile.lastActiveDate);
        if (lastActive >= todayStart) {
          logger.debug("Activity already recorded today");
          return this.buildStreakInfo(profile, true);
        }
      }

      // Calculate new streak
      const newStreak = await this.incrementStreak(profile);

      logger.info("Streak updated", newStreak);
      return newStreak;
    } catch (error) {
      logger.error("Failed to record activity", error);
      throw error;
    }
  }

  /**
   * Get current streak information
   */
  async getStreakInfo(): Promise<StreakInfo> {
    const profile = await this.getProfile();
    if (!profile) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        isActiveToday: false,
        gracePeriodActive: false,
        nextDeadline: getEndOfDay(new Date()),
      };
    }

    return this.buildStreakInfo(profile, await this.isActiveToday());
  }

  /**
   * Use a streak freeze token (premium feature)
   */
  async useStreakFreeze(): Promise<boolean> {
    try {
      // TODO: Implement freeze token logic
      logger.info("Streak freeze used", { userId: this.userId });
      return true;
    } catch (error) {
      logger.error("Failed to use streak freeze", error);
      return false;
    }
  }

  /**
   * Calculate streak status based on last activity
   */
  private async calculateStreakStatus(
    currentStreak: number,
    longestStreak: number,
    lastActiveDate: string | null
  ): Promise<StreakInfo> {
    const now = new Date();

    if (!lastActiveDate) {
      // First time user
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        isActiveToday: false,
        gracePeriodActive: false,
        nextDeadline: getEndOfDay(now),
      };
    }

    const lastActive = new Date(lastActiveDate);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = getStartOfDay(yesterday);
    const yesterdayEnd = getEndOfDay(yesterday);

    // Was active yesterday - streak can continue
    const wasActiveYesterday =
      lastActive >= yesterdayStart && lastActive <= yesterdayEnd;

    if (wasActiveYesterday) {
      return {
        currentStreak,
        longestStreak,
        lastActiveDate,
        isActiveToday: false,
        gracePeriodActive: false,
        nextDeadline: getEndOfDay(now),
      };
    }

    // Check if within grace period (until 5am)
    if (isWithinStreakGracePeriod()) {
      return {
        currentStreak,
        longestStreak,
        lastActiveDate,
        isActiveToday: false,
        gracePeriodActive: true,
        nextDeadline: new Date(now.setHours(5, 0, 0, 0)),
      };
    }

    // Streak is broken
    logger.warn("Streak broken", {
      userId: this.userId,
      lastActiveDate,
      currentStreak,
    });

    await db
      .update(profiles)
      .set({
        dailyStreak: 0,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, this.userId));

    return {
      currentStreak: 0,
      longestStreak,
      lastActiveDate,
      isActiveToday: false,
      gracePeriodActive: false,
      nextDeadline: getEndOfDay(now),
    };
  }

  /**
   * Increment streak counter
   */
  private async incrementStreak(profile: any): Promise<StreakInfo> {
    const newStreak = profile.dailyStreak + 1;
    const newLongest = Math.max(newStreak, profile.longestStreak);

    await db
      .update(profiles)
      .set({
        dailyStreak: newStreak,
        longestStreak: newLongest,
        lastActiveDate: new Date().toISOString(),
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, this.userId));

    return {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: new Date().toISOString(),
      isActiveToday: true,
      gracePeriodActive: false,
      nextDeadline: getEndOfDay(new Date()),
    };
  }

  /**
   * Check if user is active today
   */
  private async isActiveToday(): Promise<boolean> {
    const profile = await this.getProfile();
    if (!profile || !profile.lastActiveDate) return false;

    const lastActive = new Date(profile.lastActiveDate);
    const todayStart = getStartOfDay(new Date());

    return lastActive >= todayStart;
  }

  /**
   * Get user profile
   */
  private async getProfile() {
    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, this.userId))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Build streak info object
   */
  private buildStreakInfo(profile: any, isActiveToday: boolean): StreakInfo {
    return {
      currentStreak: profile.dailyStreak,
      longestStreak: profile.longestStreak,
      lastActiveDate: profile.lastActiveDate,
      isActiveToday,
      gracePeriodActive: isWithinStreakGracePeriod(),
      nextDeadline: getEndOfDay(new Date()),
    };
  }
}

// Notification helper
export async function scheduleStreakReminder(streakInfo: StreakInfo) {
  // TODO: Implement push notification scheduling
  logger.info("Streak reminder scheduled", streakInfo);
}
