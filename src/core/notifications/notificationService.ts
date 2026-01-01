/**
 * Notification Service
 *
 * Manages push notifications for:
 * - Review reminders (cards due)
 * - Streak notifications
 * - Achievement unlocks
 * - Session reminders
 */

import * as Notifications from "expo-notifications";
import { logger } from "../../utils/logger";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSchedule {
  id: string;
  type: "review" | "streak" | "achievement" | "session";
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledFor?: number; // Unix timestamp
  sent: boolean;
  createdAt: number;
}

export class NotificationService {
  private userId: string;
  private reviewReminderScheduled = false;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();

      if (status === "granted") {
        return true;
      }

      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();

      return newStatus === "granted";
    } catch (error) {
      logger.error("Failed to request notification permissions", error);
      return false;
    }
  }

  /**
   * Schedule review reminder notification
   * - Notifies user when cards are due
   * - Scheduled for user's typical usage hour
   * - Skips if user already reviewed today
   */
  async scheduleReviewReminder(dueCardCount: number): Promise<void> {
    if (this.reviewReminderScheduled) return;

    try {
      // Check if user has already reviewed today
      const lastReviewDate = await AsyncStorage.getItem(
        `lastReview_${this.userId}`
      );
      const today = new Date().toDateString();

      if (lastReviewDate === today) {
        logger.debug("User already reviewed today, skipping reminder");
        return;
      }

      // Get user's typical usage hour (default 8am)
      const usageHour = await this.getUserPreferredHour();

      // Schedule for next occurrence of that hour
      const notificationTime = this.getNextOccurrenceTime(usageHour);
      const secondsFromNow = (notificationTime.getTime() - Date.now()) / 1000;

      if (secondsFromNow > 0) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Time to Review! 🎯",
            body: `${dueCardCount} cards are waiting for you. Crush them!`,
            sound: "default",
            badge: dueCardCount,
            data: {
              type: "review",
              cardCount: dueCardCount,
            },
          },
          trigger:
            Math.ceil(secondsFromNow) > 0
              ? ({
                  type: Notifications.SchedulableTriggerInputTypes
                    .TIME_INTERVAL,
                  seconds: Math.ceil(secondsFromNow),
                } as Notifications.TimeIntervalTriggerInput)
              : null,
        });

        logger.info("Review reminder scheduled", {
          time: notificationTime,
          cardCount: dueCardCount,
        });

        this.reviewReminderScheduled = true;
      }
    } catch (error) {
      logger.error("Failed to schedule review reminder", error);
    }
  }

  /**
   * Send achievement notification
   */
  async notifyAchievementUnlock(
    achievementName: string,
    xpReward: number
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🏆 Achievement Unlocked!",
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
    } catch (error) {
      logger.error("Failed to send achievement notification", error);
    }
  }

  /**
   * Send streak notification
   */
  async notifyStreakMilestone(streakDays: number): Promise<void> {
    try {
      const milestone = streakDays % 7 === 0 && streakDays % 30 !== 0;

      if (milestone) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🔥 Streak Milestone!",
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
      }
    } catch (error) {
      logger.error("Failed to send streak notification", error);
    }
  }

  /**
   * Send level up notification
   */
  async notifyLevelUp(newLevel: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⬆️ Level Up!",
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
    } catch (error) {
      logger.error("Failed to send level up notification", error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.reviewReminderScheduled = false;
      logger.debug("All notifications cancelled");
    } catch (error) {
      logger.error("Failed to cancel notifications", error);
    }
  }

  /**
   * Get user's preferred notification hour
   */
  private async getUserPreferredHour(): Promise<number> {
    try {
      const hour = await AsyncStorage.getItem(
        `notificationHour_${this.userId}`
      );
      return hour ? parseInt(hour) : 8; // Default 8am
    } catch {
      return 8;
    }
  }

  /**
   * Calculate next occurrence of a specific hour
   */
  private getNextOccurrenceTime(hour: number): Date {
    const now = new Date();
    const next = new Date(now);

    next.setHours(hour, 0, 0, 0);

    // If time already passed today, schedule for tomorrow
    if (next < now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Handle notification response with navigation
   */
  static handleNotificationResponse(
    response: Notifications.NotificationResponse,
    router?: any
  ) {
    const { data } = response.notification.request.content;

    logger.info("Notification tapped", { type: data?.type as string });

    // Handle based on notification type
    if (router) {
      switch (data?.type) {
        case "review":
          // Navigate to review screen
          router.push("/dungeon");
          break;
        case "achievement":
          // Navigate to achievements screen
          router.push("/(tabs)/profile");
          break;
        case "streak":
          // Navigate to profile/streak screen
          router.push("/(tabs)/profile");
          break;
        case "level_up":
          // Show celebration animation
          break;
      }
    }
  }
}

/**
 * Setup notification listeners with navigation support
 */
export function setupNotificationListeners(router?: any) {
  // Handle notifications received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      logger.debug("Notification received", {
        title: notification.request.content.title || "unknown",
      });
    }
  );

  // Handle notification taps
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      NotificationService.handleNotificationResponse(response, router);
    });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}
