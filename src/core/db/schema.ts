import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

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
  lastActiveDate: text("last_active_date"),

  // Settings
  soundEnabled: integer("sound_enabled", { mode: "boolean" }).default(true),
  hapticsEnabled: integer("haptics_enabled", { mode: "boolean" }).default(true),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const cards = sqliteTable("cards", {
  id: text("id").primaryKey(),

  // Content
  type: text("type").notNull(),
  lang: text("lang").notNull(),
  difficulty: text("difficulty").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  explanation: text("explanation").notNull(),
  roast: text("roast"),

  // Metadata
  source: text("source").default("ai"),
  aiModel: text("ai_model"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),

  // SRS
  status: text("status").default("new"),
  masteryScore: integer("mastery_score").default(0),
  nextReview: integer("next_review", { mode: "timestamp" }),
  intervalDays: integer("interval_days").default(1),
  easeFactor: real("ease_factor").default(2.5),
  reviewCount: integer("review_count").default(0),

  // Stats
  timesSeen: integer("times_seen").default(0),
  timesCorrect: integer("times_correct").default(0),
  timesWrong: integer("times_wrong").default(0),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),

  // Config
  language: text("language").notNull(),
  difficulty: text("difficulty").notNull(),

  // Stats
  cardsTotal: integer("cards_total").default(0),
  cardsCorrect: integer("cards_correct").default(0),
  cardsWrong: integer("cards_wrong").default(0),
  maxCombo: integer("max_combo").default(0),
  xpEarned: integer("xp_earned").default(0),

  // Timing
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  endedAt: integer("ended_at", { mode: "timestamp" }),
  durationMs: integer("duration_ms"),
});

export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),

  achievementId: text("achievement_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  rarity: text("rarity").notNull(),
  xpReward: integer("xp_reward").notNull(),

  isUnlocked: integer("is_unlocked", { mode: "boolean" }).default(false),
  progressCurrent: integer("progress_current").default(0),
  progressTarget: integer("progress_target").notNull(),
  unlockedAt: integer("unlocked_at", { mode: "timestamp" }),
});
