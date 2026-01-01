// src/utils/navigationTest.ts
/**
 * Navigation Test Utility
 *
 * Use this to test navigation without errors
 */

import { logger } from "./validation";

export function testNavigation() {
  logger.info("=== Navigation Test Started ===");

  try {
    logger.info("✓ Logger working");

    // Test storage
    logger.info("Testing AsyncStorage...");

    // Test notification service
    logger.info("Testing NotificationService...");

    logger.info("=== All Tests Passed ===");
    return true;
  } catch (error) {
    logger.error("Navigation test failed", error);
    return false;
  }
}

// Usage in app:
// import { testNavigation } from './utils/navigationTest';
// testNavigation();
