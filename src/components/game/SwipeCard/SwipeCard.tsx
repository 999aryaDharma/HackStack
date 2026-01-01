// src/components/game/SwipeCard/SwipeCard.tsx
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, Dimensions, Pressable } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { COLORS, RADIUS, SPACING } from "../../../core/theme/constants";
import { Card } from "../../../types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeCardProps {
  card: Card;
  onSwipeLeft: () => void; // Salah/Lupa
  onSwipeRight: () => void; // Benar/Ingat
}

export function SwipeCard({ card, onSwipeLeft, onSwipeRight }: SwipeCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Animation Values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const flipRotation = useSharedValue(0); // 0 = depan, 180 = belakang

  useEffect(() => {
    scale.value = withSpring(1);
  }, []);

  // Flip Logic
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

  const gesture = Gesture.Pan()
    .onBegin(() => {
      scale.value = withSpring(1.02);
    })
    .onUpdate((event) => {
      // Hanya bisa swipe kalau sudah dibalik (sudah lihat jawaban)
      // ATAU kalau kamu mau mode hardcore: bisa swipe kapan aja.
      // Kita set: Bebas swipe kapan aja biar fluid.
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotation.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH, SCREEN_WIDTH],
        [-15, 15]
      );
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withSpring(SCREEN_WIDTH * 1.5);
        rotation.value = withSpring(20);
        runOnJS(onSwipeRight)();
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5);
        rotation.value = withSpring(-20);
        runOnJS(onSwipeLeft)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
        scale.value = withSpring(1);
      }
    });

  // Styles
  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

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

  const overlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      [0.5, 0, 0.5]
    );
    const backgroundColor =
      translateX.value > 0 ? COLORS.accent.green : COLORS.accent.red;
    return { backgroundColor, opacity };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.wrapper, cardStyle]}>
        {/* Color Overlay Feedback */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
        />

        {/* FRONT SIDE (Question) */}
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
            <Text style={styles.flipText}>TAP TO REVEAL</Text>
          </Pressable>
        </Animated.View>

        {/* BACK SIDE (Answer) */}
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
    backfaceVisibility: "hidden", // Penting untuk efek flip 3D
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  cardBack: {
    backgroundColor: "#1C2128", // Sedikit lebih terang
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
    borderWidth: 1,
    borderColor: COLORS.accent.cyan,
    paddingHorizontal: 8,
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
    fontSize: 22,
    fontFamily: "monospace",
    lineHeight: 32,
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
  },
  flipText: {
    color: COLORS.text.secondary,
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: "bold",
  },
});
