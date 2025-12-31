// src/types/index.ts
// ============================================================================
// CORE TYPE DEFINITIONS
// Centralized type exports untuk seluruh aplikasi
// ============================================================================

// Card Types
export type CardType = "snippet" | "quiz" | "trivia";
export type Language = "JS" | "TS" | "Python" | "Go";
export type Difficulty = "easy" | "medium" | "hard" | "god";
export type CardStatus = "new" | "learning" | "review" | "mastered";
export type CardSource = "ai" | "bundled" | "community" | "session";

export interface Card {
  id: string;
  type: CardType;
  lang: Language;
  difficulty: Difficulty;
  question: string;
  answer: string;
  explanation: string;
  roast: string;
}

export interface CardWithMeta extends Card {
  source: CardSource;
  aiModel?: string;
  createdAt: Date;
  status: CardStatus;
  masteryScore: number;
  nextReview?: Date;
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
  timesSeen: number;
  timesCorrect: number;
  timesWrong: number;
  avgResponseTime?: number;
}

// User Types
export interface UserProfile {
  id: number;
  userId: string;
  currentXP: number;
  currentLevel: number;
  currentTitle: string;
  totalCardsSwiped: number;
  dailyStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  combo: number;
  title: string;
}

// Session Types
export interface SessionConfig {
  language: Language;
  topics: string[];
  difficulty: Difficulty;
  sessionLength: number;
  mode: "arcade" | "review" | "challenge";
}

export interface SessionStats {
  correct: number;
  wrong: number;
  skipped: number;
  startTime: number;
  endTime?: number;
  maxCombo?: number;
  xpEarned?: number;
}

export interface SessionData {
  id: string;
  userId: string;
  language: string;
  difficulty: string;
  cardsTotal: number;
  cardsCorrect: number;
  cardsWrong: number;
  maxCombo: number;
  xpEarned: number;
  startedAt: Date;
  endedAt?: Date;
  durationMs?: number;
}

export interface SessionSummary {
  totalCards: number;
  correct: number;
  wrong: number;
  accuracy: number;
  maxCombo: number;
  xpEarned: number;
  duration: number;
  perfectSession: boolean;
}

// Gamification Types
export interface XPBreakdown {
  base: number;
  comboBonus: number;
  difficultyBonus: number;
  speedBonus: number;
  total: number;
}

export interface AchievementData {
  id: string;
  userId: string;
  achievementId: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  xpReward: number;
  isUnlocked: boolean;
  progressCurrent: number;
  progressTarget: number;
  unlockedAt?: Date;
}

// Review/SRS Types
export interface ReviewCard extends CardWithMeta {
  firstFailed: Date;
  attempts: number;
}

export interface SRSState {
  interval: number;
  easeFactor: number;
  repetitions: number;
}

export interface ReviewQuality {
  quality: number;
  responseTime?: number;
}

// AI Generation Types
export interface GenerateRequest {
  language: Language;
  topics?: string[];
  difficulty: Difficulty;
  count: number;
  previousTopics?: string[];
  userMasteryScores?: Record<string, number>;
}

export interface GenerateResponse {
  cards: Card[];
  metadata: {
    generatedAt: number;
    modelVersion: string;
    promptTokens: number;
  };
}

// API Types
export interface ApiError {
  message: string;
  code: string;
  statusCode?: number;
}

// UI Types
export interface Loadout {
  language: Language;
  topics: string[];
  difficulty: Difficulty;
  sessionLength: number;
}

export interface Theme {
  id: "dark" | "light" | "cyberpunk";
  name: string;
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    accent: {
      green: string;
      red: string;
      blue: string;
      purple: string;
      yellow: string;
      cyan: string;
    };
    text: {
      primary: string;
      secondary: string;
      code: string;
      inverse: string;
    };
  };
}

// Streak Types
export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  isActiveToday: boolean;
  gracePeriodActive: boolean;
  nextDeadline: Date;
}

// Achievement Types
export type AchievementCategory =
  | "progress"
  | "skill"
  | "streak"
  | "mastery"
  | "social"
  | "special";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  xpReward: number;
  hidden?: boolean;
  condition: (stats: UserAchievementStats) => boolean;
}

export interface UserAchievementStats {
  totalSessions: number;
  totalCardsSwiped: number;
  totalCorrect: number;
  totalWrong: number;
  maxCombo: number;
  dailyStreak: number;
  longestStreak: number;
  currentLevel: number;
  masteryScores: Record<string, number>;
  perfectSessions: number;
  currentSessionStats?: {
    total: number;
    correct: number;
    combo: number;
  };
}
