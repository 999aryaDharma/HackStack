// src/store/slices/deckSlice.ts
import { StateCreator } from "zustand";
import { Card } from "../../types";

export interface Loadout {
  language: "JS" | "TS" | "Python" | "Go";
  topics: string[];
  difficulty: "easy" | "medium" | "hard" | "god";
  sessionLength: number;
}

export interface DeckSlice {
  // State
  queue: Card[];
  currentIndex: number;
  isGenerating: boolean;
  loadout: Loadout | null;

  // Actions
  setQueue: (cards: Card[]) => void;
  consumeCard: () => Card | null;
  resetDeck: () => void;
  setLoadout: (loadout: Loadout) => void;
  needsRefill: () => boolean;
}

export const createDeckSlice: StateCreator<DeckSlice> = (set, get) => ({
  // Initial State
  queue: [],
  currentIndex: 0,
  isGenerating: false,
  loadout: null,

  // Actions
  setQueue: (cards) => {
    set({ queue: cards, currentIndex: 0 });
  },

  consumeCard: () => {
    const { queue, currentIndex } = get();

    if (currentIndex >= queue.length) {
      return null;
    }

    const card = queue[currentIndex];
    set({ currentIndex: currentIndex + 1 });

    return card;
  },

  resetDeck: () => {
    set({
      queue: [],
      currentIndex: 0,
      loadout: null,
    });
  },

  setLoadout: (loadout) => {
    set({ loadout });
  },

  needsRefill: () => {
    const { queue, currentIndex } = get();
    const remaining = queue.length - currentIndex;
    return remaining < 3; // Trigger refill when < 3 cards left
  },
});
