// src/components/game/SwipeCard/SwipeCard.tsx
import React, { useState } from "react";
import { StyleSheet, Text, View, Dimensions, Pressable } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { COLORS, RADIUS, SPACING } from "../../../core/theme/constants";
import { Card } from "../../../types";
import { useCardPhysics } from "../../../core/hooks/useCardPhysics";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface SwipeCardProps {
  card: Card;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function SwipeCard({ card, onSwipeLeft, onSwipeRight }: SwipeCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipRotation = useSharedValue(0);

  const { gesture, animatedStyle, overlayStyle } = useCardPhysics({
    onSwipeLeft,
    onSwipeRight,
    onCardGrabbed: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  // Flip animation
  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isFlipped) {
      flipRotation.value = withTiming(0, { duration: 300 });
      setIsFlipped(false);
    } else {
      flipRotation.value = withTiming(180, { duration: 300 });
      setIsFlipped(true);
    }
  };

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${flipRotation.value}deg` }],
    opacity: flipRotation.value < 90 ? 1 : 0,
    zIndex: flipRotation.value < 90 ? 1 : 0,
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${flipRotation.value - 180}deg` }],
    opacity: flipRotation.value >= 90 ? 1 : 0,
    zIndex: flipRotation.value >= 90 ? 1 : 0,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.wrapper, animatedStyle]}>
        {/* Color Overlay Feedback */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
        />

        {/* FRONT SIDE */}
        <Animated.View style={[styles.cardFace, frontAnimatedStyle]}>
          <View style={styles.header}>
            <Text style={styles.langBadge}>{card.lang}</Text>
            <Text style={styles.difficultyBadge}>
              {card.difficulty.toUpperCase()}
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.questionText}>{card.question}</Text>
          </View>

          <Pressable onPress={handleFlip} style={styles.flipButton}>
            <Text style={styles.flipText}>TAP TO REVEAL ANSWER</Text>
          </Pressable>
        </Animated.View>

        {/* BACK SIDE */}
        <Animated.View
          style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}
        >
          <View style={styles.content}>
            <Text style={styles.label}>ANSWER</Text>
            <Text style={styles.answerText}>{card.answer}</Text>
            <View style={styles.divider} />
            <Text style={styles.explanationText}>{card.explanation}</Text>
          </View>

          <Pressable onPress={handleFlip} style={styles.flipButton}>
            <Text style={styles.flipText}>BACK TO QUESTION</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 1.3,
    position: "absolute",
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background.secondary,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.background.tertiary,
    padding: SPACING.lg,
    backfaceVisibility: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  cardBack: {
    backgroundColor: "#1C2128",
  },
  overlay: {
    borderRadius: RADIUS.lg,
    zIndex: 999,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  langBadge: {
    color: COLORS.accent.cyan,
    fontWeight: "bold",
    fontFamily: "monospace",
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.accent.cyan,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyBadge: {
    color: COLORS.text.secondary,
    fontSize: 10,
    fontWeight: "900",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  questionText: {
    color: COLORS.text.primary,
    fontSize: 20,
    fontFamily: "monospace",
    lineHeight: 30,
  },
  label: {
    color: COLORS.accent.green,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: SPACING.sm,
  },
  answerText: {
    color: COLORS.text.code,
    fontSize: 18,
    fontFamily: "monospace",
    marginBottom: SPACING.lg,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.background.tertiary,
    marginBottom: SPACING.lg,
  },
  explanationText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  flipButton: {
    alignSelf: "center",
    padding: SPACING.md,
    backgroundColor: "rgba(57, 211, 83, 0.1)",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.accent.green,
  },
  flipText: {
    color: COLORS.accent.green,
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: "bold",
  },
});
