// src/core/notifications/notificationService.ts
/**
 * Notification Service - Fixed Version
 *
 * Manages push notifications without direct router dependency
 * Uses event emitter pattern for navigation
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

// Simple event emitter
class SimpleEventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }
}

// Event emitter for navigation
const navigationEmitter = new SimpleEventEmitter();

export interface NotificationNavigationEvent {
  type: "review" | "achievement" | "streak" | "level_up";
  data?: Record<string, any>;
}

export class NotificationService {
  private userId: string;
  private reviewReminderScheduled = false;

  constructor(userId: string) {
    this.userId = userId;
    logger.info("NotificationService initialized", { userId });
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
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

  /**
   * Schedule review reminder notification
   */
  async scheduleReviewReminder(dueCardCount: number): Promise<void> {
    if (this.reviewReminderScheduled) {
      logger.debug("Review reminder already scheduled, skipping");
      return;
    }

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
          time: notificationTime.toISOString(),
          cardCount: dueCardCount,
          secondsFromNow: Math.ceil(secondsFromNow),
        });

        this.reviewReminderScheduled = true;
      } else {
        logger.warn("Cannot schedule reminder in the past", {
          secondsFromNow,
        });
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

      logger.info("Achievement notification sent", {
        name: achievementName,
        xpReward,
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

        logger.info("Streak notification sent", { days: streakDays });
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

      logger.info("Level up notification sent", { level: newLevel });
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
      logger.info("All notifications cancelled");
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
   * Handle notification response
   * Emits event instead of directly navigating
   */
  static handleNotificationResponse(
    response: Notifications.NotificationResponse
  ) {
    const { data } = response.notification.request.content;

    logger.info("Notification tapped", { type: data?.type as string, data });

    // Emit navigation event
    const event: NotificationNavigationEvent = {
      type: (data?.type as any) || "review",
      data: data as Record<string, any>,
    };

    navigationEmitter.emit("navigate", event);
  }
}

/**
 * Setup notification listeners
 * Returns cleanup function
 */
export function setupNotificationListeners(): () => void {
  logger.info("Setting up notification listeners");

  // Handle notifications received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      logger.info("Notification received in foreground", {
        title: notification.request.content.title || "unknown",
        data: notification.request.content.data,
      });
    }
  );

  // Handle notification taps
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      logger.info("Notification response received", {
        data: response.notification.request.content.data,
      });
      NotificationService.handleNotificationResponse(response);
    });

  logger.info("Notification listeners active");

  // Return cleanup function
  return () => {
    logger.info("Cleaning up notification listeners");
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Subscribe to navigation events
 * Use this in components with router access
 */
export function subscribeToNavigationEvents(
  callback: (event: NotificationNavigationEvent) => void
): () => void {
  navigationEmitter.on("navigate", callback);

  return () => {
    navigationEmitter.off("navigate", callback);
  };
}

/**
 * Get notification emitter for testing
 */
export function getNavigationEmitter() {
  return navigationEmitter;
}
