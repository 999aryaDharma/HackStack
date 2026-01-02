// src/core/ai/geminiClient.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "@env";
import { Card, Difficulty } from "../../types";
import { validateCard } from "./validators";
import { buildSystemPrompt, buildUserPrompt } from "./prompts";

export interface GenerateRequest {
  language: "JS" | "TS" | "Python" | "Go";
  topics?: string[];
  difficulty: Difficulty;
  count: number;
  previousTopics?: string[];
}

export class GeminiClient {
  private client: GoogleGenerativeAI;
  private model = "gemini-2.5-flash";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API key not found in constructor");
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateCards(request: GenerateRequest): Promise<Card[]> {
    const genAI = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: buildSystemPrompt(),
    });

    const prompt = buildUserPrompt(request);

    try {
      const result = await genAI.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      });

      console.log("Gemini raw response:", result.response);
      const text = result.response.text();
      console.log("Gemini response text:", text);
      console.log("Gemini prompt feedback:", result.response.promptFeedback);


      // Remove markdown code blocks if present
      const cleaned = text.replace(/```json\n?|```\n?/g, "").trim();

      if (!cleaned) {
        throw new Error("Received empty response from Gemini API.");
      }

      const parsed = JSON.parse(cleaned);


      if (!parsed.cards || !Array.isArray(parsed.cards)) {
        throw new Error("Invalid response format");
      }

      // Validate each card
      const validCards: Card[] = [];
      for (const cardData of parsed.cards) {
        const validated = validateCard(cardData);
        if (validated) {
          validCards.push({
            ...validated,
            id: this.generateId(),
          });
        }
      }

      if (validCards.length === 0) {
        throw new Error("No valid cards generated");
      }

      return validCards;
    } catch (error) {
      console.error("Gemini API error:", error);
      throw error;
    }
  }

  private generateId(): string {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let geminiInstance: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!geminiInstance) {
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not found. Check your .env file.");
    }
    geminiInstance = new GeminiClient(GEMINI_API_KEY);
  }
  return geminiInstance;
}
