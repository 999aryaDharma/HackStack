// src/store/index.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createGameSlice, GameSlice } from "./slices/gameSlice";
import { createDeckSlice, DeckSlice } from "./slices/deckSlice";
import { createSettingsSlice, SettingsSlice } from "./slices/settingsSlice";

type StoreState = GameSlice & DeckSlice & SettingsSlice;

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...createGameSlice(set, get),
      ...createDeckSlice(set, get),
      ...createSettingsSlice(set, get),
    }),
    {
      name: "hackstack-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist these fields
        currentXP: state.currentXP,
        currentLevel: state.currentLevel,
        dailyStreak: state.dailyStreak,
        totalCardsSwiped: state.totalCardsSwiped,
        soundEnabled: state.soundEnabled,
        hapticsEnabled: state.hapticsEnabled,
      }),
    }
  )
);

// Selectors for optimized re-renders
export const selectCurrentXP = (state: StoreState) => state.currentXP;
export const selectCurrentLevel = (state: StoreState) => state.currentLevel;
export const selectComboCount = (state: StoreState) => state.comboCount;
export const selectIsFireMode = (state: StoreState) => state.comboCount >= 5;
export const selectDeckQueue = (state: StoreState) => state.queue;
