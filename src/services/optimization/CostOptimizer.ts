import type { CostSettings } from '@/types';

export interface CostEstimate {
  images: number;
  text: number;
  total: number;
  potentialSavings: number;
}

const COST_RATES = {
  text: {
    perThousandTokens: 0.0001,
  },
  image: {
    preview: 0.001,
    standard: 0.003,
    high: 0.005,
  },
};

export class CostOptimizer {
  private settings: CostSettings;

  constructor(settings: CostSettings) {
    this.settings = settings;
  }

  updateSettings(settings: Partial<CostSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  estimateImageCost(
    count: number,
    resolution: 'preview' | 'standard' | 'high' = 'standard'
  ): number {
    return count * COST_RATES.image[resolution];
  }

  estimateTextCost(tokenCount: number): number {
    return (tokenCount / 1000) * COST_RATES.text.perThousandTokens;
  }

  estimateEpisodeCost(panelCount: number): CostEstimate {
    // Estimate: each panel needs 1 image + dialogue generation
    const avgTokensPerPanel = 500;
    const textCost = this.estimateTextCost(panelCount * avgTokensPerPanel);

    // With progressive generation, we generate previews first
    let imageCost: number;
    let potentialSavings = 0;

    if (this.settings.enableProgressiveGeneration) {
      // Preview first, then ~70% get high-res
      const previewCost = this.estimateImageCost(panelCount, 'preview');
      const highResCost = this.estimateImageCost(Math.floor(panelCount * 0.7), 'high');
      imageCost = previewCost + highResCost;

      // Calculate savings vs all high-res
      const allHighResCost = this.estimateImageCost(panelCount, 'high');
      potentialSavings = allHighResCost - imageCost;
    } else {
      imageCost = this.estimateImageCost(panelCount, 'standard');
    }

    // Apply cache savings estimate
    if (this.settings.enableSemanticCache) {
      const cacheSavings = imageCost * 0.3; // Assume 30% cache hit rate
      potentialSavings += cacheSavings;
    }

    return {
      images: imageCost,
      text: textCost,
      total: imageCost + textCost,
      potentialSavings,
    };
  }

  estimateProjectCost(episodeCount: number, avgPanelsPerEpisode: number = 20): CostEstimate {
    const totalPanels = episodeCount * avgPanelsPerEpisode;
    const episodeCost = this.estimateEpisodeCost(totalPanels);

    // Add character generation cost (anchor images)
    const characterCost = this.estimateImageCost(5, 'high'); // Assume 5 main characters

    // Add planning/story generation cost
    const planningTokens = episodeCount * 2000; // 2k tokens per episode plan
    const planningCost = this.estimateTextCost(planningTokens);

    return {
      images: episodeCost.images + characterCost,
      text: episodeCost.text + planningCost,
      total: episodeCost.total + characterCost + planningCost,
      potentialSavings: episodeCost.potentialSavings,
    };
  }

  shouldUseBatch(requestCount: number): boolean {
    return this.settings.preferBatchProcessing && requestCount >= 3;
  }

  shouldUseProgressiveGeneration(): boolean {
    return this.settings.enableProgressiveGeneration;
  }

  getOptimalResolution(
    purpose: 'preview' | 'edit' | 'final'
  ): 'preview' | 'standard' | 'high' {
    switch (purpose) {
      case 'preview':
        return 'preview';
      case 'edit':
        return this.settings.enableProgressiveGeneration ? 'preview' : 'standard';
      case 'final':
        return 'high';
      default:
        return 'standard';
    }
  }

  formatCost(amount: number): string {
    return `$${amount.toFixed(4)}`;
  }

  checkBudget(estimatedCost: number, currentSpent: number): {
    canProceed: boolean;
    warning: boolean;
    message: string;
  } {
    const remaining = this.settings.dailyLimit - currentSpent;
    const afterCost = remaining - estimatedCost;

    if (afterCost < 0) {
      return {
        canProceed: false,
        warning: true,
        message: `일일 한도를 초과합니다. 남은 한도: ${this.formatCost(remaining)}`,
      };
    }

    if (afterCost / this.settings.dailyLimit < (1 - this.settings.warningThreshold)) {
      return {
        canProceed: true,
        warning: true,
        message: `주의: 이 작업 후 일일 한도의 ${Math.round((afterCost / this.settings.dailyLimit) * 100)}%만 남습니다.`,
      };
    }

    return {
      canProceed: true,
      warning: false,
      message: '',
    };
  }
}

export const createCostOptimizer = (settings: CostSettings) => new CostOptimizer(settings);
