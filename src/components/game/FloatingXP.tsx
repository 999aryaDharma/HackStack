// src/components/game/FloatingXP.tsx
import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "../../core/theme/constants";

interface FloatingXPProps {
  amount: number;
  position: { x: number; y: number };
  onComplete: () => void;
}

export function FloatingXP({ amount, position, onComplete }: FloatingXPProps) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSpring(1.2, { damping: 10 });

    setTimeout(() => {
      opacity.value = withTiming(0, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
      });

      translateY.value = withTiming(-80, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
      });
    }, 200);

    setTimeout(onComplete, 1200);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { left: position.x, top: position.y },
        animatedStyle,
      ]}
    >
      <Text style={styles.text}>+{amount} XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
  text: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.accent.green,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

// src/components/game/LevelUpModal.tsx
import React, { useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
} from "react-native-reanimated";
import { COLORS, SPACING, RADIUS } from "../../core/theme/constants";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface LevelUpModalProps {
  visible: boolean;
  level: number;
  title: string;
  xpBonus?: number;
  onClose: () => void;
}

export function LevelUpModal({
  visible,
  level,
  title,
  xpBonus = 100,
  onClose,
}: LevelUpModalProps) {
  const scale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Trigger haptics
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animation sequence
      scale.value = withSpring(1, { damping: 15 });

      titleOpacity.value = withDelay(300, withSpring(1));

      buttonOpacity.value = withDelay(600, withSpring(1));
    } else {
      scale.value = 0;
      titleOpacity.value = 0;
      buttonOpacity.value = 0;
    }
  }, [visible]);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, modalStyle]}>
          <Text style={styles.header}>LEVEL UP!</Text>

          <View style={styles.levelContainer}>
            <Text style={styles.levelNumber}>{level}</Text>
          </View>

          <Animated.View style={titleStyle}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.bonus}>+{xpBonus} XP Bonus</Text>
          </Animated.View>

          <Animated.View style={[styles.buttonContainer, buttonStyle]}>
            <Pressable style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>CONTINUE</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 3,
    borderColor: COLORS.accent.green,
    alignItems: "center",
  },
  header: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.accent.green,
    letterSpacing: 2,
    marginBottom: SPACING.lg,
  },
  levelContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accent.green,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
    borderWidth: 4,
    borderColor: COLORS.background.primary,
  },
  levelNumber: {
    fontSize: 56,
    fontWeight: "900",
    color: COLORS.background.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  bonus: {
    fontSize: 16,
    color: COLORS.accent.yellow,
    fontWeight: "600",
    marginBottom: SPACING.xl,
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    backgroundColor: COLORS.accent.green,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.background.primary,
    letterSpacing: 1,
  },
});

// src/components/game/ScreenShake.tsx
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface ScreenShakeProps {
  trigger: boolean;
  children: React.ReactNode;
}

export function ScreenShake({ trigger, children }: ScreenShakeProps) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (trigger) {
      translateX.value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
