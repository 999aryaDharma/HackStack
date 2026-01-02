// src/core/hooks/useCardPhysics.ts
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { Gesture } from "react-native-gesture-handler";
import { Dimensions } from "react-native";
import { useHaptics } from "./useHaptics";
import { useSounds } from "./useSounds";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_VELOCITY = 1000;

interface CardPhysicsConfig {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onCardGrabbed?: () => void;
  onCardReleased?: () => void;
}

export function useCardPhysics(config: CardPhysicsConfig) {
  const { trigger } = useHaptics();
  const { play } = useSounds();

  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      // Card grabbed effect
      scale.value = withSpring(1.05, { damping: 20 });
      runOnJS(trigger)("light");
      if (config.onCardGrabbed) {
        runOnJS(config.onCardGrabbed)();
      }
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.4; // Dampen vertical movement

      // Rotation based on horizontal drag
      rotation.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        [-20, 0, 20],
        Extrapolate.CLAMP
      );

      // Reduce opacity as card moves away
      opacity.value = interpolate(
        Math.abs(event.translationX),
        [0, SWIPE_THRESHOLD * 1.5],
        [1, 0.3],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      const velocityX = event.velocityX;
      const shouldSwipeRight =
        translateX.value > SWIPE_THRESHOLD || velocityX > SWIPE_VELOCITY;
      const shouldSwipeLeft =
        translateX.value < -SWIPE_THRESHOLD || velocityX < -SWIPE_VELOCITY;

      if (shouldSwipeRight) {
        // Swipe RIGHT (Correct)
        translateX.value = withSpring(SCREEN_WIDTH * 1.5, {
          velocity: velocityX,
          damping: 15,
        });
        rotation.value = withSpring(30);
        opacity.value = withTiming(0, { duration: 300 });

        runOnJS(trigger)("medium");
        runOnJS(play)("correct");
        runOnJS(config.onSwipeRight)();
      } else if (shouldSwipeLeft) {
        // Swipe LEFT (Wrong)
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5, {
          velocity: velocityX,
          damping: 15,
        });
        rotation.value = withSpring(-30);
        opacity.value = withTiming(0, { duration: 300 });

        runOnJS(trigger)("heavy");
        runOnJS(play)("wrong");
        runOnJS(config.onSwipeLeft)();
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20 });
        translateY.value = withSpring(0, { damping: 20 });
        rotation.value = withSpring(0, { damping: 20 });
        scale.value = withSpring(1, { damping: 20 });
        opacity.value = withTiming(1, { duration: 200 });

        runOnJS(trigger)("light");
        if (config.onCardReleased) {
          runOnJS(config.onCardReleased)();
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // Overlay color indicator
  const overlayStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
      [1, 0, 1]
    );

    return {
      opacity: Math.abs(backgroundColor),
      backgroundColor:
        translateX.value > 0
          ? "rgba(57, 211, 83, 0.3)"
          : "rgba(247, 129, 102, 0.3)",
    };
  });

  return {
    gesture,
    animatedStyle,
    overlayStyle,
  };
}
