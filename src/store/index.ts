// src/store/index.ts
// ============================================================================
// CENTRALIZED STATE MANAGEMENT
// Zustand store dengan persistence dan type safety
// ============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createGameSlice, GameSlice } from "./slices/gameSlice";
import { createDeckSlice, DeckSlice } from "./slices/deckSlice";
import { createSettingsSlice, SettingsSlice } from "./slices/settingsSlice";
import { logger } from "../utils/validation";

// ============================================================================
// STORE TYPE DEFINITION
// ============================================================================
type StoreState = GameSlice & DeckSlice & SettingsSlice;

// ============================================================================
// STORE CREATION
// ============================================================================
export const useStore = create<StoreState>()(
  persist(
    (set, get, api) => ({
      ...createGameSlice(set, get, api),
      ...createDeckSlice(set, get, api),
      ...createSettingsSlice(set, get, api),
    }),
    {
      name: "hackstack-storage",
      storage: createJSONStorage(() => AsyncStorage),

      // Only persist specific fields
      partialize: (state) => {
        logger.debug("Persisting store state");

        return {
          // Game state
          currentXP: state.currentXP,
          currentLevel: state.currentLevel,
          currentTitle: state.currentTitle,
          dailyStreak: state.dailyStreak,
          totalCardsSwiped: state.totalCardsSwiped,
          maxCombo: state.maxCombo,

          // Settings
          soundEnabled: state.soundEnabled,
          hapticsEnabled: state.hapticsEnabled,
          theme: state.theme,

          // Loadout (last used)
          loadout: state.loadout,
        };
      },

      // Rehydration handler
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          logger.error("Failed to rehydrate store", error);
        } else if (state) {
          logger.info("Store rehydrated successfully", {
            level: state.currentLevel,
            xp: state.currentXP,
            streak: state.dailyStreak,
          });
        }
      },
    }
  )
);

// ============================================================================
// OPTIMIZED SELECTORS
// Prevent unnecessary re-renders
// ============================================================================

// Game selectors
export const selectCurrentXP = (state: StoreState) => state.currentXP;
export const selectCurrentLevel = (state: StoreState) => state.currentLevel;
export const selectCurrentTitle = (state: StoreState) => state.currentTitle;
export const selectComboCount = (state: StoreState) => state.comboCount;
export const selectIsFireMode = (state: StoreState) => state.comboCount >= 5;
export const selectDailyStreak = (state: StoreState) => state.dailyStreak;
export const selectMaxCombo = (state: StoreState) => state.maxCombo;
export const selectSessionStats = (state: StoreState) => state.sessionStats;

// Deck selectors
export const selectDeckQueue = (state: StoreState) => state.queue;
export const selectCurrentCard = (state: StoreState) => {
  const { queue, currentIndex } = state;
  return currentIndex < queue.length ? queue[currentIndex] : null;
};
export const selectRemainingCards = (state: StoreState) => {
  return state.queue.length - state.currentIndex;
};
export const selectIsGenerating = (state: StoreState) => state.isGenerating;
export const selectLoadout = (state: StoreState) => state.loadout;

// Settings selectors
export const selectSoundEnabled = (state: StoreState) => state.soundEnabled;
export const selectHapticsEnabled = (state: StoreState) => state.hapticsEnabled;
export const selectTheme = (state: StoreState) => state.theme;

// Composite selectors
export const selectUserStats = (state: StoreState) => ({
  level: state.currentLevel,
  currentXP: state.currentXP,
  nextLevelXP: Math.floor(100 * Math.pow(state.currentLevel + 1, 1.5)),
  combo: state.comboCount,
  title: state.currentTitle,
});

export const selectSessionSummary = (state: StoreState) => {
  const stats = state.sessionStats;
  const total = stats.correct + stats.wrong + stats.skipped;
  const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0;

  return {
    totalCards: total,
    correct: stats.correct,
    wrong: stats.wrong,
    skipped: stats.skipped,
    accuracy,
    maxCombo: state.maxCombo,
    xpEarned: 0, // Will be calculated in endSession
    duration: stats.endTime ? stats.endTime - stats.startTime : 0,
    perfectSession:
      stats.correct > 0 && stats.wrong === 0 && stats.correct >= 5,
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Reset store to initial state (for testing/debugging)
 */
export const resetStore = () => {
  logger.warn("Resetting store to initial state");

  useStore.setState({
    currentXP: 0,
    currentLevel: 1,
    currentTitle: "Script Kiddie",
    comboCount: 0,
    maxCombo: 0,
    dailyStreak: 0,
    totalCardsSwiped: 0,
    sessionStats: {
      correct: 0,
      wrong: 0,
      skipped: 0,
      startTime: Date.now(),
    },
    queue: [],
    currentIndex: 0,
    isGenerating: false,
    loadout: null,
  });
};

/**
 * Get snapshot of current state (for debugging)
 */
export const getStoreSnapshot = () => {
  const state = useStore.getState();

  return {
    game: {
      level: state.currentLevel,
      xp: state.currentXP,
      title: state.currentTitle,
      combo: state.comboCount,
      streak: state.dailyStreak,
    },
    deck: {
      queueLength: state.queue.length,
      currentIndex: state.currentIndex,
      remaining: state.queue.length - state.currentIndex,
      isGenerating: state.isGenerating,
    },
    session: state.sessionStats,
    settings: {
      sound: state.soundEnabled,
      haptics: state.hapticsEnabled,
      theme: state.theme,
    },
  };
};

// Log store snapshot in development
if (__DEV__) {
  logger.debug("Initial store snapshot", getStoreSnapshot());
}
