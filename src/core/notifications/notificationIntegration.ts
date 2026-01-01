/**
 * Notification Integration Helper
 *
 * Integrates notification system with game flow
 * - Triggers notifications on achievements
 * - Schedules review reminders
 * - Shows streak notifications
 */

import { NotificationService } from "./notificationService";
import { db } from "../db/client";
import { logger } from "../../utils/logger";

export class NotificationIntegration {
  private notificationService: NotificationService;

  constructor(userId: string) {
    this.notificationService = new NotificationService(userId);
  }

  /**
   * Initialize notification system
   */
  async initialize(): Promise<void> {
    try {
      const hasPermission = await this.notificationService.requestPermissions();

      if (hasPermission) {
        logger.info("Notification permissions granted");
      } else {
        logger.warn("Notification permissions denied");
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
      // Get due card count
      const dueCardsQuery = await db.query.cards.findMany({
        where: (cards, { lte, or, isNull, eq }) =>
          or(
            lte(cards.nextReview, Date.now()),
            isNull(cards.nextReview),
            eq(cards.status, "new")
          ),
      });

      if (dueCardsQuery && dueCardsQuery.length > 0) {
        await this.notificationService.scheduleReviewReminder(
          dueCardsQuery.length
        );
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
      await this.notificationService.cancelAllNotifications();
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
    notificationIntegration = new NotificationIntegration(userId);
  }
  return notificationIntegration;
}

export function resetNotificationIntegration(): void {
  notificationIntegration = null;
}
