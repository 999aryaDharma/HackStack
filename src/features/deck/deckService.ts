// src/features/deck/deckService.ts
import { Card, Difficulty } from "../../types";
import { getGeminiClient } from "../../core/ai/geminiClient";
import { db } from "../../core/db/client";
import { cards } from "../../core/db/schema";
import { eq, and, inArray, gte } from "drizzle-orm";
import { logger } from "../../utils/logger";
import { Loadout } from "../../store/slices/deckSlice";

export class DeckService {
  private geminiClient = getGeminiClient();

  /**
   * Fetch cards for a session
   * Priority: Cache > AI Generation > Bundled Fallback
   */
  async fetchCards(loadout: Loadout, count: number = 10): Promise<Card[]> {
    try {
      // 1. Try to get from cache
      const cachedCards = await this.getCachedCards(loadout, count);

      if (cachedCards.length >= count) {
        logger.debug(`Using ${cachedCards.length} cached cards`);
        return cachedCards.slice(0, count);
      }

      // 2. Generate new cards if needed
      const needed = count - cachedCards.length;
      logger.debug(`Generating ${needed} new cards`);

      const newCards = await this.geminiClient.generateCards({
        language: loadout.language,
        topics: loadout.topics,
        difficulty: loadout.difficulty,
        count: needed,
        previousTopics: [], // TODO: Track recent topics
      });

      // 3. Save new cards to cache
      await this.saveToCache(newCards);

      // 4. Combine cached + new
      return [...cachedCards, ...newCards].slice(0, count);
    } catch (error) {
      logger.error("Failed to fetch cards", error);

      // Fallback to bundled cards
      return this.getBundledCards(loadout, count);
    }
  }

  /**
   * Get cards from SQLite cache
   */
  private async getCachedCards(
    loadout: Loadout,
    limit: number
  ): Promise<Card[]> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const cachedCards = await db
      .select()
      .from(cards)
      .where(
        and(
          eq(cards.lang, loadout.language),
          eq(cards.difficulty, loadout.difficulty),
          eq(cards.source, "ai"),
          gte(cards.createdAt, oneWeekAgo)
        )
      )
      .limit(limit);

    return cachedCards.map(this.dbToCard);
  }

  /**
   * Save cards to cache
   */
  private async saveToCache(newCards: Card[]): Promise<void> {
    try {
      await db.insert(cards).values(
        newCards.map((card) => ({
          id: card.id,
          type: card.type,
          lang: card.lang,
          difficulty: card.difficulty,
          question: card.question,
          answer: card.answer,
          explanation: card.explanation,
          roast: card.roast || "",
          source: "ai",
          createdAt: new Date(),
          status: "new",
          masteryScore: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          reviewCount: 0,
          timesSeen: 0,
          timesCorrect: 0,
          timesWrong: 0,
        }))
      );

      logger.debug(`Saved ${newCards.length} cards to cache`);
    } catch (error) {
      logger.error("Failed to save cards to cache", error);
    }
  }

  /**
   * Get bundled fallback cards
   */
  private async getBundledCards(
    loadout: Loadout,
    limit: number
  ): Promise<Card[]> {
    const bundledCards = await db
      .select()
      .from(cards)
      .where(and(eq(cards.lang, loadout.language), eq(cards.source, "bundled")))
      .limit(limit);

    return bundledCards.map(this.dbToCard);
  }

  /**
   * Clear old cache entries (30+ days)
   */
  async clearOldCache(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    await db
      .delete(cards)
      .where(and(eq(cards.source, "ai"), gte(cards.createdAt, thirtyDaysAgo)));

    logger.debug("Cleared old cache");
  }

  /**
   * Prefetch cards in background
   */
  async prefetchCards(loadout: Loadout, count: number = 5): Promise<void> {
    try {
      const newCards = await this.geminiClient.generateCards({
        language: loadout.language,
        topics: loadout.topics,
        difficulty: loadout.difficulty,
        count,
        previousTopics: [],
      });

      await this.saveToCache(newCards);
      logger.debug(`Prefetched ${count} cards`);
    } catch (error) {
      logger.error("Prefetch failed", error);
    }
  }

  /**
   * Helper: Convert DB record to Card type
   */
  private dbToCard(dbCard: any): Card {
    return {
      id: dbCard.id,
      type: dbCard.type,
      lang: dbCard.lang,
      difficulty: dbCard.difficulty,
      question: dbCard.question,
      answer: dbCard.answer,
      explanation: dbCard.explanation,
      roast: dbCard.roast || "",
    };
  }
}
