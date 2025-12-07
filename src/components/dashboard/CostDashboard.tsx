import React from 'react';
import { motion } from 'framer-motion';
import { useCostStore } from '@/stores';

export const CostDashboard: React.FC = () => {
  const {
    sessionStats,
    settings,
    getTodayStats,
    getWeeklyStats,
    getCacheHitRate,
    checkDailyLimit,
  } = useCostStore();

  const todayStats = getTodayStats();
  const weeklyStats = getWeeklyStats();
  const cacheHitRate = getCacheHitRate();
  const limitStatus = checkDailyLimit();

  const formatCurrency = (value: number) => `$${value.toFixed(4)}`;

  // Calculate max value for chart scaling
  const maxCost = Math.max(...weeklyStats.map((s) => s.totalCost), 0.001);

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <h2 className="text-lg font-bold text-white mb-4">비용 대시보드</h2>

      {/* Daily Limit Warning */}
      {limitStatus.warning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 rounded-lg ${
            limitStatus.exceeded
              ? 'bg-red-500/20 border border-red-500/50'
              : 'bg-yellow-500/20 border border-yellow-500/50'
          }`}
        >
          <p className={limitStatus.exceeded ? 'text-red-400' : 'text-yellow-400'}>
            {limitStatus.exceeded
              ? '일일 한도를 초과했습니다!'
              : `일일 한도의 ${Math.round((todayStats.totalCost / settings.dailyLimit) * 100)}%를 사용했습니다.`}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            남은 한도: {formatCurrency(limitStatus.remaining)}
          </p>
        </motion.div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-xs">오늘 비용</p>
          <p className="text-xl font-bold text-white">{formatCurrency(todayStats.totalCost)}</p>
          <p className="text-green-400 text-xs">절감: {formatCurrency(todayStats.savedCost)}</p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-xs">캐시 적중률</p>
          <p className="text-xl font-bold text-purple-400">{cacheHitRate.toFixed(1)}%</p>
          <p className="text-gray-400 text-xs">{sessionStats.cacheHits} 적중</p>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="mb-4">
        <p className="text-gray-400 text-xs mb-2">주간 비용</p>
        <div className="flex items-end gap-1 h-16">
          {weeklyStats.map((day, index) => {
            const height = Math.max((day.totalCost / maxCost) * 100, 4);
            const isToday = index === weeklyStats.length - 1;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={`w-full rounded-t ${isToday ? 'bg-purple-500' : 'bg-gray-600'}`}
                  title={`${day.date}: ${formatCurrency(day.totalCost)}`}
                />
                <span className="text-[10px] text-gray-500 mt-1">
                  {new Date(day.date).getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Stats */}
      <div className="pt-3 border-t border-gray-700">
        <p className="text-gray-400 text-xs mb-2">현재 세션</p>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">이미지 생성</span>
          <span className="text-white">{sessionStats.imageGenerations}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-400">텍스트 생성</span>
          <span className="text-white">{sessionStats.textGenerations}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-400">캐시 절감</span>
          <span className="text-green-400">{formatCurrency(sessionStats.savedCost)}</span>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
        <p className="text-purple-400 text-xs font-medium mb-1">비용 절감 팁</p>
        <p className="text-gray-400 text-xs">
          프로그레시브 생성과 시맨틱 캐시로 최대 40% 비용을 절감할 수 있습니다.
        </p>
      </div>
    </div>
  );
};
