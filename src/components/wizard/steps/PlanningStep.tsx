import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, LoadingSpinner, TextArea } from '@/components/common';
import { geminiService } from '@/services/gemini/GeminiService';
import { parseJsonResponse } from '@/utils/parseJsonResponse';
import type { WizardData } from '../StepWizard';

interface PlanningStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

export const PlanningStep: React.FC<PlanningStepProps> = ({
  data,
  updateData,
  isGenerating,
  setIsGenerating,
}) => {
  const [error, setError] = useState<string | null>(null);

  const generatePlanning = async () => {
    if (!data.title || !data.briefConcept || !data.genre) {
      setError('기본 정보와 장르를 먼저 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const prompt = `
        웹툰 기획의도서를 작성해주세요.

        작품 정보:
        - 제목: ${data.title}
        - 장르: ${data.genre} ${data.subGenres.length > 0 ? `(서브: ${data.subGenres.join(', ')})` : ''}
        - 컨셉: ${data.briefConcept}
        - 타겟: ${data.targetAudience}
        - 분위기: ${data.mood.join(', ')}
        - 예상 회차: ${data.episodeCount}화

        다음 항목을 작성해주세요. JSON 형식으로 응답해주세요:
        {
          "synopsis": "3-5문장의 시놉시스",
          "coreMessage": "이 작품이 전달하고자 하는 핵심 메시지",
          "targetAnalysis": "타겟 독자층 분석 및 그들이 이 작품에 끌릴 이유",
          "uniquePoints": ["차별화 포인트 1", "차별화 포인트 2", "차별화 포인트 3"],
          "expectedDirection": "예상 전개 방향 및 결말 힌트"
        }
      `;

      const response = await geminiService.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 8192,
      });

      const planning = parseJsonResponse(response);
      updateData({ planning });
    } catch (err) {
      console.error('Planning generation failed:', err);
      setError('기획서 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = (field: string, value: string) => {
    if (data.planning) {
      updateData({
        planning: {
          ...data.planning,
          [field]: value,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">AI 기획의도서</h2>
        <p className="text-gray-400">
          AI가 입력한 정보를 바탕으로 기획의도서를 작성합니다
        </p>
      </div>

      {!data.planning ? (
        <div className="flex flex-col items-center justify-center py-12">
          {isGenerating ? (
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-gray-400">AI가 기획서를 작성하고 있습니다...</p>
              <p className="text-gray-500 text-sm mt-2">약 10-20초 소요됩니다</p>
            </div>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
                <svg
                  className="w-12 h-12 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                기획의도서 생성 준비 완료
              </h3>
              <p className="text-gray-400 text-center mb-6 max-w-md">
                아래 버튼을 클릭하면 AI가 입력하신 정보를 바탕으로
                기획의도서를 자동으로 작성합니다.
              </p>
              <Button onClick={generatePlanning} variant="primary" size="lg">
                기획서 생성하기
              </Button>
              {error && <p className="text-red-400 mt-4">{error}</p>}
            </>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Synopsis */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-purple-400 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                📖
              </span>
              시놉시스
            </h3>
            <TextArea
              value={data.planning.synopsis}
              onChange={(e) => handleEdit('synopsis', e.target.value)}
              rows={4}
              className="bg-gray-700/50"
            />
          </div>

          {/* Core Message */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-pink-400 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                💡
              </span>
              핵심 메시지
            </h3>
            <TextArea
              value={data.planning.coreMessage}
              onChange={(e) => handleEdit('coreMessage', e.target.value)}
              rows={2}
              className="bg-gray-700/50"
            />
          </div>

          {/* Target Analysis */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-blue-400 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                🎯
              </span>
              타겟 분석
            </h3>
            <TextArea
              value={data.planning.targetAnalysis}
              onChange={(e) => handleEdit('targetAnalysis', e.target.value)}
              rows={3}
              className="bg-gray-700/50"
            />
          </div>

          {/* Unique Points */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-green-400 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                ✨
              </span>
              차별화 포인트
            </h3>
            <ul className="space-y-2">
              {data.planning.uniquePoints.map((point, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-green-400 font-medium">{index + 1}.</span>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => {
                      const newPoints = [...data.planning!.uniquePoints];
                      newPoints[index] = e.target.value;
                      handleEdit('uniquePoints', newPoints as any);
                    }}
                    className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Expected Direction */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-orange-400 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                🚀
              </span>
              예상 전개 방향
            </h3>
            <TextArea
              value={data.planning.expectedDirection}
              onChange={(e) => handleEdit('expectedDirection', e.target.value)}
              rows={3}
              className="bg-gray-700/50"
            />
          </div>

          {/* Regenerate Button */}
          <div className="flex justify-center pt-4">
            <Button
              variant="ghost"
              onClick={generatePlanning}
              disabled={isGenerating}
              loading={isGenerating}
            >
              다시 생성하기
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
