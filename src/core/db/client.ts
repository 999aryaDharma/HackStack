// src/core/db/client.ts
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";
import { logger } from "../../utils/validation";

const expoDb = openDatabaseSync("hackstack.db");

export const db = drizzle(expoDb, { schema });

// Run migrations on app start
export async function runMigrations() {
  try {
    // Manual migration karena drizzle-kit tidak support Expo SQLite
    // Kita akan membuat tabel secara manual

    logger.info("Running database migrations...");

    // Create profiles table
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        current_xp INTEGER DEFAULT 0 NOT NULL,
        current_level INTEGER DEFAULT 1 NOT NULL,
        current_title TEXT DEFAULT 'Script Kiddie' NOT NULL,
        total_cards_swiped INTEGER DEFAULT 0 NOT NULL,
        daily_streak INTEGER DEFAULT 0 NOT NULL,
        longest_streak INTEGER DEFAULT 0 NOT NULL,
        last_active_date TEXT,
        sound_enabled INTEGER DEFAULT 1 NOT NULL,
        haptics_enabled INTEGER DEFAULT 1 NOT NULL,
        theme TEXT DEFAULT 'dark' NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Create cards table
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        lang TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        explanation TEXT NOT NULL,
        roast TEXT DEFAULT '' NOT NULL,
        source TEXT DEFAULT 'ai' NOT NULL,
        ai_model TEXT,
        topic TEXT,
        created_at INTEGER NOT NULL,
        status TEXT DEFAULT 'new' NOT NULL,
        mastery_score INTEGER DEFAULT 0 NOT NULL,
        next_review INTEGER,
        interval_days INTEGER DEFAULT 1 NOT NULL,
        ease_factor REAL DEFAULT 2.5 NOT NULL,
        review_count INTEGER DEFAULT 0 NOT NULL,
        times_seen INTEGER DEFAULT 0 NOT NULL,
        times_correct INTEGER DEFAULT 0 NOT NULL,
        times_wrong INTEGER DEFAULT 0 NOT NULL,
        avg_response_time INTEGER
      )
    `);

    // Create sessions table
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        language TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        mode TEXT DEFAULT 'arcade' NOT NULL,
        cards_total INTEGER DEFAULT 0 NOT NULL,
        cards_correct INTEGER DEFAULT 0 NOT NULL,
        cards_wrong INTEGER DEFAULT 0 NOT NULL,
        cards_skipped INTEGER DEFAULT 0 NOT NULL,
        max_combo INTEGER DEFAULT 0 NOT NULL,
        xp_earned INTEGER DEFAULT 0 NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        duration_ms INTEGER,
        synced INTEGER DEFAULT 0 NOT NULL
      )
    `);

    // Create achievements table
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        achievement_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        rarity TEXT NOT NULL,
        xp_reward INTEGER NOT NULL,
        is_unlocked INTEGER DEFAULT 0 NOT NULL,
        progress_current INTEGER DEFAULT 0 NOT NULL,
        progress_target INTEGER NOT NULL,
        unlocked_at INTEGER
      )
    `);

    // Create indexes
    expoDb.execSync(`CREATE INDEX IF NOT EXISTS idx_cards_lang ON cards(lang)`);
    expoDb.execSync(
      `CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status)`
    );
    expoDb.execSync(
      `CREATE INDEX IF NOT EXISTS idx_cards_next_review ON cards(next_review)`
    );

    logger.info("Migrations completed successfully");
  } catch (error) {
    logger.error("Migration failed", error);
    throw error;
  }
}

// Seed initial data
export async function seedDatabase() {
  try {
    // Check if already seeded
    const result = expoDb.getAllSync("SELECT * FROM profiles LIMIT 1");

    if (result.length === 0) {
      const now = Date.now();

      // Create default profile
      expoDb.runSync(
        `INSERT INTO profiles (
          user_id, current_xp, current_level, current_title, 
          total_cards_swiped, daily_streak, longest_streak,
          sound_enabled, haptics_enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ["default-user", 0, 1, "Script Kiddie", 0, 0, 0, 1, 1, now, now]
      );

      logger.info("Database seeded successfully");
    }
  } catch (error) {
    logger.error("Seeding failed", error);
  }
}
