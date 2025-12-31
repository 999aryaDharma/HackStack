// src/constants/achievements.ts

export type AchievementCategory =
  | "progress"
  | "skill"
  | "streak"
  | "mastery"
  | "social"
  | "special";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  xpReward: number;
  hidden?: boolean;
  condition: (stats: UserAchievementStats) => boolean;
}

export interface UserAchievementStats {
  totalSessions: number;
  totalCardsSwiped: number;
  totalCorrect: number;
  totalWrong: number;
  maxCombo: number;
  dailyStreak: number;
  longestStreak: number;
  currentLevel: number;
  masteryScores: Record<string, number>;
  perfectSessions: number;
  currentSessionStats?: {
    total: number;
    correct: number;
    combo: number;
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  // PROGRESS ACHIEVEMENTS
  {
    id: "first_steps",
    name: "First Steps",
    description: "Complete your first session",
    category: "progress",
    rarity: "common",
    icon: "target",
    xpReward: 50,
    condition: (stats) => stats.totalSessions >= 1,
  },
  {
    id: "century",
    name: "Century",
    description: "Swipe 100 cards",
    category: "progress",
    rarity: "common",
    icon: "hundred",
    xpReward: 100,
    condition: (stats) => stats.totalCardsSwiped >= 100,
  },
  {
    id: "half_thousand",
    name: "Half Thousand",
    description: "Swipe 500 cards",
    category: "progress",
    rarity: "rare",
    icon: "fire",
    xpReward: 500,
    condition: (stats) => stats.totalCardsSwiped >= 500,
  },
  {
    id: "grand",
    name: "The Grand",
    description: "Swipe 1,000 cards",
    category: "progress",
    rarity: "epic",
    icon: "trophy",
    xpReward: 1000,
    condition: (stats) => stats.totalCardsSwiped >= 1000,
  },
  {
    id: "ten_thousand",
    name: "10K Club",
    description: "Swipe 10,000 cards",
    category: "progress",
    rarity: "legendary",
    icon: "crown",
    xpReward: 5000,
    condition: (stats) => stats.totalCardsSwiped >= 10000,
  },

  // SKILL ACHIEVEMENTS
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Complete a session with 100% accuracy",
    category: "skill",
    rarity: "rare",
    icon: "star",
    xpReward: 200,
    condition: (stats) => {
      if (!stats.currentSessionStats) return false;
      const { total, correct } = stats.currentSessionStats;
      return total >= 5 && correct === total;
    },
  },
  {
    id: "combo_master",
    name: "Combo Master",
    description: "Reach a 20x combo",
    category: "skill",
    rarity: "epic",
    icon: "zap",
    xpReward: 500,
    condition: (stats) => stats.maxCombo >= 20,
  },
  {
    id: "combo_god",
    name: "Combo God",
    description: "Reach a 50x combo",
    category: "skill",
    rarity: "legendary",
    icon: "flame",
    xpReward: 2000,
    condition: (stats) => stats.maxCombo >= 50,
  },
  {
    id: "quick_learner",
    name: "Quick Learner",
    description: "Get 90%+ accuracy in first 50 cards",
    category: "skill",
    rarity: "rare",
    icon: "brain",
    xpReward: 300,
    condition: (stats) => {
      if (stats.totalCardsSwiped < 50) return false;
      const accuracy = stats.totalCorrect / stats.totalCardsSwiped;
      return accuracy >= 0.9;
    },
  },
  {
    id: "ace",
    name: "Ace",
    description: "Complete 5 perfect sessions",
    category: "skill",
    rarity: "epic",
    icon: "diamond",
    xpReward: 1000,
    condition: (stats) => stats.perfectSessions >= 5,
  },

  // STREAK ACHIEVEMENTS
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    category: "streak",
    rarity: "common",
    icon: "calendar",
    xpReward: 200,
    condition: (stats) => stats.dailyStreak >= 7,
  },
  {
    id: "month_master",
    name: "Month Master",
    description: "Maintain a 30-day streak",
    category: "streak",
    rarity: "rare",
    icon: "calendar-check",
    xpReward: 1000,
    condition: (stats) => stats.dailyStreak >= 30,
  },
  {
    id: "year_legend",
    name: "Year Legend",
    description: "Maintain a 365-day streak",
    category: "streak",
    rarity: "legendary",
    icon: "trophy-star",
    xpReward: 10000,
    condition: (stats) => stats.dailyStreak >= 365,
  },
  {
    id: "comeback_kid",
    name: "Comeback Kid",
    description: "Restore a broken streak",
    category: "streak",
    rarity: "common",
    icon: "refresh",
    xpReward: 100,
    hidden: true,
    condition: (stats) => {
      return stats.longestStreak > stats.dailyStreak && stats.dailyStreak >= 3;
    },
  },

  // MASTERY ACHIEVEMENTS
  {
    id: "js_novice",
    name: "JS Novice",
    description: "Reach 70% mastery in JavaScript",
    category: "mastery",
    rarity: "common",
    icon: "code",
    xpReward: 150,
    condition: (stats) => (stats.masteryScores["JS"] || 0) >= 70,
  },
  {
    id: "js_expert",
    name: "JS Expert",
    description: "Reach 90% mastery in JavaScript",
    category: "mastery",
    rarity: "epic",
    icon: "code-slash",
    xpReward: 500,
    condition: (stats) => (stats.masteryScores["JS"] || 0) >= 90,
  },
  {
    id: "polyglot",
    name: "Polyglot",
    description: "Reach 70% mastery in 3 languages",
    category: "mastery",
    rarity: "epic",
    icon: "globe",
    xpReward: 1000,
    condition: (stats) => {
      const masteryCount = Object.values(stats.masteryScores).filter(
        (score) => score >= 70
      ).length;
      return masteryCount >= 3;
    },
  },

  // LEVEL ACHIEVEMENTS
  {
    id: "level_10",
    name: "Rising Star",
    description: "Reach level 10",
    category: "progress",
    rarity: "common",
    icon: "arrow-up",
    xpReward: 200,
    condition: (stats) => stats.currentLevel >= 10,
  },
  {
    id: "level_25",
    name: "Experienced",
    description: "Reach level 25",
    category: "progress",
    rarity: "rare",
    icon: "chart-line",
    xpReward: 500,
    condition: (stats) => stats.currentLevel >= 25,
  },
  {
    id: "level_50",
    name: "Veteran",
    description: "Reach level 50",
    category: "progress",
    rarity: "epic",
    icon: "shield",
    xpReward: 2000,
    condition: (stats) => stats.currentLevel >= 50,
  },
  {
    id: "level_99",
    name: "Maxed Out",
    description: "Reach level 99",
    category: "progress",
    rarity: "legendary",
    icon: "infinity",
    xpReward: 10000,
    condition: (stats) => stats.currentLevel >= 99,
  },

  // SPECIAL/HIDDEN ACHIEVEMENTS
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Complete a session before 8 AM",
    category: "special",
    rarity: "rare",
    icon: "sunrise",
    xpReward: 100,
    hidden: true,
    condition: () => {
      const hour = new Date().getHours();
      return hour >= 5 && hour < 8;
    },
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Complete a session after midnight",
    category: "special",
    rarity: "rare",
    icon: "moon",
    xpReward: 100,
    hidden: true,
    condition: () => {
      const hour = new Date().getHours();
      return hour >= 0 && hour < 5;
    },
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Complete 10 cards in under 1 minute",
    category: "special",
    rarity: "epic",
    icon: "lightning",
    xpReward: 500,
    hidden: true,
    condition: (stats) => {
      if (!stats.currentSessionStats) return false;
      return stats.currentSessionStats.total >= 10;
    },
  },
];

// Helper to get achievements by category
export function getAchievementsByCategory(
  category: AchievementCategory
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

// Helper to get achievements by rarity
export function getAchievementsByRarity(
  rarity: AchievementRarity
): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.rarity === rarity);
}

// Helper to check unlockable achievements
export function checkUnlockableAchievements(
  stats: UserAchievementStats,
  unlockedIds: string[]
): Achievement[] {
  const unlockable: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip already unlocked
    if (unlockedIds.includes(achievement.id)) continue;

    // Check condition
    if (achievement.condition(stats)) {
      unlockable.push(achievement);
    }
  }

  return unlockable;
}
