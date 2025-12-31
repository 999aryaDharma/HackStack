// src/utils/performance.ts
import { logger } from "./validation";
import { InteractionManager } from "react-native";

/**
 * Performance monitoring utilities
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = __DEV__;

  /**
   * Start measuring a metric
   */
  start(metricName: string, metadata?: Record<string, any>) {
    if (!this.enabled) return;

    this.metrics.set(metricName, {
      name: metricName,
      startTime: performance.now(),
      metadata,
    });

    logger.debug(`Performance: Started measuring ${metricName}`, metadata);
  }

  /**
   * End measuring a metric
   */
  end(metricName: string, metadata?: Record<string, any>) {
    if (!this.enabled) return;

    const metric = this.metrics.get(metricName);
    if (!metric) {
      logger.warn(`Performance: No start time found for ${metricName}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const finalMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
      metadata: { ...metric.metadata, ...metadata },
    };

    this.metrics.set(metricName, finalMetric);

    logger.info(`Performance: ${metricName} took ${duration.toFixed(2)}ms`, {
      duration,
      ...finalMetric.metadata,
    });

    // Alert if exceeds threshold
    this.checkThreshold(metricName, duration);

    return finalMetric;
  }

  /**
   * Measure async function execution
   */
  async measureAsync<T>(
    metricName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(metricName, metadata);
    try {
      const result = await fn();
      this.end(metricName);
      return result;
    } catch (error) {
      this.end(metricName, { error: true });
      throw error;
    }
  }

  /**
   * Measure sync function execution
   */
  measure<T>(
    metricName: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    this.start(metricName, metadata);
    try {
      const result = fn();
      this.end(metricName);
      return result;
    } catch (error) {
      this.end(metricName, { error: true });
      throw error;
    }
  }

  /**
   * Get metric by name
   */
  getMetric(metricName: string): PerformanceMetric | undefined {
    return this.metrics.get(metricName);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }

  /**
   * Check if metric exceeds threshold and log warning
   */
  private checkThreshold(metricName: string, duration: number) {
    const thresholds: Record<string, number> = {
      card_render: 100, // 100ms
      swipe_response: 50, // 50ms
      ai_generation: 3000, // 3s
      db_query: 10, // 10ms
      navigation: 300, // 300ms
    };

    const threshold = thresholds[metricName];
    if (threshold && duration > threshold) {
      logger.warn(
        `Performance: ${metricName} exceeded threshold (${threshold}ms)`,
        {
          duration,
          threshold,
          exceeded: duration - threshold,
        }
      );
    }
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Wait for interactions to complete before executing
 * Useful for deferring non-critical work
 */
export function runAfterInteractions(callback: () => void) {
  InteractionManager.runAfterInteractions(() => {
    callback();
  });
}

/**
 * Measure component render performance
 */
export function measureRender(componentName: string) {
  return {
    onRenderStart: () => {
      performanceMonitor.start(`render_${componentName}`);
    },
    onRenderEnd: () => {
      performanceMonitor.end(`render_${componentName}`);
    },
  };
}

/**
 * FPS Counter (for animations)
 */
class FPSCounter {
  private frameCount = 0;
  private lastTime = performance.now();
  private currentFPS = 0;

  start() {
    this.tick();
  }

  private tick = () => {
    this.frameCount++;
    const currentTime = performance.now();
    const delta = currentTime - this.lastTime;

    if (delta >= 1000) {
      // Update every second
      this.currentFPS = Math.round((this.frameCount * 1000) / delta);
      logger.debug(`FPS: ${this.currentFPS}`);

      if (this.currentFPS < 50) {
        logger.warn("Low FPS detected", { fps: this.currentFPS });
      }

      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    requestAnimationFrame(this.tick);
  };

  getCurrentFPS(): number {
    return this.currentFPS;
  }
}

export const fpsCounter = new FPSCounter();

/**
 * Memory usage monitoring
 */
export function logMemoryUsage() {
  if (__DEV__ && (performance as any).memory) {
    const memory = (performance as any).memory;
    logger.debug("Memory usage", {
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    });
  }
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Batch updates for better performance
 */
export class BatchProcessor<T> {
  private queue: T[] = [];
  private processing = false;
  private batchSize: number;
  private processDelay: number;

  constructor(batchSize: number = 10, processDelay: number = 100) {
    this.batchSize = batchSize;
    this.processDelay = processDelay;
  }

  add(item: T) {
    this.queue.push(item);

    if (!this.processing) {
      this.scheduleProcessing();
    }
  }

  private scheduleProcessing() {
    this.processing = true;

    setTimeout(() => {
      this.processBatch();
    }, this.processDelay);
  }

  private processBatch() {
    const batch = this.queue.splice(0, this.batchSize);

    if (batch.length > 0) {
      logger.debug(`Processing batch of ${batch.length} items`);
      // Process batch here
    }

    if (this.queue.length > 0) {
      this.scheduleProcessing();
    } else {
      this.processing = false;
    }
  }
}
