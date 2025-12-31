// src/store/slices/gameSlice.ts
import { StateCreator } from "zustand";
import { getXPForLevel, TITLES } from "../../core/theme/constants";
import * as Haptics from "expo-haptics";

export interface SessionStats {
  correct: number;
  wrong: number;
  skipped: number;
  startTime: number;
}

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
  endSession: () => SessionStats;
  recordCorrect: () => void;
  recordWrong: () => void;
}

export const createGameSlice: StateCreator<GameSlice> = (set, get) => ({
  // Initial State
  currentXP: 0,
  currentLevel: 1,
  currentTitle: TITLES[0],
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

  // Actions
  addXP: (amount) => {
    set((state) => {
      const newXP = state.currentXP + amount;
      return { currentXP: newXP };
    });

    // Check for level up after XP is added
    if (get().checkLevelUp()) {
      // Level up happened - trigger haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  checkLevelUp: () => {
    const { currentXP, currentLevel } = get();
    const xpNeeded = getXPForLevel(currentLevel + 1);

    if (currentXP >= xpNeeded) {
      set({
        currentLevel: currentLevel + 1,
        currentXP: currentXP - xpNeeded,
        currentTitle: TITLES[Math.min(currentLevel, TITLES.length - 1)],
      });
      return true;
    }

    return false;
  },

  incrementCombo: () => {
    set((state) => {
      const newCombo = state.comboCount + 1;
      return {
        comboCount: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
        sessionStats: {
          ...state.sessionStats,
          correct: state.sessionStats.correct + 1,
        },
        totalCardsSwiped: state.totalCardsSwiped + 1,
      };
    });

    // Fire mode haptic
    if (get().comboCount === 5) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  resetCombo: () => {
    set((state) => ({
      comboCount: 0,
      sessionStats: {
        ...state.sessionStats,
        wrong: state.sessionStats.wrong + 1,
      },
      totalCardsSwiped: state.totalCardsSwiped + 1,
    }));

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  startSession: () => {
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

  endSession: () => {
    const stats = get().sessionStats;
    return stats;
  },

  recordCorrect: () => {
    get().incrementCombo();

    // Calculate XP based on combo
    const combo = get().comboCount;
    const baseXP = 20;
    const comboBonus = Math.floor(combo * 0.5);
    const xpGain = baseXP + comboBonus;

    get().addXP(xpGain);
  },

  recordWrong: () => {
    get().resetCombo();
  },
});
