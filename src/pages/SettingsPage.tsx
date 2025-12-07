import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Input, Toggle, Slider, Card, Toast } from '@/components/common';
import { useCostStore } from '@/stores';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useCostStore();
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSave = () => {
    // In a real app, this would save to secure storage
    setToast({ message: '설정이 저장되었습니다', type: 'success' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white">설정</h1>
        </div>

        <div className="space-y-6">
          {/* API Settings */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              API 설정
            </h2>
            <div className="space-y-4">
              <Input
                label="Gemini API Key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                helperText="Google AI Studio에서 API 키를 발급받으세요"
              />
              <p className="text-xs text-gray-500">
                API 키는 브라우저 로컬에만 저장되며 외부로 전송되지 않습니다.
              </p>
            </div>
          </Card>

          {/* Cost Settings */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              비용 설정
            </h2>
            <div className="space-y-6">
              <Slider
                label="일일 비용 한도"
                value={settings.dailyLimit}
                onChange={(value) => updateSettings({ dailyLimit: value })}
                min={1}
                max={20}
                step={0.5}
                formatValue={(v) => `$${v.toFixed(2)}`}
              />

              <Slider
                label="경고 임계값"
                value={settings.warningThreshold * 100}
                onChange={(value) => updateSettings({ warningThreshold: value / 100 })}
                min={50}
                max={95}
                step={5}
                formatValue={(v) => `${v}%`}
              />
            </div>
          </Card>

          {/* Optimization Settings */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              최적화 설정
            </h2>
            <div className="space-y-4">
              <Toggle
                label="프로그레시브 이미지 생성"
                description="저해상도 프리뷰를 먼저 생성하여 비용을 절감합니다"
                checked={settings.enableProgressiveGeneration}
                onChange={(checked) => updateSettings({ enableProgressiveGeneration: checked })}
              />

              <Toggle
                label="시맨틱 캐싱"
                description="유사한 프롬프트의 결과를 캐싱하여 재사용합니다"
                checked={settings.enableSemanticCache}
                onChange={(checked) => updateSettings({ enableSemanticCache: checked })}
              />

              <Toggle
                label="배치 처리 우선"
                description="여러 이미지를 한 번에 처리하여 효율을 높입니다"
                checked={settings.preferBatchProcessing}
                onChange={(checked) => updateSettings({ preferBatchProcessing: checked })}
              />

              {settings.enableSemanticCache && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <Slider
                    label="캐시 유사도 임계값"
                    value={settings.cacheThreshold * 100}
                    onChange={(value) => updateSettings({ cacheThreshold: value / 100 })}
                    min={70}
                    max={95}
                    step={5}
                    formatValue={(v) => `${v}%`}
                  />
                </motion.div>
              )}
            </div>
          </Card>

          {/* Data Management */}
          <Card>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              데이터 관리
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">캐시 초기화</p>
                  <p className="text-gray-400 text-sm">이미지와 텍스트 캐시를 모두 삭제합니다</p>
                </div>
                <Button variant="danger" size="sm">
                  초기화
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">데이터 내보내기</p>
                  <p className="text-gray-400 text-sm">모든 프로젝트를 JSON으로 내보냅니다</p>
                </div>
                <Button variant="secondary" size="sm">
                  내보내기
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">데이터 가져오기</p>
                  <p className="text-gray-400 text-sm">백업 파일에서 프로젝트를 복원합니다</p>
                </div>
                <Button variant="secondary" size="sm">
                  가져오기
                </Button>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              취소
            </Button>
            <Button variant="primary" onClick={handleSave}>
              저장
            </Button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
