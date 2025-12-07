import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, LoadingSpinner, TextArea } from '@/components/common';
import { geminiService } from '@/services/gemini/GeminiService';
import { parseJsonResponse } from '@/utils/parseJsonResponse';
import type { WizardData } from '../StepWizard';

interface StoryStructureStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

export const StoryStructureStep: React.FC<StoryStructureStepProps> = ({
  data,
  updateData,
  isGenerating,
  setIsGenerating,
}) => {
  const [error, setError] = useState<string | null>(null);

  const generateStoryStructure = async () => {
    if (!data.planning || data.characters.length === 0) {
      setError('먼저 기획서와 캐릭터를 생성해주세요.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const characterSummary = data.characters
        .map((c) => `${c.name} (${c.role}): ${c.motivation}`)
        .join('\n');

      const prompt = `
        웹툰의 전체 스토리 구조를 설계해주세요.

        작품 정보:
        - 제목: ${data.title}
        - 장르: ${data.genre}
        - 시놉시스: ${data.planning.synopsis}
        - 예상 회차: ${data.episodeCount}화

        캐릭터:
        ${characterSummary}

        다음 형식의 JSON으로 스토리 구조를 작성해주세요:
        {
          "acts": [
            {
              "actNumber": 1,
              "title": "막 제목",
              "description": "이 막의 설명",
              "episodeRange": "1-10화",
              "keyEvents": ["주요 사건1", "주요 사건2"],
              "characterFocus": ["집중 캐릭터들"],
              "emotionalTone": "감정 톤"
            }
          ],
          "majorPlotPoints": [
            {
              "episode": 1,
              "type": "hook|inciting_incident|first_pinch|midpoint|second_pinch|climax|resolution",
              "description": "설명"
            }
          ],
          "subplots": [
            {
              "title": "서브플롯 제목",
              "characters": ["관련 캐릭터"],
              "description": "설명",
              "resolution": "해결 방향"
            }
          ],
          "themes": ["테마1", "테마2"]
        }

        3막 구조로 설계해주세요.
      `;

      const response = await geminiService.generateText(prompt, {
        temperature: 0.7,
      });

      const storyStructure = parseJsonResponse(response);
      updateData({ storyStructure });
    } catch (err) {
      console.error('Story structure generation failed:', err);
      setError('스토리 구조 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getPlotPointColor = (type: string) => {
    const colors: Record<string, string> = {
      hook: 'bg-green-500',
      inciting_incident: 'bg-blue-500',
      first_pinch: 'bg-yellow-500',
      midpoint: 'bg-purple-500',
      second_pinch: 'bg-orange-500',
      climax: 'bg-red-500',
      resolution: 'bg-pink-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const getPlotPointLabel = (type: string) => {
    const labels: Record<string, string> = {
      hook: '훅',
      inciting_incident: '발단',
      first_pinch: '첫 번째 위기',
      midpoint: '중간점',
      second_pinch: '두 번째 위기',
      climax: '클라이맥스',
      resolution: '결말',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">스토리 구조</h2>
        <p className="text-gray-400">
          전체 스토리의 구조와 주요 플롯 포인트를 설계합니다
        </p>
      </div>

      {!data.storyStructure ? (
        <div className="flex flex-col items-center justify-center py-12">
          {isGenerating ? (
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-gray-400">AI가 스토리 구조를 설계하고 있습니다...</p>
            </div>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center mb-6">
                <span className="text-5xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                스토리 구조 생성
              </h3>
              <p className="text-gray-400 text-center mb-6 max-w-md">
                3막 구조를 기반으로 전체 스토리 흐름을 설계합니다.
              </p>
              <Button onClick={generateStoryStructure} variant="primary" size="lg">
                스토리 구조 생성하기
              </Button>
              {error && <p className="text-red-400 mt-4">{error}</p>}
            </>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Acts */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">막 구성</h3>
            {data.storyStructure.acts.map((act: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                    {act.actNumber}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-white">{act.title}</h4>
                    <p className="text-sm text-purple-400 mb-2">{act.episodeRange}</p>
                    <TextArea
                      value={act.description}
                      onChange={(e) => {
                        const newActs = [...(data.storyStructure?.acts || [])];
                        newActs[index] = { ...act, description: e.target.value };
                        updateData({
                          storyStructure: {
                            acts: newActs,
                            majorPlotPoints: data.storyStructure?.majorPlotPoints || [],
                            subplots: data.storyStructure?.subplots || [],
                            themes: data.storyStructure?.themes || [],
                          },
                        });
                      }}
                      rows={2}
                      className="bg-gray-700/50 mb-2"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {act.emotionalTone}
                      </span>
                      {act.characterFocus?.map((char: string, i: number) => (
                        <span key={i} className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Major Plot Points */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">주요 플롯 포인트</h3>
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700" />

              <div className="space-y-4">
                {data.storyStructure.majorPlotPoints?.map((point: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-4 relative"
                  >
                    <div className={`w-12 h-12 rounded-full ${getPlotPointColor(point.type)} flex items-center justify-center text-white font-bold z-10`}>
                      {point.episode}
                    </div>
                    <div className="flex-1 bg-gray-700/50 rounded-lg p-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPlotPointColor(point.type)} bg-opacity-20 mb-2`}>
                        {getPlotPointLabel(point.type)}
                      </span>
                      <p className="text-white">{point.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Subplots */}
          {data.storyStructure.subplots && data.storyStructure.subplots.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">서브플롯</h3>
              <div className="grid grid-cols-2 gap-4">
                {data.storyStructure.subplots.map((subplot: any, index: number) => (
                  <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-1">{subplot.title}</h4>
                    <p className="text-sm text-gray-400 mb-2">{subplot.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {subplot.characters?.map((char: string, i: number) => (
                        <span key={i} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Themes */}
          {data.storyStructure.themes && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-3">핵심 테마</h3>
              <div className="flex flex-wrap gap-2">
                {data.storyStructure.themes.map((theme: string, index: number) => (
                  <span key={index} className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white rounded-full border border-purple-500/30">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Regenerate Button */}
          <div className="flex justify-center pt-4">
            <Button
              variant="ghost"
              onClick={generateStoryStructure}
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
