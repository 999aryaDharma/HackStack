// src/features/gamification/sessionManager.ts
import { db } from "../../core/db/client";
import { sessions, profiles } from "../../core/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "../../utils/validation";

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
  startedAt: number; // Unix timestamp
  endedAt?: number;
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

export class SessionManager {
  private userId: string;
  private currentSessionId: string | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  async startSession(language: string, difficulty: string): Promise<string> {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    try {
      await db.insert(sessions).values({
        id: sessionId,
        userId: this.userId,
        language,
        difficulty,
        mode: "arcade",
        cardsTotal: 0,
        cardsCorrect: 0,
        cardsWrong: 0,
        cardsSkipped: 0,
        maxCombo: 0,
        xpEarned: 0,
        startedAt: now,
        endedAt: undefined,
        durationMs: undefined,
        synced: false,
      });

      this.currentSessionId = sessionId;
      logger.debug(`Session started: ${sessionId}`);

      return sessionId;
    } catch (error) {
      logger.error("Failed to start session", error);
      throw error;
    }
  }

  async endSession(stats: {
    correct: number;
    wrong: number;
    maxCombo: number;
    xpEarned: number;
  }): Promise<SessionSummary> {
    if (!this.currentSessionId) {
      throw new Error("No active session");
    }

    const endedAt = Date.now();

    try {
      // Get session start time
      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, this.currentSessionId))
        .limit(1);

      if (session.length === 0) {
        throw new Error("Session not found");
      }

      const startedAt = session[0].startedAt;
      const durationMs = endedAt - startedAt;

      // Update session
      await db
        .update(sessions)
        .set({
          cardsTotal: stats.correct + stats.wrong,
          cardsCorrect: stats.correct,
          cardsWrong: stats.wrong,
          maxCombo: stats.maxCombo,
          xpEarned: stats.xpEarned,
          endedAt,
          durationMs,
        })
        .where(eq(sessions.id, this.currentSessionId));

      // Update profile stats
      await this.updateProfileStats(
        stats.xpEarned,
        stats.correct + stats.wrong
      );

      const summary: SessionSummary = {
        totalCards: stats.correct + stats.wrong,
        correct: stats.correct,
        wrong: stats.wrong,
        accuracy:
          stats.correct + stats.wrong > 0
            ? (stats.correct / (stats.correct + stats.wrong)) * 100
            : 0,
        maxCombo: stats.maxCombo,
        xpEarned: stats.xpEarned,
        duration: durationMs,
        perfectSession:
          stats.correct > 0 && stats.wrong === 0 && stats.correct >= 5,
      };

      logger.debug("Session ended", summary);
      this.currentSessionId = null;

      return summary;
    } catch (error) {
      logger.error("Failed to end session", error);
      throw error;
    }
  }

  private async updateProfileStats(
    xpEarned: number,
    cardsSwiped: number
  ): Promise<void> {
    try {
      const now = Date.now();

      const profile = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, this.userId))
        .limit(1);

      if (profile.length === 0) {
        logger.warn("Profile not found, creating new one");

        await db.insert(profiles).values({
          userId: this.userId,
          currentXP: xpEarned,
          currentLevel: 1,
          currentTitle: "Script Kiddie",
          totalCardsSwiped: cardsSwiped,
          dailyStreak: 0,
          longestStreak: 0,
          lastActiveDate: undefined,
          soundEnabled: true,
          hapticsEnabled: true,
          theme: "dark",
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await db
          .update(profiles)
          .set({
            currentXP: profile[0].currentXP + xpEarned,
            totalCardsSwiped: profile[0].totalCardsSwiped + cardsSwiped,
            updatedAt: now,
          })
          .where(eq(profiles.userId, this.userId));
      }
    } catch (error) {
      logger.error("Failed to update profile stats", error);
    }
  }

  async getSessionHistory(limit: number = 10): Promise<SessionData[]> {
    const history = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, this.userId))
      .limit(limit);

    return history as SessionData[];
  }

  async getSessionStats(): Promise<{
    totalSessions: number;
    totalCards: number;
    totalXP: number;
    averageAccuracy: number;
  }> {
    const allSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, this.userId));

    const totalSessions = allSessions.length;
    const totalCards = allSessions.reduce((sum, s) => sum + s.cardsTotal, 0);
    const totalCorrect = allSessions.reduce(
      (sum, s) => sum + s.cardsCorrect,
      0
    );
    const totalXP = allSessions.reduce((sum, s) => sum + s.xpEarned, 0);

    const averageAccuracy =
      totalCards > 0 ? (totalCorrect / totalCards) * 100 : 0;

    return {
      totalSessions,
      totalCards,
      totalXP,
      averageAccuracy: Math.round(averageAccuracy),
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
