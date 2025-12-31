// src/store/slices/gameSlice.ts
// ============================================================================
// GAME STATE SLICE
// Handles XP, levels, combos, and session stats
// ============================================================================

import { StateCreator } from "zustand";
import { getXPForLevel, TITLES } from "../../core/theme/constants";
import { SessionStats, SessionSummary } from "../../types";
import { logger } from "../../utils/logger";
import * as Haptics from "expo-haptics";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
export interface GameSlice {
  // State
  currentXP: number;
  currentLevel: number;
  currentTitle: string;
  comboCount: number;
  maxCombo: number;
  sessionStats: SessionStats;
  dailyStreak: number;
  totalCardsSwiped: number;

  // Actions
  addXP: (amount: number) => void;
  checkLevelUp: () => boolean;
  incrementCombo: () => void;
  resetCombo: () => void;
  startSession: () => void;
  endSession: () => SessionSummary;
  recordCorrect: () => void;
  recordWrong: () => void;
  recordSkip: () => void;
  updateStreak: (newStreak: number) => void;
}

// ============================================================================
// SLICE CREATOR
// ============================================================================
export const createGameSlice: StateCreator<GameSlice> = (set, get) => ({
  // ========================================
  // INITIAL STATE
  // ========================================
  currentXP: 0,
  currentLevel: 1,
  currentTitle: TITLES[0] || "Script Kiddie",
  comboCount: 0,
  maxCombo: 0,
  sessionStats: {
    correct: 0,
    wrong: 0,
    skipped: 0,
    startTime: Date.now(),
  },
  dailyStreak: 0,
  totalCardsSwiped: 0,

  // ========================================
  // XP & LEVELING
  // ========================================
  addXP: (amount: number) => {
    logger.debug("Adding XP", { amount });

    set((state) => {
      const newXP = state.currentXP + amount;
      logger.info("XP updated", {
        previousXP: state.currentXP,
        added: amount,
        newXP,
      });

      return { currentXP: newXP };
    });

    // Check for level up after XP is added
    const didLevelUp = get().checkLevelUp();

    if (didLevelUp) {
      logger.info("Level up triggered", { newLevel: get().currentLevel });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  checkLevelUp: () => {
    const { currentXP, currentLevel } = get();
    const xpNeeded = getXPForLevel(currentLevel + 1);

    if (currentXP >= xpNeeded) {
      const newLevel = currentLevel + 1;
      const newTitle =
        TITLES[Math.min(newLevel - 1, TITLES.length - 1)] || "Code Wizard";
      const remainingXP = currentXP - xpNeeded;

      logger.info("Player leveled up!", {
        previousLevel: currentLevel,
        newLevel,
        newTitle,
        xpNeeded,
        remainingXP,
      });

      set({
        currentLevel: newLevel,
        currentXP: remainingXP,
        currentTitle: newTitle,
      });

      return true;
    }

    return false;
  },

  // ========================================
  // COMBO SYSTEM
  // ========================================
  incrementCombo: () => {
    set((state) => {
      const newCombo = state.comboCount + 1;
      const newMaxCombo = Math.max(newCombo, state.maxCombo);

      logger.debug("Combo incremented", {
        previousCombo: state.comboCount,
        newCombo,
        isFireMode: newCombo >= 5,
      });

      return {
        comboCount: newCombo,
        maxCombo: newMaxCombo,
        sessionStats: {
          ...state.sessionStats,
          correct: state.sessionStats.correct + 1,
        },
        totalCardsSwiped: state.totalCardsSwiped + 1,
      };
    });

    // Fire mode haptic (combo >= 5)
    const combo = get().comboCount;
    if (combo === 5) {
      logger.info("Fire mode activated!", { combo });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (combo % 10 === 0) {
      // Milestone haptic every 10 combo
      logger.info("Combo milestone reached", { combo });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  resetCombo: () => {
    const previousCombo = get().comboCount;

    if (previousCombo > 0) {
      logger.warn("Combo reset", { lostCombo: previousCombo });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    set((state) => ({
      comboCount: 0,
      sessionStats: {
        ...state.sessionStats,
        wrong: state.sessionStats.wrong + 1,
      },
      totalCardsSwiped: state.totalCardsSwiped + 1,
    }));
  },

  // ========================================
  // SESSION MANAGEMENT
  // ========================================
  startSession: () => {
    logger.info("Session started");

    set({
      sessionStats: {
        correct: 0,
        wrong: 0,
        skipped: 0,
        startTime: Date.now(),
      },
      comboCount: 0,
    });
  },

  endSession: (): SessionSummary => {
    const endTime = Date.now();
    const stats = get().sessionStats;
    const duration = endTime - stats.startTime;

    const totalCards = stats.correct + stats.wrong + stats.skipped;
    const accuracy =
      totalCards > 0 ? Math.round((stats.correct / totalCards) * 100) : 0;

    const summary: SessionSummary = {
      totalCards,
      correct: stats.correct,
      wrong: stats.wrong,
      accuracy,
      maxCombo: get().maxCombo,
      xpEarned: stats.xpEarned || 0,
      duration,
      perfectSession:
        stats.correct > 0 && stats.wrong === 0 && stats.correct >= 5,
    };

    logger.info("Session ended", summary);

    // Update session stats with end time
    set((state) => ({
      sessionStats: {
        ...state.sessionStats,
        endTime,
      },
    }));

    return summary;
  },

  // ========================================
  // CARD ACTIONS
  // ========================================
  recordCorrect: () => {
    logger.debug("Recording correct answer");

    get().incrementCombo();

    // Calculate XP based on combo
    const combo = get().comboCount;
    const baseXP = 20;
    const comboBonus = Math.floor(combo * 2); // 2 XP per combo level
    const xpGain = baseXP + comboBonus;

    logger.info("Correct answer processed", {
      combo,
      baseXP,
      comboBonus,
      totalXP: xpGain,
    });

    get().addXP(xpGain);
  },

  recordWrong: () => {
    logger.debug("Recording wrong answer");
    get().resetCombo();
  },

  recordSkip: () => {
    logger.debug("Recording skipped card");

    set((state) => ({
      sessionStats: {
        ...state.sessionStats,
        skipped: state.sessionStats.skipped + 1,
      },
      totalCardsSwiped: state.totalCardsSwiped + 1,
    }));
  },

  // ========================================
  // STREAK MANAGEMENT
  // ========================================
  updateStreak: (newStreak: number) => {
    const previousStreak = get().dailyStreak;

    logger.info("Streak updated", {
      previousStreak,
      newStreak,
      difference: newStreak - previousStreak,
    });

    set({ dailyStreak: newStreak });

    // Celebrate milestone streaks
    if (newStreak > 0 && newStreak % 7 === 0) {
      logger.info("Week streak milestone!", { streak: newStreak });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
});
