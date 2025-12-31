// src/constants/config.ts

export const APP_CONFIG = {
  // App Info
  name: "HackStack",
  version: "1.0.0",
  buildNumber: 1,

  // Session Defaults
  defaultSessionLength: 10,
  maxSessionLength: 50,
  minSessionLength: 5,

  // XP System
  baseXP: 10,
  speedBonusThreshold: 5000, // ms
  speedBonusXP: 15,

  // Combo System
  comboMultiplierMax: 2.0,
  comboForFireMode: 5,

  // Review System
  reviewGracePeriodHours: 5, // Until 5am next day
  reviewBatchSize: 20,

  // Cache
  cacheExpiryDays: 7,
  maxCachedCards: 1000,

  // API
  apiTimeout: 10000, // 10 seconds
  maxRetries: 3,

  // Performance
  targetFPS: 60,
  maxConcurrentAnimations: 3,
};

export const STORAGE_KEYS = {
  onboardingComplete: "onboarding_complete",
  lastSessionDate: "last_session_date",
  streakFreezeTokens: "streak_freeze_tokens",
  preferredLanguage: "preferred_language",
};

export const ANALYTICS_EVENTS = {
  // Session Events
  sessionStarted: "session_started",
  sessionCompleted: "session_completed",
  sessionAbandoned: "session_abandoned",

  // Card Events
  cardSwiped: "card_swiped",
  cardCorrect: "card_correct",
  cardWrong: "card_wrong",
  cardSkipped: "card_skipped",

  // Gamification Events
  levelUp: "level_up",
  achievementUnlocked: "achievement_unlocked",
  comboReached: "combo_reached",
  fireModeActivated: "fire_mode_activated",

  // Review Events
  reviewSessionStarted: "review_session_started",
  reviewCardMastered: "review_card_mastered",

  // Engagement Events
  streakMaintained: "streak_maintained",
  streakBroken: "streak_broken",
  dailyGoalReached: "daily_goal_reached",
};

// src/constants/languages.ts
export interface Language {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    id: "JS",
    name: "JavaScript",
    icon: "JS",
    color: "#F7DF1E",
  },
  {
    id: "TS",
    name: "TypeScript",
    icon: "TS",
    color: "#3178C6",
  },
  {
    id: "Python",
    name: "Python",
    icon: "PY",
    color: "#3776AB",
  },
  {
    id: "Go",
    name: "Go",
    icon: "GO",
    color: "#00ADD8",
  },
];

export function getLanguageById(id: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find((lang) => lang.id === id);
}

// src/constants/difficulties.ts
export interface DifficultyConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  xpMultiplier: number;
}

export const DIFFICULTIES: DifficultyConfig[] = [
  {
    id: "easy",
    name: "Easy",
    description: "Perfect for beginners",
    color: "#39D353",
    xpMultiplier: 1.0,
  },
  {
    id: "medium",
    name: "Medium",
    description: "Balanced challenge",
    color: "#D29922",
    xpMultiplier: 1.2,
  },
  {
    id: "hard",
    name: "Hard",
    description: "For experienced devs",
    color: "#F78166",
    xpMultiplier: 1.5,
  },
  {
    id: "god",
    name: "God Mode",
    description: "Only for legends",
    color: "#BC8CFF",
    xpMultiplier: 2.0,
  },
];

// src/constants/messages.ts
export const FEEDBACK_MESSAGES = {
  correct: [
    "Nice! You actually read the docs.",
    "Correct! Unlike your last production deploy.",
    "You're on fire! (Unlike your console.)",
    "Well done! Stack Overflow would be proud.",
    "Nailed it! You might actually know what you're doing.",
  ],
  wrong: [
    "Did you just guess?",
    "undefined is not a function, and neither is your logic.",
    "Stack Overflow is calling... they miss you.",
    "Try again. I believe in you more than your QA team does.",
    "Close! But in programming, close means broken.",
  ],
  streak: [
    "Fire combo! Keep it going!",
    "You're unstoppable!",
    "The code flows through you!",
    "Legend in the making!",
  ],
  levelUp: [
    "Level up! You're evolving!",
    "New level unlocked! Nice work!",
    "Congratulations! You're getting scary good.",
    "Achievement unlocked: Not a complete beginner!",
  ],
};

export function getRandomMessage(
  category: keyof typeof FEEDBACK_MESSAGES
): string {
  const messages = FEEDBACK_MESSAGES[category];
  return messages[Math.floor(Math.random() * messages.length)];
}
