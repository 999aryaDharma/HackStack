// src/store/slices/settingsSlice.ts
import { StateCreator } from "zustand";

export interface SettingsSlice {
  // State
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: "dark" | "light" | "cyberpunk";

  // Actions
  toggleSound: () => void;
  toggleHaptics: () => void;
  setTheme: (theme: "dark" | "light" | "cyberpunk") => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  // Initial State
  soundEnabled: true,
  hapticsEnabled: true,
  theme: "dark",

  // Actions
  toggleSound: () => {
    set((state) => ({ soundEnabled: !state.soundEnabled }));
  },

  toggleHaptics: () => {
    set((state) => ({ hapticsEnabled: !state.hapticsEnabled }));
  },

  setTheme: (theme) => {
    set({ theme });
  },
});
