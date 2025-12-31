// src/app/index.tsx
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { SwipeCard } from "../components/game/SwipeCard/SwipeCard";
import { HUD } from "../components/game/HUD";
import { COLORS, SPACING, TITLES, RADIUS } from "../core/theme/constants";
import { Card, UserStats } from "../types";

// --- MOCK DATA ENGINE (Seolah-olah dari AI) ---
const MOCK_DECK: Card[] = [
  {
    id: "1",
    type: "snippet",
    lang: "JS",
    difficulty: "easy",
    question: "const a = [1, 2] + [3, 4];\nconsole.log(a);",
    answer: '"1,23,4"',
    explanation:
      'Di JS, operator + mengkonversi array jadi string dulu. "1,2" + "3,4" = "1,23,4". Weird, right?',
    roast: "Kamu pikir ini Python bisa merge list? Welcome to JS hell.",
  },
  {
    id: "2",
    type: "snippet",
    lang: "Python",
    difficulty: "easy",
    question: "print(0.1 + 0.2 == 0.3)",
    answer: "False",
    explanation:
      "Floating point math tidak akurat. Hasilnya 0.30000000000000004.",
    roast: "Matematika komputer itu beda sama matematika SD, boss.",
  },
  {
    id: "3",
    type: "snippet",
    lang: "TS",
    difficulty: "medium",
    question: "type T = keyof any;",
    answer: "string | number | symbol",
    explanation:
      "Di TypeScript, key object bisa berupa string, number, atau symbol.",
    roast: 'Pasti kamu jawabnya "string" doang kan? Dasar JS dev.',
  },
  {
    id: "4",
    type: "snippet",
    lang: "Go",
    difficulty: "hard",
    question: "Apa zero value dari slice di Go?",
    answer: "nil",
    explanation: "Bukan array kosong [], tapi nil.",
    roast: "Go dev palsu terdeteksi.",
  },
  {
    id: "5",
    type: "quiz",
    lang: "JS",
    difficulty: "easy",
    question: "Manakah yang BUKAN falsy value?",
    answer: "[] (Array kosong)",
    explanation:
      '0, "", null, undefined, NaN, false adalah falsy. Array kosong [] adalah truthy.',
    roast: "Hah? Array kosong dibilang falsy? Balik belajar dasar lagi gih.",
  },
];

export default function App() {
  // State Kartu
  const [deck, setDeck] = useState<Card[]>(MOCK_DECK);

  // State Gamifikasi
  const [stats, setStats] = useState<UserStats>({
    level: 1,
    currentXP: 0,
    nextLevelXP: 100,
    combo: 0,
    title: TITLES[0],
  });

  // State Feedback (Roast/LevelUp)
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    type: "info",
  });

  // Logic Swipe
  const handleSwipe = (direction: "left" | "right", card: Card) => {
    // Hapus kartu dari deck visual
    setTimeout(() => {
      setDeck((prev) => prev.filter((c) => c.id !== card.id));
    }, 200);

    if (direction === "right") {
      // BENAR / PAHAM
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleCorrect(card);
    } else {
      // SALAH / LUPA
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      handleWrong(card);
    }
  };

  const handleCorrect = (card: Card) => {
    setStats((prev) => {
      const xpGain = 20 + prev.combo * 5; // Combo multiplier
      const newXP = prev.currentXP + xpGain;

      // Cek Level Up
      if (newXP >= prev.nextLevelXP) {
        // Trigger Level Up
        setTimeout(() => showLevelUp(prev.level + 1), 500);
        return {
          ...prev,
          level: prev.level + 1,
          currentXP: newXP - prev.nextLevelXP, // Sisa XP carry over
          nextLevelXP: Math.floor(prev.nextLevelXP * 1.5), // Makin susah
          combo: prev.combo + 1,
          title: TITLES[Math.min(prev.level, TITLES.length - 1)],
        };
      }

      return {
        ...prev,
        currentXP: newXP,
        combo: prev.combo + 1,
      };
    });
  };

  const handleWrong = (card: Card) => {
    // Reset Combo & Tampilkan Roast
    setStats((prev) => ({ ...prev, combo: 0 }));

    // Tampilkan modal Roast (opsional, biar seru)
    setModalContent({
      title: "WRONG!",
      message: card.roast,
      type: "roast",
    });
    setModalVisible(true);
  };

  const showLevelUp = (newLevel: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalContent({
      title: "LEVEL UP!",
      message: `You are now Level ${newLevel}. Keep grinding!`,
      type: "levelup",
    });
    setModalVisible(true);
  };

  const resetDeck = () => {
    setDeck(MOCK_DECK);
    setStats((prev) => ({ ...prev, combo: 0 }));
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        {/* HEADS UP DISPLAY (XP & Level) */}
        <HUD stats={stats} />

        {/* DECK AREA */}
        <View style={styles.deckContainer}>
          {deck.length > 0 ? (
            deck.map((card, index) => {
              // Render logic: Hanya render 2 kartu teratas untuk performa
              if (index < deck.length - 2) return null;

              const isTopCard = index === deck.length - 1;

              return (
                <View
                  key={card.id}
                  style={StyleSheet.absoluteFill}
                  pointerEvents={isTopCard ? "auto" : "none"}
                >
                  {isTopCard ? (
                    <SwipeCard
                      card={card}
                      onSwipeLeft={() => handleSwipe("left", card)}
                      onSwipeRight={() => handleSwipe("right", card)}
                    />
                  ) : (
                    // Kartu di belakangnya (Dummy visual)
                    <View
                      style={[
                        styles.cardPlaceholder,
                        {
                          top: 20 * (deck.length - 1 - index),
                          transform: [{ scale: 0.95 }],
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })
          ) : (
            // EMPTY STATE
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💾</Text>
              <Text style={styles.emptyTitle}>Deck Cleared!</Text>
              <Text style={styles.emptySubtitle}>
                You survived the first wave.
              </Text>
              <Pressable style={styles.button} onPress={resetDeck}>
                <Text style={styles.buttonText}>RESTART RUN</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* MODAL (Roast / Level Up) */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                {
                  borderColor:
                    modalContent.type === "roast"
                      ? COLORS.accent.red
                      : COLORS.accent.green,
                },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  {
                    color:
                      modalContent.type === "roast"
                        ? COLORS.accent.red
                        : COLORS.accent.green,
                  },
                ]}
              >
                {modalContent.title}
              </Text>
              <Text style={styles.modalMessage}>{modalContent.message}</Text>
              <Pressable
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      modalContent.type === "roast"
                        ? COLORS.accent.red
                        : COLORS.accent.green,
                  },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>
                  {modalContent.type === "roast" ? "OUCH, OKAY." : "LET'S GO!"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  deckContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  cardPlaceholder: {
    width: Dimensions.get("window").width * 0.9,
    height: Dimensions.get("window").width * 1.3,
    backgroundColor: COLORS.background.tertiary,
    borderRadius: RADIUS.lg,
    position: "absolute",
    alignSelf: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: { fontSize: 60, marginBottom: SPACING.md },
  emptyTitle: {
    color: COLORS.text.primary,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    color: COLORS.text.secondary,
    fontSize: 14,
    marginBottom: SPACING.xl,
  },
  button: {
    backgroundColor: COLORS.accent.green,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  buttonText: {
    color: COLORS.background.primary,
    fontWeight: "bold",
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: COLORS.background.secondary,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: SPACING.md,
    letterSpacing: 2,
  },
  modalMessage: {
    color: COLORS.text.primary,
    textAlign: "center",
    fontSize: 16,
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  modalButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, // Corrected from sm to md based on design consistency
    borderRadius: RADIUS.md,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: COLORS.text.inverse,
    fontWeight: "bold",
    fontSize: 14,
  },
});
