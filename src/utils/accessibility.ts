// src/utils/accessibility.ts
import { AccessibilityInfo, Platform } from "react-native";
import { logger } from "./validation";

/**
 * Accessibility utilities for screen readers and assistive technologies
 */

interface AccessibilityState {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isBoldTextEnabled: boolean;
  isGrayscaleEnabled: boolean;
  isInvertColorsEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
}

class AccessibilityManager {
  private state: AccessibilityState = {
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: false,
    isBoldTextEnabled: false,
    isGrayscaleEnabled: false,
    isInvertColorsEnabled: false,
    isReduceTransparencyEnabled: false,
  };

  private listeners: Array<(state: AccessibilityState) => void> = [];

  async init() {
    try {
      // Check screen reader
      const screenReaderEnabled =
        await AccessibilityInfo.isScreenReaderEnabled();
      this.state.isScreenReaderEnabled = screenReaderEnabled;

      // Check reduce motion
      const reduceMotionEnabled =
        await AccessibilityInfo.isReduceMotionEnabled();
      this.state.isReduceMotionEnabled = reduceMotionEnabled;

      // Platform-specific checks
      if (Platform.OS === "ios") {
        const boldTextEnabled = await AccessibilityInfo.isBoldTextEnabled();
        this.state.isBoldTextEnabled = boldTextEnabled;

        const grayscaleEnabled = await AccessibilityInfo.isGrayscaleEnabled();
        this.state.isGrayscaleEnabled = grayscaleEnabled;

        const invertColorsEnabled =
          await AccessibilityInfo.isInvertColorsEnabled();
        this.state.isInvertColorsEnabled = invertColorsEnabled;

        const reduceTransparencyEnabled =
          await AccessibilityInfo.isReduceTransparencyEnabled();
        this.state.isReduceTransparencyEnabled = reduceTransparencyEnabled;
      }

      logger.info("Accessibility state initialized", this.state);

      // Setup listeners
      this.setupListeners();
    } catch (error) {
      logger.error("Failed to initialize accessibility state", error);
    }
  }

  private setupListeners() {
    // Screen reader change listener
    AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      (isScreenReaderEnabled) => {
        this.state.isScreenReaderEnabled = isScreenReaderEnabled;
        this.notifyListeners();
        logger.info("Screen reader state changed", { isScreenReaderEnabled });
      }
    );

    // Reduce motion change listener
    AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (isReduceMotionEnabled) => {
        this.state.isReduceMotionEnabled = isReduceMotionEnabled;
        this.notifyListeners();
        logger.info("Reduce motion state changed", { isReduceMotionEnabled });
      }
    );

    // iOS-specific listeners
    if (Platform.OS === "ios") {
      AccessibilityInfo.addEventListener(
        "boldTextChanged",
        (isBoldTextEnabled) => {
          this.state.isBoldTextEnabled = isBoldTextEnabled;
          this.notifyListeners();
        }
      );

      AccessibilityInfo.addEventListener(
        "grayscaleChanged",
        (isGrayscaleEnabled) => {
          this.state.isGrayscaleEnabled = isGrayscaleEnabled;
          this.notifyListeners();
        }
      );
    }
  }

  getState(): AccessibilityState {
    return { ...this.state };
  }

  isScreenReaderEnabled(): boolean {
    return this.state.isScreenReaderEnabled;
  }

  isReduceMotionEnabled(): boolean {
    return this.state.isReduceMotionEnabled;
  }

  subscribe(callback: (state: AccessibilityState) => void) {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((callback) => {
      callback(this.state);
    });
  }

  /**
   * Announce message to screen reader
   */
  announce(message: string, options?: { queue?: boolean }) {
    if (this.state.isScreenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(message);
      logger.debug("Announced to screen reader", { message });
    }
  }

  /**
   * Set focus to element (for screen readers)
   */
  setAccessibilityFocus(reactTag: number) {
    if (this.state.isScreenReaderEnabled) {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  }
}

export const accessibilityManager = new AccessibilityManager();

/**
 * Accessibility labels generator
 */
export const A11yLabels = {
  // Card interactions
  swipeCard: (language: string, difficulty: string) =>
    `${language} card, ${difficulty} difficulty. Swipe right if you know the answer, left if you don't. Double tap to reveal answer.`,

  cardRevealed: (answer: string) => `Answer revealed: ${answer}`,

  // Stats
  xpProgress: (current: number, total: number, percentage: number) =>
    `Experience points: ${current} out of ${total}. ${percentage}% progress to next level.`,

  comboCounter: (combo: number) =>
    `Combo streak: ${combo}. ${combo >= 5 ? "Fire mode active!" : ""}`,

  levelIndicator: (level: number, title: string) => `Level ${level}, ${title}`,

  // Buttons
  startSession: "Start new learning session",
  reviewDungeon: "Enter review dungeon to practice failed cards",
  settings: "Open settings menu",
  profile: "View your profile and statistics",

  // Results
  sessionSummary: (
    correct: number,
    total: number,
    accuracy: number,
    xp: number
  ) =>
    `Session complete. You got ${correct} out of ${total} cards correct, ${accuracy}% accuracy. You earned ${xp} experience points.`,
};

/**
 * Accessibility hints generator
 */
export const A11yHints = {
  swipeCard: "Swipe right for correct, left for wrong, or double tap to flip",
  dismissModal: "Double tap to close",
  navigateBack: "Double tap to go back",
  shareResults: "Double tap to share your results",
};

/**
 * Generate semantic accessibility props
 */
export function getA11yProps(
  role: "button" | "link" | "header" | "text" | "image" | "adjustable" | "none",
  label: string,
  hint?: string,
  state?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
  }
) {
  return {
    accessible: true,
    accessibilityRole: role,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: state,
  };
}

/**
 * Minimum touch target size enforcement
 */
export const MIN_TOUCH_TARGET = 44; // iOS HIG standard

export function ensureTouchTarget(size: number): number {
  return Math.max(size, MIN_TOUCH_TARGET);
}

/**
 * Color contrast checker (WCAG AA compliance)
 */
export function checkColorContrast(
  foreground: string,
  background: string
): { ratio: number; passesAA: boolean; passesAAA: boolean } {
  // Simplified luminance calculation
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const [rs, gs, bs] = [r, g, b].map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const ratio = l1 > l2 ? (l1 + 0.05) / (l2 + 0.05) : (l2 + 0.05) / (l1 + 0.05);

  return {
    ratio,
    passesAA: ratio >= 4.5, // WCAG AA for normal text
    passesAAA: ratio >= 7, // WCAG AAA for normal text
  };
}

/**
 * React hook for accessibility state
 */
import { useState, useEffect } from "react";

export function useAccessibility() {
  const [state, setState] = useState(accessibilityManager.getState());

  useEffect(() => {
    // Initialize on mount
    accessibilityManager.init();

    // Subscribe to changes
    const unsubscribe = accessibilityManager.subscribe(setState);

    return unsubscribe;
  }, []);

  return state;
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion() {
  const { isReduceMotionEnabled } = useAccessibility();
  return isReduceMotionEnabled;
}

/**
 * Hook for screen reader
 */
export function useScreenReader() {
  const { isScreenReaderEnabled } = useAccessibility();
  return isScreenReaderEnabled;
}
