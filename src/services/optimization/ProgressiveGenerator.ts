export interface ProgressiveResult<T> {
  preview: T;
  previewCost: number;
  generateHighRes: () => Promise<{ result: T; cost: number }>;
}

export interface GenerationOptions {
  useCache?: boolean;
  forceRegenerate?: boolean;
}

export class ProgressiveGenerator<T> {
  private previewGenerator: (prompt: string, options: GenerationOptions) => Promise<{ result: T; cost: number }>;
  private highResGenerator: (prompt: string, options: GenerationOptions) => Promise<{ result: T; cost: number }>;

  constructor(
    previewGenerator: (prompt: string, options: GenerationOptions) => Promise<{ result: T; cost: number }>,
    highResGenerator: (prompt: string, options: GenerationOptions) => Promise<{ result: T; cost: number }>
  ) {
    this.previewGenerator = previewGenerator;
    this.highResGenerator = highResGenerator;
  }

  async generate(prompt: string, options: GenerationOptions = {}): Promise<ProgressiveResult<T>> {
    // Generate preview first
    const previewResult = await this.previewGenerator(prompt, options);

    return {
      preview: previewResult.result,
      previewCost: previewResult.cost,
      generateHighRes: async () => {
        const highResResult = await this.highResGenerator(prompt, {
          ...options,
          useCache: false, // Don't use cache for high-res to ensure quality
        });
        return {
          result: highResResult.result,
          cost: highResResult.cost,
        };
      },
    };
  }

  async generateBatch(
    prompts: string[],
    options: GenerationOptions = {}
  ): Promise<ProgressiveResult<T>[]> {
    const results = await Promise.all(
      prompts.map((prompt) => this.generate(prompt, options))
    );
    return results;
  }
}

// Helper to create a progressive image generator
export const createProgressiveImageGenerator = (
  generateImage: (prompt: string, resolution: 'preview' | 'high', options: GenerationOptions) => Promise<{ imageData: string; cost: number }>
) => {
  return new ProgressiveGenerator<string>(
    async (prompt, options) => {
      const result = await generateImage(prompt, 'preview', options);
      return { result: result.imageData, cost: result.cost };
    },
    async (prompt, options) => {
      const result = await generateImage(prompt, 'high', options);
      return { result: result.imageData, cost: result.cost };
    }
  );
};
