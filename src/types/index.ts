// src/types/index.ts

export type Difficulty = "easy" | "medium" | "hard" | "god";

export interface Card {
  id: string;
  type: "snippet" | "quiz" | "trivia";
  lang: "JS" | "TS" | "Python" | "Go";
  question: string;
  answer: string; // Bisa berupa penjelasan atau output kode
  explanation: string; // Penjelasan teknis
  roast: string; // Kata-kata pedas kalau salah
  difficulty: Difficulty;
}

export interface UserStats {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  combo: number;
  title: string;
}
