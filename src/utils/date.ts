// src/utils/date.ts

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const isPast = diff < 0;
  const prefix = isPast ? "" : "in ";
  const suffix = isPast ? " ago" : "";

  if (seconds < 60) {
    return "just now";
  }

  if (minutes < 60) {
    return `${prefix}${minutes} ${
      minutes === 1 ? "minute" : "minutes"
    }${suffix}`;
  }

  if (hours < 24) {
    return `${prefix}${hours} ${hours === 1 ? "hour" : "hours"}${suffix}`;
  }

  if (days < 7) {
    return `${prefix}${days} ${days === 1 ? "day" : "days"}${suffix}`;
  }

  if (weeks < 4) {
    return `${prefix}${weeks} ${weeks === 1 ? "week" : "weeks"}${suffix}`;
  }

  if (months < 12) {
    return `${prefix}${months} ${months === 1 ? "month" : "months"}${suffix}`;
  }

  return `${prefix}${years} ${years === 1 ? "year" : "years"}${suffix}`;
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is overdue
 */
export function isOverdue(date: Date): boolean {
  return date < new Date();
}

/**
 * Get days until date
 */
export function getDaysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get start of day
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get end of day
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Format duration in milliseconds to readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
}

/**
 * Check if user should maintain streak (grace period until 5am)
 */
export function isWithinStreakGracePeriod(): boolean {
  const now = new Date();
  const hour = now.getHours();

  // Grace period: midnight to 5am
  return hour >= 0 && hour < 5;
}
