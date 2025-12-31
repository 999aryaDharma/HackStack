// src/core/ai/prompts.ts
import { GenerateRequest } from "./geminiClient";

export function buildSystemPrompt(): string {
  return `You are a witty, slightly sarcastic senior software engineer who loves teaching through interactive code challenges.

YOUR PERSONALITY:
- Encouraging but brutally honest about mistakes
- Use humor to make learning memorable
- Reference real-world developer pain points
- Keep explanations concise (2-3 sentences max)
- When users are wrong, roast them gently but constructively

CONTENT GUIDELINES:
- Generate syntactically correct, runnable code
- Use realistic variable names (not foo/bar)
- Include edge cases and gotchas
- Make "roast" messages funny but educational
- Ensure diversity in topics within the same language

RESPONSE FORMAT:
You MUST respond with ONLY valid JSON. No markdown, no preamble, no explanation.
Structure:
{
  "cards": [
    {
      "type": "snippet" | "quiz" | "trivia",
      "lang": "JS" | "TS" | "Python" | "Go",
      "difficulty": "easy" | "medium" | "hard" | "god",
      "question": "code or question text",
      "answer": "correct answer",
      "explanation": "why this is correct",
      "roast": "sarcastic but helpful comment for wrong answers"
    }
  ]
}`;
}

export function buildUserPrompt(request: GenerateRequest): string {
  const { language, topics, difficulty, count, previousTopics } = request;

  const topicsStr = topics?.length
    ? `Focus on these topics: ${topics.join(", ")}`
    : "Choose diverse fundamental topics";

  const avoidStr = previousTopics?.length
    ? `Avoid these recently covered topics: ${previousTopics.join(", ")}`
    : "";

  return `Generate ${count} unique coding challenge cards for ${language}.

REQUIREMENTS:
- Difficulty level: ${difficulty}
- ${topicsStr}
${avoidStr ? `- ${avoidStr}` : ""}

CARD TYPE DISTRIBUTION:
- 50% snippet (show code, ask for output/behavior)
- 30% quiz (multiple choice conceptual questions)
- 20% trivia (interesting language facts)

QUALITY CHECKLIST:
- All code must be syntactically valid
- Questions should be clear and unambiguous
- Explanations should teach, not just state facts
- Roasts should be witty but not mean-spirited
- Answers should be concise (1-2 lines for snippets)

Generate ${count} cards now in JSON format:`;
}

// Topic suggestions by language
export const TOPICS_BY_LANGUAGE = {
  JS: [
    "arrays",
    "objects",
    "closures",
    "promises",
    "async-await",
    "prototypes",
    "this-keyword",
    "event-loop",
    "coercion",
    "destructuring",
    "spread-rest",
    "modules",
  ],
  TS: [
    "types",
    "interfaces",
    "generics",
    "utility-types",
    "type-guards",
    "enums",
    "decorators",
    "mapped-types",
    "conditional-types",
  ],
  Python: [
    "lists",
    "dictionaries",
    "comprehensions",
    "decorators",
    "generators",
    "context-managers",
    "asyncio",
    "classes",
    "magic-methods",
  ],
  Go: [
    "slices",
    "maps",
    "channels",
    "goroutines",
    "interfaces",
    "structs",
    "pointers",
    "defer",
    "error-handling",
  ],
};
