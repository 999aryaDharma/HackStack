// src/core/theme/constants.ts

export const COLORS = {
  // Backgrounds (GitHub Dark inspired)
  background: {
    primary: "#0D1117",
    secondary: "#161B22",
    tertiary: "#21262D",
  },

  // Accents (Neon)
  accent: {
    green: "#39D353",
    red: "#F78166",
    blue: "#58A6FF",
    purple: "#BC8CFF",
    yellow: "#D29922",
    cyan: "#79C0FF",
  },

  // Text
  text: {
    primary: "#C9D1D9",
    secondary: "#8B949E",
    code: "#E6EDF3",
    inverse: "#0D1117", // For text on colored backgrounds
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
};

export const TYPOGRAPHY = {
  h1: { size: 32, weight: "900" as const, lineHeight: 40 },
  h2: { size: 24, weight: "700" as const, lineHeight: 32 },
  h3: { size: 20, weight: "600" as const, lineHeight: 28 },
  body: { size: 16, weight: "400" as const, lineHeight: 24 },
  small: { size: 14, weight: "400" as const, lineHeight: 20 },
  tiny: { size: 12, weight: "400" as const, lineHeight: 16 },
  code: { size: 14, weight: "400" as const, lineHeight: 22 },
  display: { size: 48, weight: "900" as const, lineHeight: 56 },
};

// Level Titles
export const TITLES = [
  "Script Kiddie",
  "Junior Dev",
  "Code Monkey",
  "Bug Fixer",
  "Feature Maker",
  "Refactorer",
  "Code Reviewer",
  "Tech Lead",
  "Architect",
  "10x Engineer",
  "Code Wizard",
];

// XP Curve
export function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function getLevelFromXP(xp: number): number {
  let level = 1;
  let totalXP = 0;

  while (totalXP <= xp) {
    level++;
    totalXP += getXPForLevel(level);
  }

  return level - 1;
}
