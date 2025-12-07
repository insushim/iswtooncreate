import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { CostSettings, DailyStats } from '@/types';

interface SessionStats {
  textGenerations: number;
  imageGenerations: number;
  cacheHits: number;
  totalCost: number;
  savedCost: number;
}

interface CostState {
  sessionStats: SessionStats;
  dailyStats: Record<string, DailyStats>;
  settings: CostSettings;

  recordAPICall: (type: 'text' | 'image', cost: number) => void;
  recordCacheHit: (type: 'text' | 'image') => void;
  recordCacheSave: (type: 'text' | 'image') => void;
  getCacheHitRate: () => number;
  getTodayStats: () => DailyStats;
  getWeeklyStats: () => DailyStats[];
  getMonthlyStats: () => DailyStats[];
  updateSettings: (settings: Partial<CostSettings>) => void;
  checkDailyLimit: () => { exceeded: boolean; warning: boolean; remaining: number };
  resetSession: () => void;
}

const COST_RATES = {
  text: 0.0001,
  image: {
    preview: 0.001,
    standard: 0.003,
    high: 0.005,
  },
};

const getDefaultDailyStats = (date: string): DailyStats => ({
  date,
  textGenerations: 0,
  imageGenerations: 0,
  cacheHits: 0,
  totalCost: 0,
  savedCost: 0,
});

export const useCostStore = create<CostState>()(
  persist(
    immer((set, get) => ({
      sessionStats: {
        textGenerations: 0,
        imageGenerations: 0,
        cacheHits: 0,
        totalCost: 0,
        savedCost: 0,
      },

      dailyStats: {},

      settings: {
        dailyLimit: 5.0,
        warningThreshold: 0.8,
        enableProgressiveGeneration: true,
        enableSemanticCache: true,
        cacheThreshold: 0.85,
        preferBatchProcessing: true,
        offPeakScheduling: false,
      },

      recordAPICall: (type, cost) => {
        const today = new Date().toISOString().split('T')[0];

        set((state) => {
          if (type === 'text') {
            state.sessionStats.textGenerations++;
          } else {
            state.sessionStats.imageGenerations++;
          }
          state.sessionStats.totalCost += cost;

          if (!state.dailyStats[today]) {
            state.dailyStats[today] = getDefaultDailyStats(today);
          }

          if (type === 'text') {
            state.dailyStats[today].textGenerations++;
          } else {
            state.dailyStats[today].imageGenerations++;
          }
          state.dailyStats[today].totalCost += cost;
        });
      },

      recordCacheHit: (type) => {
        const today = new Date().toISOString().split('T')[0];
        const savedCost = type === 'text' ? COST_RATES.text : COST_RATES.image.standard;

        set((state) => {
          state.sessionStats.cacheHits++;
          state.sessionStats.savedCost += savedCost;

          if (!state.dailyStats[today]) {
            state.dailyStats[today] = getDefaultDailyStats(today);
          }
          state.dailyStats[today].cacheHits++;
          state.dailyStats[today].savedCost += savedCost;
        });
      },

      recordCacheSave: () => {
        // No action needed on cache save
      },

      getCacheHitRate: () => {
        const { sessionStats } = get();
        const totalRequests =
          sessionStats.textGenerations + sessionStats.imageGenerations + sessionStats.cacheHits;
        if (totalRequests === 0) return 0;
        return (sessionStats.cacheHits / totalRequests) * 100;
      },

      getTodayStats: () => {
        const today = new Date().toISOString().split('T')[0];
        const { dailyStats } = get();
        return dailyStats[today] || getDefaultDailyStats(today);
      },

      getWeeklyStats: () => {
        const { dailyStats } = get();
        const result: DailyStats[] = [];

        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          result.push(dailyStats[dateStr] || getDefaultDailyStats(dateStr));
        }

        return result;
      },

      getMonthlyStats: () => {
        const { dailyStats } = get();
        const result: DailyStats[] = [];

        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          result.push(dailyStats[dateStr] || getDefaultDailyStats(dateStr));
        }

        return result;
      },

      updateSettings: (newSettings) => {
        set((state) => {
          Object.assign(state.settings, newSettings);
        });
      },

      checkDailyLimit: () => {
        const { settings } = get();
        const todayStats = get().getTodayStats();

        const remaining = settings.dailyLimit - todayStats.totalCost;
        const usageRatio = todayStats.totalCost / settings.dailyLimit;

        return {
          exceeded: usageRatio >= 1,
          warning: usageRatio >= settings.warningThreshold,
          remaining: Math.max(0, remaining),
        };
      },

      resetSession: () => {
        set((state) => {
          state.sessionStats = {
            textGenerations: 0,
            imageGenerations: 0,
            cacheHits: 0,
            totalCost: 0,
            savedCost: 0,
          };
        });
      },
    })),
    {
      name: 'webtoon-forge-cost',
      partialize: (state) => ({
        dailyStats: state.dailyStats,
        settings: state.settings,
      }),
    }
  )
);
