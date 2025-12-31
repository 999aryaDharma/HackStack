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
import { SwipeCard } from "../components/game/SwipeCard/SwipeCard";
import { HUD } from "../components/game/HUD";
import { COLORS, SPACING, RADIUS } from "../core/theme/constants";
import { Card } from "../types";
import {
  useStore,
  selectCurrentXP,
  selectCurrentLevel,
  selectComboCount,
} from "../store";

// Mock deck for now - will be replaced with AI generation
const MOCK_DECK: Card[] = [
  {
    id: "1",
    type: "snippet",
    lang: "JS",
    difficulty: "easy",
    question: "const a = [1, 2] + [3, 4];\nconsole.log(a);",
    answer: '"1,23,4"',
    explanation:
      'Di JS, operator + mengkonversi array jadi string dulu. "1,2" + "3,4" = "1,23,4".',
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
    roast: 'Pasti kamu jawabnya "string" doang kan?',
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
    roast: "Array kosong dibilang falsy? Balik belajar dasar lagi gih.",
  },
];

export default function App() {
  // Zustand State
  const currentXP = useStore(selectCurrentXP);
  const currentLevel = useStore(selectCurrentLevel);
  const comboCount = useStore(selectComboCount);
  const currentTitle = useStore((state) => state.currentTitle);

  const recordCorrect = useStore((state) => state.recordCorrect);
  const recordWrong = useStore((state) => state.recordWrong);
  const startSession = useStore((state) => state.startSession);
  const endSession = useStore((state) => state.endSession);
  const setQueue = useStore((state) => state.setQueue);

  // Local state for deck
  const [localDeck, setLocalDeck] = useState<Card[]>([]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    type: "info",
  });

  // Initialize deck on mount
  useEffect(() => {
    startSession();
    setQueue(MOCK_DECK);
    setLocalDeck(MOCK_DECK);
  }, []);

  // Handle swipe logic
  const handleSwipe = (direction: "left" | "right", card: Card) => {
    // Remove card from visual deck
    setTimeout(() => {
      setLocalDeck((prev) => prev.filter((c) => c.id !== card.id));
    }, 200);

    if (direction === "right") {
      // CORRECT
      recordCorrect();
    } else {
      // WRONG
      recordWrong();
      showRoast(card.roast);
    }
  };

  const showRoast = (message: string) => {
    setModalContent({
      title: "WRONG!",
      message,
      type: "roast",
    });
    setModalVisible(true);
  };

  const resetDeck = () => {
    setLocalDeck(MOCK_DECK);
    setQueue(MOCK_DECK);
    startSession();
  };

  // Calculate next level XP
  const nextLevelXP = Math.floor(100 * Math.pow(currentLevel + 1, 1.5));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        {/* HUD */}
        <HUD
          stats={{
            level: currentLevel,
            currentXP,
            nextLevelXP,
            combo: comboCount,
            title: currentTitle,
          }}
        />

        {/* Deck Area */}
        <View style={styles.deckContainer}>
          {localDeck.length > 0 ? (
            localDeck.map((card, index) => {
              // Only render top 2 cards for performance
              if (index < localDeck.length - 2) return null;

              const isTopCard = index === localDeck.length - 1;

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
                    <View
                      style={[
                        styles.cardPlaceholder,
                        {
                          top: 20 * (localDeck.length - 1 - index),
                          transform: [{ scale: 0.95 }],
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })
          ) : (
            // Empty State
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>DECK CLEARED</Text>
              <Text style={styles.emptyTitle}>Session Complete</Text>
              <Text style={styles.emptySubtitle}>
                You earned {currentXP} XP this session
              </Text>
              <Pressable style={styles.button} onPress={resetDeck}>
                <Text style={styles.buttonText}>START NEW SESSION</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Modal for Roast/Feedback */}
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
                  {modalContent.type === "roast" ? "GOT IT" : "CONTINUE"}
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
  emptyIcon: {
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.accent.green,
    marginBottom: SPACING.md,
  },
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
    paddingVertical: SPACING.md,
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
