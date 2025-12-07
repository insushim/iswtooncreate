import localforage from 'localforage';

interface CacheEntry {
  key: string;
  value: string;
  type: 'text' | 'image';
  keywords: string[];
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  totalEntries: number;
  textEntries: number;
  imageEntries: number;
  memoryEntries: number;
  estimatedSize: number;
  hitRate: number;
}

export class SemanticCache {
  private store: LocalForage;
  private memoryCache: Map<string, CacheEntry>;
  private maxMemoryEntries: number = 100;
  private ttl: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor() {
    this.ttl = parseInt(import.meta.env.VITE_CACHE_TTL || '3600000');

    this.store = localforage.createInstance({
      name: 'webtoon-forge-cache',
      storeName: 'semantic_cache',
    });

    this.memoryCache = new Map();
    this.loadFrequentEntries();
  }

  async get(
    prompt: string,
    type: 'text' | 'image',
    similarityThreshold: number = 0.85
  ): Promise<string | null> {
    const normalizedPrompt = this.normalizePrompt(prompt);
    const cacheKey = this.generateKey(normalizedPrompt, type);

    // 1. Check exact match
    const exactMatch = await this.getExact(cacheKey);
    if (exactMatch) {
      this.hits++;
      await this.updateAccessStats(cacheKey);
      return exactMatch.value;
    }

    // 2. Search for similar prompts (semantic caching)
    const similarEntry = await this.findSimilar(normalizedPrompt, type, similarityThreshold);
    if (similarEntry) {
      this.hits++;
      await this.updateAccessStats(similarEntry.key);
      return similarEntry.value;
    }

    this.misses++;
    return null;
  }

  async set(prompt: string, value: string, type: 'text' | 'image'): Promise<void> {
    const normalizedPrompt = this.normalizePrompt(prompt);
    const cacheKey = this.generateKey(normalizedPrompt, type);
    const keywords = this.extractKeywords(normalizedPrompt);

    const entry: CacheEntry = {
      key: cacheKey,
      value,
      type,
      keywords,
      createdAt: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    };

    // Save to memory cache
    this.memoryCache.set(cacheKey, entry);

    // Save to IndexedDB
    await this.store.setItem(cacheKey, entry);

    // Manage memory cache size
    if (this.memoryCache.size > this.maxMemoryEntries) {
      this.evictLeastUsed();
    }
  }

  private async getExact(key: string): Promise<CacheEntry | null> {
    // Check memory cache
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      if (this.isValid(entry)) {
        return entry;
      }
      this.memoryCache.delete(key);
    }

    // Check IndexedDB
    const stored = await this.store.getItem<CacheEntry>(key);
    if (stored && this.isValid(stored)) {
      this.memoryCache.set(key, stored);
      return stored;
    }

    return null;
  }

  private async findSimilar(
    prompt: string,
    type: 'text' | 'image',
    threshold: number
  ): Promise<CacheEntry | null> {
    const promptKeywords = this.extractKeywords(prompt);
    let bestMatch: CacheEntry | null = null;
    let bestScore = threshold;

    // Search in memory cache
    for (const entry of this.memoryCache.values()) {
      if (entry.type !== type || !this.isValid(entry)) continue;

      const similarity = this.calculateSimilarity(promptKeywords, entry.keywords);
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = entry;
      }
    }

    // If better match needed, search IndexedDB
    if (!bestMatch || bestScore < 0.95) {
      const allEntries: CacheEntry[] = [];
      await this.store.iterate<CacheEntry, void>((entry) => {
        if (entry.type === type && this.isValid(entry)) {
          allEntries.push(entry);
        }
      });

      for (const entry of allEntries) {
        const similarity = this.calculateSimilarity(promptKeywords, entry.keywords);
        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = entry;
        }
      }
    }

    return bestMatch;
  }

  private normalizePrompt(prompt: string): string {
    return prompt
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s가-힣]/g, '')
      .trim();
  }

  private generateKey(prompt: string, type: string): string {
    const hash = this.hashString(prompt);
    return `${type}_${hash}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at',
      '이', '가', '을', '를', '에', '에서', '의', '와', '과', '는', '은',
    ]);

    return text
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .slice(0, 20);
  }

  private calculateSimilarity(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.createdAt < this.ttl;
  }

  private async updateAccessStats(key: string): Promise<void> {
    const entry = this.memoryCache.get(key);
    if (entry) {
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      await this.store.setItem(key, entry);
    }
  }

  private async loadFrequentEntries(): Promise<void> {
    const entries: CacheEntry[] = [];

    await this.store.iterate<CacheEntry, void>((entry) => {
      if (this.isValid(entry)) {
        entries.push(entry);
      }
    });

    entries.sort((a, b) => b.accessCount - a.accessCount);

    for (const entry of entries.slice(0, this.maxMemoryEntries)) {
      this.memoryCache.set(entry.key, entry);
    }
  }

  private evictLeastUsed(): void {
    let oldest: { key: string; lastAccessed: number } | null = null;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (!oldest || entry.lastAccessed < oldest.lastAccessed) {
        oldest = { key, lastAccessed: entry.lastAccessed };
      }
    }

    if (oldest) {
      this.memoryCache.delete(oldest.key);
    }
  }

  async cleanup(): Promise<void> {
    const keysToDelete: string[] = [];

    await this.store.iterate<CacheEntry, void>((entry, key) => {
      if (!this.isValid(entry)) {
        keysToDelete.push(key);
      }
    });

    for (const key of keysToDelete) {
      await this.store.removeItem(key);
      this.memoryCache.delete(key);
    }
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? (this.hits / total) * 100 : 0;
  }

  async getStats(): Promise<CacheStats> {
    let totalEntries = 0;
    let textEntries = 0;
    let imageEntries = 0;
    let totalSize = 0;

    await this.store.iterate<CacheEntry, void>((entry) => {
      totalEntries++;
      if (entry.type === 'text') textEntries++;
      if (entry.type === 'image') imageEntries++;
      totalSize += entry.value.length;
    });

    return {
      totalEntries,
      textEntries,
      imageEntries,
      memoryEntries: this.memoryCache.size,
      estimatedSize: totalSize,
      hitRate: this.getHitRate(),
    };
  }
}
