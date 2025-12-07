export interface QueueItem<T> {
  item: T;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  addedAt: number;
}

export interface QueueStatus {
  pending: number;
  processing: boolean;
  oldestItem: number;
}

export class BatchQueue<T = any, R = any> {
  private queue: QueueItem<T>[] = [];
  private processing: boolean = false;
  private batchSize: number = 5;
  private delayBetweenBatches: number = 2000;
  private processor: (item: T) => Promise<R>;

  constructor(processor: (item: T) => Promise<R>, options?: { batchSize?: number; delay?: number }) {
    this.processor = processor;
    if (options?.batchSize) this.batchSize = options.batchSize;
    if (options?.delay) this.delayBetweenBatches = options.delay;
  }

  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        item,
        resolve,
        reject,
        addedAt: Date.now(),
      });

      this.processQueue();
    });
  }

  async addBatch(items: T[]): Promise<R[]> {
    const promises = items.map((item) => this.add(item));
    return Promise.all(promises);
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);

      const results = await Promise.allSettled(
        batch.map((queueItem) => this.processor(queueItem.item))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          batch[index].resolve(result.value);
        } else {
          batch[index].reject(result.reason);
        }
      });

      if (this.queue.length > 0) {
        await this.delay(this.delayBetweenBatches);
      }
    }

    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStatus(): QueueStatus {
    return {
      pending: this.queue.length,
      processing: this.processing,
      oldestItem: this.queue.length > 0 ? Date.now() - this.queue[0].addedAt : 0,
    };
  }

  clear(): void {
    this.queue.forEach((item) => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  get length(): number {
    return this.queue.length;
  }

  get isProcessing(): boolean {
    return this.processing;
  }
}
