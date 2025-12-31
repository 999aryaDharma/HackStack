// src/core/hooks/useSounds.ts
import { useEffect, useRef } from "react";
import { Audio } from "expo-av";
import { useStore } from "../../store";

// Sound file paths (you need to add these to assets/sounds/)
const SOUNDS = {
  swipe: require("../../../assets/sounds/swipe.wav"),
  correct: require("../../../assets/sounds/correct.mp3"),
  wrong: require("../../../assets/sounds/wrong.mp3"),
  combo: require("../../../assets/sounds/combo.wav"),
  levelUp: require("../../../assets/sounds/levelup.mp3"),
};
  
export function useSounds() {
  const soundEnabled = useStore((state) => state.soundEnabled);
  const soundsRef = useRef<Record<string, Audio.Sound>>({});
  const isLoadedRef = useRef(false);

  useEffect(() => {
    // Preload all sounds on mount
    const loadSounds = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });

        for (const [key, source] of Object.entries(SOUNDS)) {
          const { sound } = await Audio.Sound.createAsync(source, {
            shouldPlay: false,
          });
          soundsRef.current[key] = sound;
        }

        isLoadedRef.current = true;
      } catch (error) {
        console.error("Failed to load sounds:", error);
      }
    };

    loadSounds();

    // Cleanup on unmount
    return () => {
      Object.values(soundsRef.current).forEach((sound) => {
        sound.unloadAsync();
      });
    };
  }, []);

  const play = async (soundKey: keyof typeof SOUNDS) => {
    if (!soundEnabled || !isLoadedRef.current) return;

    try {
      const sound = soundsRef.current[soundKey];
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.error(`Failed to play sound: ${soundKey}`, error);
    }
  };

  return { play };
}
