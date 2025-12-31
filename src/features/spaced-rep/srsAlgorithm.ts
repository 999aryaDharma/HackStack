// src/features/spaced-rep/srsAlgorithm.ts

export interface SRSState {
  interval: number; // Days until next review
  easeFactor: number; // 1.3 - 2.5+ (difficulty multiplier)
  repetitions: number; // Number of successful reviews
}

export interface ReviewQuality {
  quality: number; // 0-5 rating
  responseTime?: number; // Milliseconds
}

/**
 * SM-2 Algorithm Implementation
 *
 * Quality ratings:
 * 0 - Complete blackout (no recall)
 * 1 - Incorrect response, but remembered upon seeing answer
 * 2 - Incorrect response, but correct answer seemed easy to recall
 * 3 - Correct response, but required significant difficulty
 * 4 - Correct response, with some hesitation
 * 5 - Perfect response (immediate recall)
 */
export function calculateNextReview(
  currentState: SRSState,
  review: ReviewQuality
): SRSState {
  const { interval, easeFactor, repetitions } = currentState;
  const { quality } = review;

  // Clamp quality between 0-5
  const q = Math.max(0, Math.min(5, quality));

  // Calculate new ease factor
  let newEaseFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  // Ease factor should never drop below 1.3
  newEaseFactor = Math.max(1.3, newEaseFactor);

  let newInterval: number;
  let newRepetitions: number;

  if (q < 3) {
    // Failed review - reset interval and repetitions
    newInterval = 1;
    newRepetitions = 0;
  } else {
    // Passed review - increase interval
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }

    newRepetitions = repetitions + 1;
  }

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
  };
}

/**
 * Calculate next review date
 */
export function getNextReviewDate(intervalDays: number): Date {
  const now = new Date();
  const nextReview = new Date(
    now.getTime() + intervalDays * 24 * 60 * 60 * 1000
  );
  return nextReview;
}

/**
 * Convert swipe result to quality rating
 * This maps our simple correct/wrong to SM-2's 0-5 scale
 */
export function swipeToQuality(
  correct: boolean,
  responseTime?: number
): ReviewQuality {
  if (!correct) {
    return { quality: 0, responseTime }; // Complete failure
  }

  // If correct, determine quality based on response time
  if (!responseTime) {
    return { quality: 4, responseTime }; // Default good response
  }

  // Fast response (< 3 seconds) = Perfect
  if (responseTime < 3000) {
    return { quality: 5, responseTime };
  }

  // Medium response (3-7 seconds) = Good
  if (responseTime < 7000) {
    return { quality: 4, responseTime };
  }

  // Slow response (7-15 seconds) = Acceptable
  if (responseTime < 15000) {
    return { quality: 3, responseTime };
  }

  // Very slow (> 15 seconds) = Barely passed
  return { quality: 3, responseTime };
}

/**
 * Calculate mastery score (0-100)
 * Based on ease factor and repetition count
 */
export function calculateMasteryScore(state: SRSState): number {
  const { easeFactor, repetitions } = state;

  // Weight ease factor (40%) and repetitions (60%)
  const easeScore = ((easeFactor - 1.3) / (2.5 - 1.3)) * 100;
  const repScore = Math.min(repetitions / 10, 1) * 100;

  const mastery = easeScore * 0.4 + repScore * 0.6;

  return Math.round(Math.max(0, Math.min(100, mastery)));
}

/**
 * Determine card status based on mastery
 */
export type CardStatus = "new" | "learning" | "review" | "mastered";

export function getCardStatus(state: SRSState): CardStatus {
  const mastery = calculateMasteryScore(state);

  if (state.repetitions === 0) return "new";
  if (mastery < 50) return "learning";
  if (mastery < 80) return "review";
  return "mastered";
}

/**
 * Initial state for new cards
 */
export function createInitialSRSState(): SRSState {
  return {
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
  };
}
