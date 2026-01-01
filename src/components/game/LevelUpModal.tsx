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
