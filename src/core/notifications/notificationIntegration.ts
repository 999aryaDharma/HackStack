/**
 * Notification Integration Helper - Fixed
 *
 * Integrates notification system with game flow
 * - Triggers notifications on achievements
 * - Schedules review reminders
 * - Shows streak notifications
 */

import { NotificationService } from "./notificationService";
import { db } from "../db/client";
import { cards } from "../db/schema";
import { lte, or, isNull, eq } from "drizzle-orm";
import { logger } from "../../utils/validation";

export class NotificationIntegration {
  private notificationService: NotificationService;

  constructor(userId: string) {
    this.notificationService = new NotificationService(userId);
    logger.info("NotificationIntegration initialized", { userId });
  }

  /**
   * Initialize notification system
   */
  async initialize(): Promise<void> {
    try {
      logger.info("Initializing notification integration");
      const hasPermission = await this.notificationService.requestPermissions();

      if (hasPermission) {
        logger.info("Notification permissions granted");
      } else {
        logger.warn("Notification permissions denied by user");
      }
    } catch (error) {
      logger.error("Failed to initialize notifications", error);
    }
  }

  /**
   * Called when achievement is unlocked
   */
  async onAchievementUnlocked(
    achievementName: string,
    xpReward: number
  ): Promise<void> {
    try {
      logger.info("Achievement unlocked, sending notification", {
        name: achievementName,
        xpReward,
      });
      await this.notificationService.notifyAchievementUnlock(
        achievementName,
        xpReward
      );
    } catch (error) {
      logger.error("Failed to send achievement notification", error);
    }
  }

  /**
   * Called when user levels up
   */
  async onLevelUp(newLevel: number): Promise<void> {
    try {
      logger.info("Level up, sending notification", { level: newLevel });
      await this.notificationService.notifyLevelUp(newLevel);
    } catch (error) {
      logger.error("Failed to send level up notification", error);
    }
  }

  /**
   * Called when streak reaches milestone
   */
  async onStreakMilestone(streakDays: number): Promise<void> {
    try {
      logger.info("Streak milestone reached", { days: streakDays });
      await this.notificationService.notifyStreakMilestone(streakDays);
    } catch (error) {
      logger.error("Failed to send streak notification", error);
    }
  }

  /**
   * Schedule review reminders
   */
  async scheduleReviewReminders(): Promise<void> {
    try {
      logger.info("Checking for due cards to schedule reminders");

      // Get due card count
      const nowTimestamp = Date.now();

      const dueCardsQuery = await db
        .select()
        .from(cards)
        .where(
          or(
            lte(cards.nextReview, nowTimestamp),
            isNull(cards.nextReview),
            eq(cards.status, "new")
          )
        );

      const dueCount = dueCardsQuery?.length || 0;

      logger.info("Due cards checked", { count: dueCount });

      if (dueCount > 0) {
        logger.info("Scheduling review reminder", { cardCount: dueCount });
        await this.notificationService.scheduleReviewReminder(dueCount);
      } else {
        logger.debug("No due cards, skipping reminder");
      }
    } catch (error) {
      logger.error("Failed to schedule review reminders", error);
    }
  }

  /**
   * Cleanup notifications
   */
  async cleanup(): Promise<void> {
    try {
      logger.info("Cleaning up notifications");
      await this.notificationService.cancelAllNotifications();
      logger.info("Notifications cleaned up");
    } catch (error) {
      logger.error("Failed to cleanup notifications", error);
    }
  }
}

// Singleton instance
let notificationIntegration: NotificationIntegration | null = null;

export function getNotificationIntegration(
  userId: string
): NotificationIntegration {
  if (!notificationIntegration) {
    logger.info("Creating new NotificationIntegration instance", { userId });
    notificationIntegration = new NotificationIntegration(userId);
  }
  return notificationIntegration;
}

export function resetNotificationIntegration(): void {
  logger.info("Resetting NotificationIntegration instance");
  notificationIntegration = null;
}
