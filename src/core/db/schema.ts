// src/core/db/schema.ts
// ============================================================================
// DATABASE SCHEMA DEFINITIONS
// SQLite tables using Drizzle ORM
// ============================================================================

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Helper untuk timestamp default
const timestamp = () => sql`(cast(unixepoch() as integer))`;

// ============================================================================
// USER PROFILE TABLE
// ============================================================================
export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").unique().notNull(),

  // Progress
  currentXP: integer("current_xp").default(0).notNull(),
  currentLevel: integer("current_level").default(1).notNull(),
  currentTitle: text("current_title").default("Script Kiddie").notNull(),
  totalCardsSwiped: integer("total_cards_swiped").default(0).notNull(),

  // Streaks
  dailyStreak: integer("daily_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastActiveDate: text("last_active_date"), // ISO string

  // Settings
  soundEnabled: integer("sound_enabled", { mode: "boolean" })
    .default(true)
    .notNull(),
  hapticsEnabled: integer("haptics_enabled", { mode: "boolean" })
    .default(true)
    .notNull(),
  theme: text("theme").default("dark").notNull(),

  // Metadata
  createdAt: integer("created_at").default(timestamp()).notNull(),
  updatedAt: integer("updated_at").default(timestamp()).notNull(),
});

// ============================================================================
// CARDS TABLE
// ============================================================================
export const cards = sqliteTable("cards", {
  id: text("id").primaryKey(),

  // Content
  type: text("type").notNull(), // snippet | quiz | trivia
  lang: text("lang").notNull(), // JS | TS | Python | Go
  difficulty: text("difficulty").notNull(), // easy | medium | hard | god
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  explanation: text("explanation").notNull(),
  roast: text("roast").default("").notNull(),

  // Metadata
  source: text("source").default("ai").notNull(), // ai | bundled | community
  aiModel: text("ai_model"),
  topic: text("topic"),
  createdAt: integer("created_at").default(timestamp()).notNull(),

  // SRS (Spaced Repetition System)
  status: text("status").default("new").notNull(), // new | learning | review | mastered
  masteryScore: integer("mastery_score").default(0).notNull(),
  nextReview: integer("next_review"), // Unix timestamp
  intervalDays: integer("interval_days").default(1).notNull(),
  easeFactor: real("ease_factor").default(2.5).notNull(),
  reviewCount: integer("review_count").default(0).notNull(),

  // Statistics
  timesSeen: integer("times_seen").default(0).notNull(),
  timesCorrect: integer("times_correct").default(0).notNull(),
  timesWrong: integer("times_wrong").default(0).notNull(),
  avgResponseTime: integer("avg_response_time"), // Milliseconds
});

// ============================================================================
// SESSIONS TABLE
// ============================================================================
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),

  // Configuration
  language: text("language").notNull(),
  difficulty: text("difficulty").notNull(),
  mode: text("mode").default("arcade").notNull(), // arcade | review | challenge

  // Statistics
  cardsTotal: integer("cards_total").default(0).notNull(),
  cardsCorrect: integer("cards_correct").default(0).notNull(),
  cardsWrong: integer("cards_wrong").default(0).notNull(),
  cardsSkipped: integer("cards_skipped").default(0).notNull(),
  maxCombo: integer("max_combo").default(0).notNull(),
  xpEarned: integer("xp_earned").default(0).notNull(),

  // Timing
  startedAt: integer("started_at").notNull(),
  endedAt: integer("ended_at"),
  durationMs: integer("duration_ms"),

  // Sync status
  synced: integer("synced", { mode: "boolean" }).default(false).notNull(),
});

// ============================================================================
// ACHIEVEMENTS TABLE
// ============================================================================
export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),

  // Achievement info
  achievementId: text("achievement_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // progress | skill | streak | mastery
  rarity: text("rarity").notNull(), // common | rare | epic | legendary
  xpReward: integer("xp_reward").notNull(),

  // Progress
  isUnlocked: integer("is_unlocked", { mode: "boolean" })
    .default(false)
    .notNull(),
  progressCurrent: integer("progress_current").default(0).notNull(),
  progressTarget: integer("progress_target").notNull(),
  unlockedAt: integer("unlocked_at"), // Unix timestamp
});

// ============================================================================
// CARD INTERACTIONS TABLE (Analytics)
// ============================================================================
export const cardInteractions = sqliteTable("card_interactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  cardId: text("card_id").notNull(),
  sessionId: text("session_id").notNull(),

  // Interaction data
  action: text("action").notNull(), // correct | wrong | skip
  responseTimeMs: integer("response_time_ms").notNull(),
  comboCount: integer("combo_count").default(0).notNull(),
  userAnswer: text("user_answer"), // For quiz types

  // Timestamp
  createdAt: integer("created_at").default(timestamp()).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;

export type CardInteraction = typeof cardInteractions.$inferSelect;
export type NewCardInteraction = typeof cardInteractions.$inferInsert;
