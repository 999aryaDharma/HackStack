// src/utils/logger.ts
// ============================================================================
// CENTRALIZED LOGGING UTILITY
// Provides consistent logging across the application
// ============================================================================

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = __DEV__;
  private minLevel: LogLevel = __DEV__ ? "debug" : "info";

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentIndex = levels.indexOf(this.minLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (context && Object.keys(context).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(context)}`;
    }

    return `${prefix} ${message}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case "debug":
        console.log(formattedMessage);
        break;
      case "info":
        console.info(formattedMessage);
        break;
      case "warn":
        console.warn(formattedMessage);
        break;
      case "error":
        console.error(formattedMessage);
        break;
    }
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  /**
   * Log errors
   */
  error(message: string, error?: unknown, context?: LogContext) {
    const errorContext: LogContext = { ...context };

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errorContext.error = error;
    }

    this.log("error", message, errorContext);
  }

  /**
   * Measure and log execution time of async functions
   */
  async time<T>(
    label: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = performance.now();
    this.debug(`${label} - Started`, context);

    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.info(`${label} - Completed`, {
        ...context,
        durationMs: duration.toFixed(2),
      });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} - Failed`, error, {
        ...context,
        durationMs: duration.toFixed(2),
      });
      throw error;
    }
  }

  /**
   * Measure and log execution time of sync functions
   */
  timeSync<T>(label: string, fn: () => T, context?: LogContext): T {
    const start = performance.now();
    this.debug(`${label} - Started`, context);

    try {
      const result = fn();
      const duration = performance.now() - start;
      this.info(`${label} - Completed`, {
        ...context,
        durationMs: duration.toFixed(2),
      });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} - Failed`, error, {
        ...context,
        durationMs: duration.toFixed(2),
      });
      throw error;
    }
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel) {
    this.minLevel = level;
    this.info("Log level changed", { newLevel: level });
  }

  /**
   * Create a scoped logger with default context
   */
  scope(defaultContext: LogContext): Logger {
    const scopedLogger = new Logger();

    const originalLog = scopedLogger.log.bind(scopedLogger);
    scopedLogger.log = (
      level: LogLevel,
      message: string,
      context?: LogContext
    ) => {
      originalLog(level, message, { ...defaultContext, ...context });
    };

    return scopedLogger;
  }
}

// Singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogLevel, LogContext };
