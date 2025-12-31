// src/features/gamification/xpCalculator.ts
import { Difficulty } from "../../types";

export interface XPParams {
  baseXP: number;
  combo: number;
  difficulty: Difficulty;
  isSpeedBonus: boolean;
  isReviewMode?: boolean;
}

export interface XPBreakdown {
  base: number;
  comboBonus: number;
  difficultyBonus: number;
  speedBonus: number;
  total: number;
}

/**
 * Calculate XP earned for a correct answer
 */
export function calculateXP(params: XPParams): XPBreakdown {
  const { baseXP, combo, difficulty, isSpeedBonus, isReviewMode } = params;

  // Combo multiplier (up to 2x at combo 10+)
  const comboMultiplier = Math.min(1 + combo * 0.1, 2);
  const comboBonus = Math.floor(baseXP * (comboMultiplier - 1));

  // Difficulty bonus
  const difficultyBonuses: Record<Difficulty, number> = {
    easy: 0,
    medium: 5,
    hard: 10,
    god: 20,
  };
  const difficultyBonus = difficultyBonuses[difficulty];

  // Speed bonus (answered quickly)
  const speedBonus = isSpeedBonus ? 15 : 0;

  // Review mode penalty (50% XP)
  const reviewMultiplier = isReviewMode ? 0.5 : 1;

  // Calculate total
  const subtotal = Math.floor(
    (baseXP + comboBonus + difficultyBonus + speedBonus) * reviewMultiplier
  );

  return {
    base: baseXP,
    comboBonus,
    difficultyBonus,
    speedBonus,
    total: subtotal,
  };
}

/**
 * XP required for next level (exponential curve)
 */
export function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXP(xp: number): number {
  let level = 1;
  let totalXP = 0;

  while (totalXP <= xp) {
    level++;
    totalXP += getXPForLevel(level);
  }

  return level - 1;
}

/**
 * Calculate total XP needed to reach a level
 */
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

/**
 * Get level progress percentage
 */
export function getLevelProgress(currentXP: number, level: number): number {
  const xpForLevel = getXPForLevel(level + 1);
  const progress = (currentXP / xpForLevel) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Determine if response was fast enough for speed bonus
 */
export function isSpeedBonusEligible(
  responseTime: number,
  difficulty: Difficulty
): boolean {
  const thresholds: Record<Difficulty, number> = {
    easy: 5000, // 5 seconds
    medium: 7000, // 7 seconds
    hard: 10000, // 10 seconds
    god: 15000, // 15 seconds
  };

  return responseTime < thresholds[difficulty];
}

/**
 * Calculate session XP multiplier based on accuracy
 */
export function getSessionMultiplier(correct: number, total: number): number {
  if (total === 0) return 1;

  const accuracy = correct / total;

  if (accuracy === 1) return 1.5; // Perfect session: 50% bonus
  if (accuracy >= 0.9) return 1.25; // Excellent: 25% bonus
  if (accuracy >= 0.75) return 1.1; // Good: 10% bonus

  return 1; // No bonus
}
