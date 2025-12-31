// src/features/spaced-rep/reviewScheduler.ts
import { db } from "../../core/db/client";
import { cards } from "../../core/db/schema";
import { lte, eq, and, isNull, or } from "drizzle-orm";
import { Card } from "../../types";
import {
  SRSState,
  calculateNextReview,
  getNextReviewDate,
  swipeToQuality,
  calculateMasteryScore,
  getCardStatus,
  createInitialSRSState,
} from "./srsAlgorithm";

export class ReviewScheduler {
  /**
   * Get cards due for review
   */
  async getDueCards(limit: number = 20): Promise<Card[]> {
    const nowTimestamp = Date.now();

    const dueCards = await db
      .select()
      .from(cards)
      .where(
        or(
          lte(cards.nextReview, nowTimestamp),
          isNull(cards.nextReview),
          eq(cards.status, "new")
        )
      )
      .limit(limit);

    return dueCards.map(this.dbToCard);
  }

  /**
   * Get overdue cards (past due by > 1 day)
   */
  async getOverdueCards(): Promise<Card[]> {
    const oneDayAgoTimestamp = Date.now() - 24 * 60 * 60 * 1000;

    const overdueCards = await db
      .select()
      .from(cards)
      .where(and(lte(cards.nextReview, oneDayAgoTimestamp)));

    return overdueCards.map(this.dbToCard);
  }

  /**
   * Update card after review
   */
  async recordReview(
    cardId: string,
    correct: boolean,
    responseTime?: number
  ): Promise<void> {
    const card = await db
      .select()
      .from(cards)
      .where(eq(cards.id, cardId))
      .limit(1);

    if (card.length === 0) {
      throw new Error("Card not found");
    }

    const currentCard = card[0];

    // Get current SRS state
    const currentState: SRSState = {
      interval: currentCard.intervalDays || 1,
      easeFactor: currentCard.easeFactor || 2.5,
      repetitions: currentCard.reviewCount || 0,
    };

    // Calculate quality from swipe result
    const quality = swipeToQuality(correct, responseTime);

    // Calculate next state
    const nextState = calculateNextReview(currentState, quality);

    // Calculate next review date (returns Date object)
    const nextReviewDateObj = getNextReviewDate(nextState.interval);
    const nextReviewTimestamp = nextReviewDateObj.getTime();

    // Calculate mastery score
    const masteryScore = calculateMasteryScore(nextState);

    // Determine status
    const status = getCardStatus(nextState);

    // Update stats
    const newTimesSeen = currentCard.timesSeen + 1;
    const newTimesCorrect = currentCard.timesCorrect + (correct ? 1 : 0);
    const newTimesWrong = currentCard.timesWrong + (correct ? 0 : 1);

    // Calculate average response time
    const prevAvg = currentCard.avgResponseTime || 0;
    const newAvg = responseTime
      ? Math.round(
          (prevAvg * currentCard.timesSeen + responseTime) / newTimesSeen
        )
      : prevAvg;

    // Update database
    await db
      .update(cards)
      .set({
        nextReview: nextReviewTimestamp,
        intervalDays: nextState.interval,
        easeFactor: nextState.easeFactor,
        reviewCount: nextState.repetitions,
        masteryScore,
        status,
        timesSeen: newTimesSeen,
        timesCorrect: newTimesCorrect,
        timesWrong: newTimesWrong,
        avgResponseTime: newAvg,
      })
      .where(eq(cards.id, cardId));
  }

  /**
   * Add a failed card to review system
   */
  async addToReviewDeck(card: Card): Promise<void> {
    const existing = await db
      .select()
      .from(cards)
      .where(eq(cards.id, card.id))
      .limit(1);

    if (existing.length > 0) {
      await this.recordReview(card.id, false);
    } else {
      const initialState = createInitialSRSState();
      const nextReview = getNextReviewDate(initialState.interval);
      const now = Date.now();

      await db.insert(cards).values({
        id: card.id,
        type: card.type,
        lang: card.lang,
        difficulty: card.difficulty,
        question: card.question,
        answer: card.answer,
        explanation: card.explanation,
        roast: card.roast || "",
        source: "session",
        aiModel: undefined,
        topic: undefined,
        createdAt: now,
        status: "learning",
        masteryScore: 0,
        nextReview: nextReview.getTime(),
        intervalDays: initialState.interval,
        easeFactor: initialState.easeFactor,
        reviewCount: 0,
        timesSeen: 1,
        timesCorrect: 0,
        timesWrong: 1,
        avgResponseTime: undefined,
      });
    }
  }

  /**
   * Get review statistics
   */
  async getReviewStats(): Promise<{
    dueToday: number;
    overdue: number;
    learning: number;
    mastered: number;
  }> {
    const nowTimestamp = Date.now();
    const oneDayAgoTimestamp = Date.now() - 24 * 60 * 60 * 1000;

    const [dueToday, overdue, learning, mastered] = await Promise.all([
      db
        .select()
        .from(cards)
        .where(lte(cards.nextReview, nowTimestamp))
        .then((r) => r.length),
      db
        .select()
        .from(cards)
        .where(lte(cards.nextReview, oneDayAgoTimestamp))
        .then((r) => r.length),
      db
        .select()
        .from(cards)
        .where(eq(cards.status, "learning"))
        .then((r) => r.length),
      db
        .select()
        .from(cards)
        .where(eq(cards.status, "mastered"))
        .then((r) => r.length),
    ]);

    return { dueToday, overdue, learning, mastered };
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
