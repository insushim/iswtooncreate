export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimiterStatus {
  availableTokens: number;
  maxTokens: number;
  queueLength: number;
  estimatedWait: number;
}

export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;
  private waitQueue: (() => void)[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(options: RateLimiterOptions) {
    this.maxTokens = options.maxRequests;
    this.tokens = this.maxTokens;
    this.refillRate = options.windowMs / options.maxRequests;
    this.lastRefill = Date.now();

    // Periodic token refill
    this.intervalId = setInterval(() => this.refill(), 1000);
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens--;
      return;
    }

    // Wait for token availability
    return new Promise((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed / this.refillRate;

    if (tokensToAdd >= 1) {
      this.tokens = Math.min(this.maxTokens, this.tokens + Math.floor(tokensToAdd));
      this.lastRefill = now;

      // Process waiting requests
      while (this.waitQueue.length > 0 && this.tokens >= 1) {
        this.tokens--;
        const resolve = this.waitQueue.shift()!;
        resolve();
      }
    }
  }

  getStatus(): RateLimiterStatus {
    this.refill();
    return {
      availableTokens: Math.floor(this.tokens),
      maxTokens: this.maxTokens,
      queueLength: this.waitQueue.length,
      estimatedWait: this.waitQueue.length * this.refillRate,
    };
  }

  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.waitQueue = [];
  }

  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.waitQueue = [];
  }
}
