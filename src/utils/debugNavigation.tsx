// src/utils/debugNavigation.ts
/**
 * Debug Navigation Utility
 *
 * Use this to find where navigation errors occur
 */

import { logger } from "./validation";

let navigationStack: string[] = [];

export function trackNavigation(componentName: string, action: string) {
  const entry = `[${new Date().toISOString()}] ${componentName}: ${action}`;
  navigationStack.push(entry);

  logger.debug("Navigation tracked", { componentName, action });

  // Keep only last 20 entries
  if (navigationStack.length > 20) {
    navigationStack = navigationStack.slice(-20);
  }
}

export function getNavigationStack(): string[] {
  return [...navigationStack];
}

export function printNavigationStack() {
  logger.info("=== Navigation Stack ===");
  navigationStack.forEach((entry, index) => {
    logger.info(`${index + 1}. ${entry}`);
  });
  logger.info("=== End Stack ===");
}

export function clearNavigationStack() {
  navigationStack = [];
  logger.info("Navigation stack cleared");
}

// Usage:
// import { trackNavigation } from './utils/debugNavigation';
//
// In component:
// useEffect(() => {
//   trackNavigation('MyComponent', 'mounted');
//   return () => trackNavigation('MyComponent', 'unmounted');
// }, []);
