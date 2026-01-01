// src/core/integration/gameFlowManager.ts
// ============================================================================
// CENTRAL INTEGRATION HUB
// Orchestrates: Deck → AI → Gamification → SRS → State
// ============================================================================

import { Card, Loadout, SessionSummary } from "../../types";
import { DeckService } from "../../features/deck/deckService";
import { ReviewScheduler } from "../../features/spaced-rep/reviewScheduler";
import { AchievementTracker } from "../../features/gamification/achievementTracker";
import { SessionManager } from "../../features/gamification/sessionManager";
import { StreakManager } from "../../features/gamification/streakManager";
import {
  calculateXP,
  isSpeedBonusEligible,
} from "../../features/gamification/xpCalculator";
import { logger } from "../../utils/logger";
import { performanceMonitor } from "../../utils/performance";

export interface GameFlowConfig {
  userId: string;
  loadout: Loadout;
  sessionLength: number;
}

export interface CardResult {
  card: Card;
  correct: boolean;
  responseTime: number;
  xpEarned: number;
}

/**
 * GameFlowManager
 *
 * Central orchestrator yang menghubungkan semua sistem:
 * - Deck management & AI generation
 * - Gamification (XP, levels, achievements)
 * - Spaced repetition (SRS)
 * - Session tracking
 * - Streak management
 */
export class GameFlowManager {
  private deckService: DeckService;
  private reviewScheduler: ReviewScheduler;
  private achievementTracker: AchievementTracker;
  private sessionManager: SessionManager;
  private streakManager: StreakManager;

  private sessionId: string | null = null;
  private cardResults: CardResult[] = [];

  constructor(private config: GameFlowConfig) {
    this.deckService = new DeckService();
    this.reviewScheduler = new ReviewScheduler();
    this.achievementTracker = new AchievementTracker(config.userId);
    this.sessionManager = new SessionManager(config.userId);
    this.streakManager = new StreakManager(config.userId);

    logger.info("GameFlowManager initialized", {
      userId: config.userId,
      loadout: config.loadout,
    });
  }

  // ========================================
  // SESSION LIFECYCLE
  // ========================================

  /**
   * Start new session
   * - Initializes session tracking
   * - Loads initial card batch
   * - Updates streak
   */
  async startSession(): Promise<{ sessionId: string; cards: Card[] }> {
    try {
      logger.info("Starting new session", { loadout: this.config.loadout });

      // Start session tracking
      this.sessionId = await performanceMonitor.measureAsync(
        "session_start",
        () =>
          this.sessionManager.startSession(
            this.config.loadout.language,
            this.config.loadout.difficulty
          )
      );

      logger.info("Session started", { sessionId: this.sessionId });

      // Update streak
      await this.streakManager.recordActivity();
      logger.info("Streak updated");

      // Load initial cards
      const cards = await performanceMonitor.measureAsync("load_cards", () =>
        this.deckService.fetchCards(
          this.config.loadout,
          this.config.sessionLength
        )
      );

      logger.info("Initial cards loaded", {
        count: cards.length,
        types: [...new Set(cards.map((c) => c.type))],
      });

      return { sessionId: this.sessionId!, cards };
    } catch (error) {
      logger.error("Failed to start session", error);
      throw error;
    }
  }

  /**
   * Process card result
   * - Calculate XP
   * - Update SRS
   * - Track achievements
   * - Record stats
   */
  async processCardResult(
    card: Card,
    correct: boolean,
    responseTime: number,
    currentCombo: number
  ): Promise<{
    xpEarned: number;
    unlockedAchievements: any[];
    leveledUp: boolean;
  }> {
    try {
      logger.debug("Processing card result", {
        cardId: card.id,
        correct,
        responseTime,
        combo: currentCombo,
      });

      // Calculate XP with bonuses
      const isSpeedBonus = isSpeedBonusEligible(responseTime, card.difficulty);

      const xpBreakdown = calculateXP({
        baseXP: 20,
        combo: currentCombo,
        difficulty: card.difficulty,
        isSpeedBonus,
        isReviewMode: false,
      });

      logger.info("XP calculated", {
        breakdown: xpBreakdown,
        isSpeedBonus,
      });

      // Update SRS system
      if (correct) {
        await this.reviewScheduler.recordReview(card.id, true, responseTime);
        logger.debug("Review recorded: correct");
      } else {
        await this.reviewScheduler.addToReviewDeck(card);
        await this.reviewScheduler.recordReview(card.id, false, responseTime);
        logger.debug("Review recorded: wrong, added to review deck");
      }

      // Track card result
      this.cardResults.push({
        card,
        correct,
        responseTime,
        xpEarned: xpBreakdown.total,
      });

      // Check achievements
      const unlockedAchievements = await this.checkAchievements();

      if (unlockedAchievements.length > 0) {
        logger.info("Achievements unlocked!", {
          count: unlockedAchievements.length,
          achievements: unlockedAchievements.map((a) => a.name),
        });
      }

      return {
        xpEarned: xpBreakdown.total,
        unlockedAchievements,
        leveledUp: false, // Will be checked in store
      };
    } catch (error) {
      logger.error("Failed to process card result", error);
      throw error;
    }
  }

  /**
   * End session
   * - Calculate summary
   * - Update session stats
   * - Check achievements
   * - Clear cache
   */
  async endSession(): Promise<SessionSummary> {
    try {
      if (!this.sessionId) {
        throw new Error("No active session");
      }

      logger.info("Ending session", {
        sessionId: this.sessionId,
        cardsProcessed: this.cardResults.length,
      });

      // Calculate stats
      const correct = this.cardResults.filter((r) => r.correct).length;
      const wrong = this.cardResults.filter((r) => !r.correct).length;
      const totalXP = this.cardResults.reduce((sum, r) => sum + r.xpEarned, 0);
      const maxCombo = this.calculateMaxCombo();

      // End session in manager
      const summary = await this.sessionManager.endSession({
        correct,
        wrong,
        maxCombo,
        xpEarned: totalXP,
      });

      logger.info("Session ended", { summary });

      // Final achievement check
      await this.checkAchievements();

      // Cleanup
      this.sessionId = null;
      this.cardResults = [];

      // Clear old cache (run in background)
      setTimeout(() => {
        this.deckService.clearOldCache().catch((err) => {
          logger.warn("Failed to clear old cache", err);
        });
      }, 1000);

      return summary;
    } catch (error) {
      logger.error("Failed to end session", error);
      throw error;
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Calculate max combo from card results
   */
  private calculateMaxCombo(): number {
    let maxCombo = 0;
    let currentCombo = 0;

    for (const result of this.cardResults) {
      if (result.correct) {
        currentCombo++;
        maxCombo = Math.max(maxCombo, currentCombo);
      } else {
        currentCombo = 0;
      }
    }

    return maxCombo;
  }

  /**
   * Check for unlocked achievements
   */
  private async checkAchievements(): Promise<any[]> {
    try {
      // Build stats from current session + history
      const sessionStats = await this.sessionManager.getSessionStats();

      const stats = {
        totalSessions: sessionStats.totalSessions,
        totalCardsSwiped: sessionStats.totalCards,
        totalCorrect: this.cardResults.filter((r) => r.correct).length,
        totalWrong: this.cardResults.filter((r) => !r.correct).length,
        maxCombo: this.calculateMaxCombo(),
        dailyStreak: 0, // Will be fetched from profile
        longestStreak: 0,
        currentLevel: 1, // Will be fetched from profile
        masteryScores: {},
        perfectSessions: 0,
        currentSessionStats: {
          total: this.cardResults.length,
          correct: this.cardResults.filter((r) => r.correct).length,
          combo: this.calculateMaxCombo(),
        },
      };

      const unlocked = await this.achievementTracker.checkAchievements(stats);

      return unlocked;
    } catch (error) {
      logger.error("Failed to check achievements", error);
      return [];
    }
  }

  /**
   * Prefetch next batch of cards
   */
  async prefetchCards(): Promise<void> {
    try {
      logger.info("Prefetching cards");
      await this.deckService.prefetchCards(this.config.loadout, 5);
      logger.info("Prefetch completed");
    } catch (error) {
      logger.warn("Prefetch failed", error as any);
    }
  }

  /**
   * Get session progress
   */
  getProgress(): {
    cardsProcessed: number;
    correct: number;
    wrong: number;
    accuracy: number;
  } {
    const correct = this.cardResults.filter((r) => r.correct).length;
    const wrong = this.cardResults.filter((r) => !r.correct).length;
    const total = this.cardResults.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      cardsProcessed: total,
      correct,
      wrong,
      accuracy,
    };
  }

  /**
   * Get review stats
   */
  async getReviewStats() {
    return await this.reviewScheduler.getReviewStats();
  }

  /**
   * Get streak info
   */
  async getStreakInfo() {
    return await this.streakManager.getStreakInfo();
  }
}

// ============================================================================
// SINGLETON FACTORY
// ============================================================================

let currentGameFlow: GameFlowManager | null = null;

export function createGameFlow(config: GameFlowConfig): GameFlowManager {
  if (currentGameFlow) {
    logger.warn("Game flow already exists, replacing");
  }

  currentGameFlow = new GameFlowManager(config);
  return currentGameFlow;
}

export function getCurrentGameFlow(): GameFlowManager | null {
  return currentGameFlow;
}

export function destroyGameFlow(): void {
  currentGameFlow = null;
  logger.info("Game flow destroyed");
}
