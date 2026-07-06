import { logger } from './logger';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  name?: string;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly name: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeoutMs = options.resetTimeoutMs || 10000;
    this.name = options.name || 'CircuitBreaker';
  }

  async execute<T>(action: () => Promise<T>, fallback?: () => Promise<T> | T): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        logger.warn(`[CircuitBreaker: ${this.name}] Entering HALF_OPEN state. Testing connection...`);
      } else {
        logger.warn(`[CircuitBreaker: ${this.name}] Circuit is OPEN. Blocking request and executing fallback.`);
        if (fallback) return fallback();
        throw new Error(`[CircuitBreaker: ${this.name}] Circuit is OPEN. Service temporarily unavailable.`);
      }
    }

    try {
      const result = await action();
      if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        logger.info(`[CircuitBreaker: ${this.name}] Connection restored. Circuit CLOSED.`);
      }
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      logger.error(`[CircuitBreaker: ${this.name}] Execution error (${this.failureCount}/${this.failureThreshold}):`, error);
      if (this.failureCount >= this.failureThreshold || this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.OPEN;
        logger.error(`[CircuitBreaker: ${this.name}] Failure threshold reached. Circuit tripped OPEN.`);
      }
      if (fallback) return fallback();
      throw error;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
