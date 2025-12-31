// src/core/hooks/useHaptics.ts
import * as Haptics from "expo-haptics";
import { useStore } from "../../store";

export type HapticType =
  | "light"
  | "medium"
  | "heavy"
  | "rigid"
  | "success"
  | "error"
  | "warning";

const HAPTIC_MAP = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  rigid: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),
  success: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  warning: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};

export function useHaptics() {
  const hapticsEnabled = useStore((state) => state.hapticsEnabled);

  const trigger = async (type: HapticType) => {
    if (!hapticsEnabled) return;

    try {
      await HAPTIC_MAP[type]();
    } catch (error) {
      console.error(`Haptic feedback failed: ${type}`, error);
    }
  };

  // Convenience methods
  const triggerSequence = async (
    sequence: Array<{ type: HapticType; delay?: number }>
  ) => {
    if (!hapticsEnabled) return;

    for (const { type, delay = 0 } of sequence) {
      await trigger(type);
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  return { trigger, triggerSequence };
}
