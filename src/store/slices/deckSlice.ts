// src/store/slices/deckSlice.ts
// ============================================================================
// DECK STATE SLICE
// Manages card queue and loadout configuration
// ============================================================================

import { StateCreator } from "zustand";
import { Card, Loadout } from "../../types";
import { logger } from "../../utils/validation";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
export interface DeckSlice {
  // State
  queue: Card[];
  currentIndex: number;
  isGenerating: boolean;
  loadout: Loadout | null;

  // Actions
  setQueue: (cards: Card[]) => void;
  addCards: (cards: Card[]) => void;
  consumeCard: () => Card | null;
  resetDeck: () => void;
  setLoadout: (loadout: Loadout) => void;
  setGenerating: (isGenerating: boolean) => void;
  needsRefill: () => boolean;
}

// ============================================================================
// SLICE CREATOR
// ============================================================================
export const createDeckSlice: StateCreator<DeckSlice> = (set, get) => ({
  // ========================================
  // INITIAL STATE
  // ========================================
  queue: [],
  currentIndex: 0,
  isGenerating: false,
  loadout: null,

  // ========================================
  // QUEUE MANAGEMENT
  // ========================================
  setQueue: (cards: Card[]) => {
    logger.info("Setting card queue", {
      cardCount: cards.length,
      languages: [...new Set(cards.map((c) => c.lang))],
      difficulties: [...new Set(cards.map((c) => c.difficulty))],
    });

    set({
      queue: cards,
      currentIndex: 0,
    });
  },

  addCards: (cards: Card[]) => {
    logger.info("Adding cards to queue", {
      addedCount: cards.length,
      currentQueueLength: get().queue.length,
    });

    set((state) => ({
      queue: [...state.queue, ...cards],
    }));
  },

  consumeCard: (): Card | null => {
    const { queue, currentIndex } = get();

    if (currentIndex >= queue.length) {
      logger.warn("Attempted to consume card but queue is empty", {
        currentIndex,
        queueLength: queue.length,
      });
      return null;
    }

    const card = queue[currentIndex];

    logger.debug("Card consumed", {
      cardId: card.id,
      cardType: card.type,
      language: card.lang,
      currentIndex,
      remaining: queue.length - currentIndex - 1,
    });

    set({ currentIndex: currentIndex + 1 });

    // Check if we need to prefetch more cards
    const remaining = queue.length - (currentIndex + 1);
    if (remaining <= 3) {
      logger.info("Low card count, prefetch recommended", { remaining });
    }

    return card;
  },

  resetDeck: () => {
    logger.info("Resetting deck");

    set({
      queue: [],
      currentIndex: 0,
      loadout: null,
      isGenerating: false,
    });
  },

  // ========================================
  // LOADOUT MANAGEMENT
  // ========================================
  setLoadout: (loadout: Loadout) => {
    logger.info("Loadout updated", {
      language: loadout.language,
      topicCount: loadout.topics.length,
      topics: loadout.topics,
      difficulty: loadout.difficulty,
      sessionLength: loadout.sessionLength,
    });

    set({ loadout });
  },

  // ========================================
  // GENERATION STATUS
  // ========================================
  setGenerating: (isGenerating: boolean) => {
    if (isGenerating) {
      logger.info("Card generation started");
    } else {
      logger.info("Card generation completed");
    }

    set({ isGenerating });
  },

  needsRefill: (): boolean => {
    const { queue, currentIndex } = get();
    const remaining = queue.length - currentIndex;
    const needsRefill = remaining < 3;

    if (needsRefill) {
      logger.debug("Queue needs refill", {
        remaining,
        threshold: 3,
      });
    }

    return needsRefill;
  },
});

// ============================================================================
// TYPE EXPORT (untuk digunakan di components)
// ============================================================================
export type { Loadout };
