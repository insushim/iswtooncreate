import localforage from 'localforage';

interface CachedImage {
  id: string;
  data: string;
  mimeType: string;
  size: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  tags: string[];
}

export class ImageCache {
  private store: LocalForage;
  private maxCacheSize: number = 500 * 1024 * 1024; // 500MB

  constructor() {
    this.store = localforage.createInstance({
      name: 'webtoon-forge-images',
      storeName: 'image_cache',
    });
  }

  async get(id: string): Promise<string | null> {
    try {
      const cached = await this.store.getItem<CachedImage>(id);
      if (cached) {
        // Update access stats
        cached.lastAccessed = Date.now();
        cached.accessCount++;
        await this.store.setItem(id, cached);
        return cached.data;
      }
      return null;
    } catch (error) {
      console.error('Image cache get error:', error);
      return null;
    }
  }

  async set(id: string, imageData: string, tags: string[] = []): Promise<void> {
    try {
      // Estimate size
      const size = this.estimateSize(imageData);

      // Check if we need to free up space
      await this.ensureSpace(size);

      const cached: CachedImage = {
        id,
        data: imageData,
        mimeType: this.getMimeType(imageData),
        size,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1,
        tags,
      };

      await this.store.setItem(id, cached);
    } catch (error) {
      console.error('Image cache set error:', error);
    }
  }

  async delete(id: string): Promise<void> {
    await this.store.removeItem(id);
  }

  async getByTags(tags: string[]): Promise<CachedImage[]> {
    const results: CachedImage[] = [];

    await this.store.iterate<CachedImage, void>((value) => {
      if (tags.every((tag) => value.tags.includes(tag))) {
        results.push(value);
      }
    });

    return results;
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }

  async getStats(): Promise<{
    totalImages: number;
    totalSize: number;
    oldestImage: number;
    newestImage: number;
  }> {
    let totalImages = 0;
    let totalSize = 0;
    let oldestImage = Date.now();
    let newestImage = 0;

    await this.store.iterate<CachedImage, void>((value) => {
      totalImages++;
      totalSize += value.size;
      if (value.createdAt < oldestImage) oldestImage = value.createdAt;
      if (value.createdAt > newestImage) newestImage = value.createdAt;
    });

    return { totalImages, totalSize, oldestImage, newestImage };
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    const stats = await this.getStats();

    if (stats.totalSize + requiredSize <= this.maxCacheSize) {
      return;
    }

    // Collect all images and sort by last access (LRU)
    const images: CachedImage[] = [];
    await this.store.iterate<CachedImage, void>((value) => {
      images.push(value);
    });

    images.sort((a, b) => a.lastAccessed - b.lastAccessed);

    // Remove oldest until we have enough space
    let freedSpace = 0;
    const targetFree = requiredSize + (this.maxCacheSize * 0.1); // Free extra 10%

    for (const image of images) {
      if (stats.totalSize - freedSpace + requiredSize <= this.maxCacheSize - targetFree) {
        break;
      }
      await this.store.removeItem(image.id);
      freedSpace += image.size;
    }
  }

  private estimateSize(data: string): number {
    // Base64 encoded data is ~33% larger than binary
    return Math.ceil((data.length * 3) / 4);
  }

  private getMimeType(data: string): string {
    if (data.startsWith('data:image/png')) return 'image/png';
    if (data.startsWith('data:image/jpeg')) return 'image/jpeg';
    if (data.startsWith('data:image/webp')) return 'image/webp';
    return 'image/png';
  }
}

export const imageCache = new ImageCache();
