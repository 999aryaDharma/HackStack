// src/utils/validation.ts

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate JSON string
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string is empty or whitespace
 */
export function isEmpty(str: string): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Validate card data structure
 */
export function isValidCard(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;

  const card = data as any;

  return (
    typeof card.id === "string" &&
    typeof card.type === "string" &&
    typeof card.lang === "string" &&
    typeof card.question === "string" &&
    typeof card.answer === "string" &&
    typeof card.explanation === "string"
  );
}

// src/utils/logger.ts

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private isDevelopment = __DEV__;

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.isDevelopment && level === "debug") return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case "debug":
        console.log(prefix, message, data || "");
        break;
      case "info":
        console.info(prefix, message, data || "");
        break;
      case "warn":
        console.warn(prefix, message, data || "");
        break;
      case "error":
        console.error(prefix, message, data || "");
        break;
    }
  }

  debug(message: string, data?: any) {
    this.log("debug", message, data);
  }

  info(message: string, data?: any) {
    this.log("info", message, data);
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data);
  }

  error(message: string, data?: any) {
    this.log("error", message, data);
  }

  // Log function execution time
  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.debug(`${label} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }
}

export const logger = new Logger();
