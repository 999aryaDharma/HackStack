// src/core/ai/validators.ts
import { Card } from "../../types";

// Profanity filter (basic - you can expand this)
const PROFANITY_LIST = [
  "fuck",
  "shit",
  "damn",
  "bitch",
  "ass",
  "bastard",
  "crap",
];

export function validateCard(data: unknown): Card | null {
  try {
    const card = data as Card;

    // Type validation
    if (!["snippet", "quiz", "trivia"].includes(card.type)) {
      console.warn("Invalid card type:", card.type);
      return null;
    }

    // Language validation
    if (!["JS", "TS", "Python", "Go"].includes(card.lang)) {
      console.warn("Invalid language:", card.lang);
      return null;
    }

    // Difficulty validation
    if (!["easy", "medium", "hard", "god"].includes(card.difficulty)) {
      console.warn("Invalid difficulty:", card.difficulty);
      return null;
    }

    // Required fields
    if (!card.question || !card.answer || !card.explanation) {
      console.warn("Missing required fields");
      return null;
    }

    // Length validation
    if (card.question.length > 500) {
      console.warn("Question too long");
      return null;
    }

    if (card.answer.length > 200) {
      console.warn("Answer too long");
      return null;
    }

    if (card.explanation.length > 400) {
      console.warn("Explanation too long");
      return null;
    }

    // Profanity check
    if (containsProfanity(card.roast || "")) {
      console.warn("Profanity detected in roast");
      card.roast = "That's not quite right. Let's try again.";
    }

    // Syntax validation for code snippets
    if (card.type === "snippet") {
      if (!validateCodeSyntax(card.question, card.lang)) {
        console.warn("Invalid code syntax");
        return null;
      }
    }

    return card;
  } catch (error) {
    console.error("Validation error:", error);
    return null;
  }
}

function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some((word) => lowerText.includes(word));
}

function validateCodeSyntax(code: string, lang: string): boolean {
  // Basic syntax checks
  try {
    if (lang === "JS" || lang === "TS") {
      // Check balanced brackets
      const opens = (code.match(/[{[(]/g) || []).length;
      const closes = (code.match(/[}\])]/g) || []).length;
      if (opens !== closes) return false;

      // Check for common syntax errors
      if (code.includes("function(") && !code.includes("function (")) {
        // Missing space is okay
      }

      // Basic validation passed
      return true;
    }

    if (lang === "Python") {
      // Check indentation consistency
      const lines = code.split("\n");
      const indents = lines
        .filter((l) => l.trim())
        .map((l) => l.match(/^\s*/)?.[0].length || 0);

      // All indents should be multiples of 4 or 2
      const validIndents = indents.every((i) => i % 4 === 0 || i % 2 === 0);

      return validIndents;
    }

    // For Go and others, basic validation
    return code.length > 0 && code.length < 1000;
  } catch {
    return false;
  }
}

// Schema validation helper
export function validateGeneratedCards(cards: unknown[]): Card[] {
  const valid: Card[] = [];

  for (const card of cards) {
    const validated = validateCard(card);
    if (validated) {
      valid.push(validated);
    }
  }

  return valid;
}
