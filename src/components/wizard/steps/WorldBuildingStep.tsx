import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, LoadingSpinner, TextArea, Input } from '@/components/common';
import { geminiService } from '@/services/gemini/GeminiService';
import type { WizardData } from '../StepWizard';

interface WorldBuildingStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

export const WorldBuildingStep: React.FC<WorldBuildingStepProps> = ({
  data,
  updateData,
  isGenerating,
  setIsGenerating,
}) => {
  const [error, setError] = useState<string | null>(null);

  const generateWorldBuilding = async () => {
    if (!data.planning) {
      setError('먼저 기획의도서를 생성해주세요.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const prompt = `
        웹툰 세계관 설정을 작성해주세요.

        작품 정보:
        - 제목: ${data.title}
        - 장르: ${data.genre}
        - 시놉시스: ${data.planning.synopsis}

        다음 항목을 작성해주세요. JSON 형식으로 응답해주세요:
        {
          "era": "시대적 배경 (예: 현대, 중세 판타지, 근미래 등)",
          "setting": "주요 무대 설명 (2-3문장)",
          "mainLocations": [
            {
              "id": "loc1",
              "name": "장소 이름",
              "description": "장소 설명",
              "significance": "스토리에서의 중요성",
              "variations": []
            }
          ],
          "specialRules": ["세계관 특수 규칙 1", "규칙 2"],
          "socialStructure": "사회 구조 설명 (선택)",
          "technology": "기술 수준 설명 (선택)"
        }

        mainLocations는 3-5개 정도 생성해주세요.
      `;

      const response = await geminiService.generateText(prompt, {
        temperature: 0.7,
      });

      const worldBuilding = JSON.parse(response);
      updateData({ worldBuilding });
    } catch (err) {
      console.error('World building generation failed:', err);
      setError('세계관 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = (field: string, value: any) => {
    if (data.worldBuilding) {
      updateData({
        worldBuilding: {
          ...data.worldBuilding,
          [field]: value,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">세계관 설정</h2>
        <p className="text-gray-400">
          작품의 배경이 되는 세계관을 구축합니다
        </p>
      </div>

      {!data.worldBuilding ? (
        <div className="flex flex-col items-center justify-center py-12">
          {isGenerating ? (
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-gray-400">AI가 세계관을 구축하고 있습니다...</p>
            </div>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-cyan-500/20 flex items-center justify-center mb-6">
                <span className="text-5xl">🌍</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                세계관 설정 생성
              </h3>
              <p className="text-gray-400 text-center mb-6 max-w-md">
                기획의도서를 바탕으로 작품의 세계관을 자동으로 구축합니다.
              </p>
              <Button onClick={generateWorldBuilding} variant="primary" size="lg">
                세계관 생성하기
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
          {/* Era & Setting */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-sm font-medium text-cyan-400 mb-2">시대적 배경</h3>
              <Input
                value={data.worldBuilding.era}
                onChange={(e) => handleEdit('era', e.target.value)}
                className="bg-gray-700/50"
              />
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-sm font-medium text-cyan-400 mb-2">기술 수준</h3>
              <Input
                value={data.worldBuilding.technology || ''}
                onChange={(e) => handleEdit('technology', e.target.value)}
                className="bg-gray-700/50"
              />
            </div>
          </div>

          {/* Setting Description */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-3">주요 무대 설명</h3>
            <TextArea
              value={data.worldBuilding.setting}
              onChange={(e) => handleEdit('setting', e.target.value)}
              rows={3}
              className="bg-gray-700/50"
            />
          </div>

          {/* Main Locations */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">주요 장소</h3>
            <div className="space-y-4">
              {data.worldBuilding.mainLocations.map((location, index) => (
                <div
                  key={location.id || index}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl flex-shrink-0">
                      📍
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={location.name}
                        onChange={(e) => {
                          const newLocations = [...data.worldBuilding!.mainLocations];
                          newLocations[index] = { ...location, name: e.target.value };
                          handleEdit('mainLocations', newLocations);
                        }}
                        className="bg-gray-800/50 font-medium"
                        placeholder="장소 이름"
                      />
                      <TextArea
                        value={location.description}
                        onChange={(e) => {
                          const newLocations = [...data.worldBuilding!.mainLocations];
                          newLocations[index] = { ...location, description: e.target.value };
                          handleEdit('mainLocations', newLocations);
                        }}
                        rows={2}
                        className="bg-gray-800/50 text-sm"
                        placeholder="장소 설명"
                      />
                      <Input
                        value={location.significance}
                        onChange={(e) => {
                          const newLocations = [...data.worldBuilding!.mainLocations];
                          newLocations[index] = { ...location, significance: e.target.value };
                          handleEdit('mainLocations', newLocations);
                        }}
                        className="bg-gray-800/50 text-sm text-gray-400"
                        placeholder="스토리에서의 중요성"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Rules */}
          {data.worldBuilding.specialRules && data.worldBuilding.specialRules.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-3">세계관 특수 규칙</h3>
              <ul className="space-y-2">
                {data.worldBuilding.specialRules.map((rule, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-yellow-400">⚡</span>
                    <input
                      type="text"
                      value={rule}
                      onChange={(e) => {
                        const newRules = [...(data.worldBuilding!.specialRules || [])];
                        newRules[index] = e.target.value;
                        handleEdit('specialRules', newRules);
                      }}
                      className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Regenerate Button */}
          <div className="flex justify-center pt-4">
            <Button
              variant="ghost"
              onClick={generateWorldBuilding}
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
