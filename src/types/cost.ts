export interface CostEstimate {
  imageGeneration: number;
  textGeneration: number;
  total: number;
  breakdown: CostBreakdown[];
}

export interface CostBreakdown {
  category: string;
  count: number;
  unitCost: number;
  total: number;
  cached: number;
  savings: number;
}

export interface UsageStats {
  daily: UsageRecord[];
  weekly: UsageRecord[];
  monthly: UsageRecord[];
  allTime: UsageRecord;
}

export interface UsageRecord {
  date: string;
  imageGenerations: number;
  textGenerations: number;
  cachedHits: number;
  totalCost: number;
  savedCost: number;
}

export interface CostSettings {
  dailyLimit: number;
  warningThreshold: number;
  enableProgressiveGeneration: boolean;
  enableSemanticCache: boolean;
  cacheThreshold: number;
  preferBatchProcessing: boolean;
  offPeakScheduling: boolean;
}

export interface DailyStats {
  date: string;
  textGenerations: number;
  imageGenerations: number;
  cacheHits: number;
  totalCost: number;
  savedCost: number;
}
