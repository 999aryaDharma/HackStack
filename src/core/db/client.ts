// src/core/db/client.ts
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite/next";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import * as schema from "./schema";

const expoDb = openDatabaseSync("hackstack.db");

export const db = drizzle(expoDb, { schema });

// Run migrations on app start
export async function runMigrations() {
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Seed initial data
export async function seedDatabase() {
  const { profiles } = schema;

  try {
    // Check if already seeded
    const existing = await db.select().from(profiles).limit(1);

    if (existing.length === 0) {
      // Create default profile
      await db.insert(profiles).values({
        userId: "default-user",
        currentXP: 0,
        currentLevel: 1,
        currentTitle: "Script Kiddie",
        totalCardsSwiped: 0,
        dailyStreak: 0,
        longestStreak: 0,
        soundEnabled: true,
        hapticsEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("Database seeded successfully");
    }
  } catch (error) {
    console.error("Seeding failed:", error);
  }
}
