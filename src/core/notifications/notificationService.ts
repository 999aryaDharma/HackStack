// src/core/notifications/notificationService.ts
/**
 * Notification Service - Safe Version
 * Handles cases where expo-notifications might not be available
 */

import { logger } from "../../utils/logger";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Safely import notifications
let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
} catch (error) {
  logger.warn("expo-notifications not available", error as Error);
}

// Configure notification handler only if available
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    logger.error("Failed to set notification handler", error);
  }
}

export interface NotificationNavigationEvent {
  type: "review" | "achievement" | "streak" | "level_up";
  data?: Record<string, any>;
}

export class NotificationService {
  private userId: string;
  private reviewReminderScheduled = false;
  private isAvailable: boolean;

  constructor(userId: string) {
    this.userId = userId;
    this.isAvailable = Notifications !== null;

    if (!this.isAvailable) {
      logger.warn(
        "NotificationService initialized without expo-notifications support"
      );
    } else {
      logger.info("NotificationService initialized", { userId });
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.isAvailable) {
      logger.warn("Notifications not available, skipping permission request");
      return false;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();

      if (status === "granted") {
        logger.info("Notification permissions already granted");
        return true;
      }

      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();

      logger.info("Notification permission requested", { status: newStatus });
      return newStatus === "granted";
    } catch (error) {
      logger.error("Failed to request notification permissions", error);
      return false;
    }
  }

  async scheduleReviewReminder(dueCardCount: number): Promise<void> {
    if (!this.isAvailable) {
      logger.debug("Notifications not available, skipping reminder");
      return;
    }

    if (this.reviewReminderScheduled) {
      logger.debug("Review reminder already scheduled, skipping");
      return;
    }

    try {
      const lastReviewDate = await AsyncStorage.getItem(
        `lastReview_${this.userId}`
      );
      const today = new Date().toDateString();

      if (lastReviewDate === today) {
        logger.debug("User already reviewed today, skipping reminder");
        return;
      }

      const usageHour = await this.getUserPreferredHour();
      const notificationTime = this.getNextOccurrenceTime(usageHour);
      const secondsFromNow = (notificationTime.getTime() - Date.now()) / 1000;

      if (secondsFromNow > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Time to Review",
            body: `${dueCardCount} cards are waiting for you. Crush them!`,
            sound: "default",
            badge: dueCardCount,
            data: {
              type: "review",
              cardCount: dueCardCount,
            },
          },
          trigger: {
            seconds: Math.ceil(secondsFromNow),
          },
        });

        logger.info("Review reminder scheduled", {
          time: notificationTime.toISOString(),
          cardCount: dueCardCount,
        });

        this.reviewReminderScheduled = true;
      }
    } catch (error) {
      logger.error("Failed to schedule review reminder", error);
    }
  }

  async notifyAchievementUnlock(
    achievementName: string,
    xpReward: number
  ): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Achievement Unlocked!",
          body: `${achievementName} +${xpReward} XP`,
          sound: "default",
          badge: 1,
          data: {
            type: "achievement",
            name: achievementName,
            xpReward,
          },
        },
        trigger: null,
      });

      logger.info("Achievement notification sent", {
        name: achievementName,
        xpReward,
      });
    } catch (error) {
      logger.error("Failed to send achievement notification", error);
    }
  }

  async notifyStreakMilestone(streakDays: number): Promise<void> {
    if (!this.isAvailable) return;

    try {
      const milestone = streakDays % 7 === 0;

      if (milestone) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Streak Milestone!",
            body: `You're on a ${streakDays}-day streak! Keep it going!`,
            sound: "default",
            badge: 1,
            data: {
              type: "streak",
              days: streakDays,
            },
          },
          trigger: null,
        });

        logger.info("Streak notification sent", { days: streakDays });
      }
    } catch (error) {
      logger.error("Failed to send streak notification", error);
    }
  }

  async notifyLevelUp(newLevel: number): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Level Up!",
          body: `You reached level ${newLevel}!`,
          sound: "default",
          badge: 1,
          data: {
            type: "level_up",
            level: newLevel,
          },
        },
        trigger: null,
      });

      logger.info("Level up notification sent", { level: newLevel });
    } catch (error) {
      logger.error("Failed to send level up notification", error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.reviewReminderScheduled = false;
      logger.info("All notifications cancelled");
    } catch (error) {
      logger.error("Failed to cancel notifications", error);
    }
  }

  private async getUserPreferredHour(): Promise<number> {
    try {
      const hour = await AsyncStorage.getItem(
        `notificationHour_${this.userId}`
      );
      return hour ? parseInt(hour) : 8;
    } catch {
      return 8;
    }
  }

  private getNextOccurrenceTime(hour: number): Date {
    const now = new Date();
    const next = new Date(now);

    next.setHours(hour, 0, 0, 0);

    if (next < now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  static handleNotificationResponse(response: any) {
    const { data } = response.notification.request.content;
    logger.info("Notification tapped", { type: data?.type, data });
  }
}

/**
 * Setup notification listeners
 * Safe version that doesn't crash if notifications unavailable
 */
export function setupNotificationListeners(): () => void {
  if (!Notifications) {
    logger.warn("expo-notifications not available, skipping listener setup");
    return () => {};
  }

  try {
    logger.info("Setting up notification listeners");

    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification: any) => {
        logger.info("Notification received in foreground", {
          title: notification.request.content.title,
          data: notification.request.content.data,
        });
      });

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response: any) => {
        logger.info("Notification response received", {
          data: response.notification.request.content.data,
        });
        NotificationService.handleNotificationResponse(response);
      });

    logger.info("Notification listeners active");

    return () => {
      logger.info("Cleaning up notification listeners");
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  } catch (error) {
    logger.error("Failed to setup notification listeners", error);
    return () => {};
  }
}

export function subscribeToNavigationEvents(
  callback: (event: NotificationNavigationEvent) => void
): () => void {
  // Placeholder for navigation events
  return () => {};
}
