import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, LoadingSpinner, TextArea, Badge } from '@/components/common';
import { geminiService } from '@/services/gemini/GeminiService';
import { parseJsonResponse } from '@/utils/parseJsonResponse';
import type { WizardData } from '../StepWizard';

interface EpisodePlanStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

export const EpisodePlanStep: React.FC<EpisodePlanStepProps> = ({
  data,
  updateData,
  isGenerating,
  setIsGenerating,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const [generateCount, setGenerateCount] = useState(5);

  // ref를 사용하여 항상 최신 data를 참조
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const generateEpisodePlans = async () => {
    console.log('[EpisodePlan] ========= BUTTON CLICKED =========');
    console.log('[EpisodePlan] isGenerating:', isGenerating);

    // ref에서 최신 data 가져오기
    const currentData = dataRef.current;

    console.log('[EpisodePlan] storyStructure:', currentData.storyStructure);
    console.log('[EpisodePlan] planning:', currentData.planning);

    // storyStructure 체크 제거 - planning만 있으면 생성 가능하도록
    if (!currentData.planning?.synopsis) {
      setError('먼저 AI 기획 단계에서 시놉시스를 생성해주세요.');
      console.log('[EpisodePlan] Error: No planning/synopsis');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 현재 에피소드 수 기반으로 시작점 계산
      const currentEpisodeCount = currentData.episodePlans.length;
      const startEpisode = currentEpisodeCount + 1;
      const endEpisode = Math.min(startEpisode + generateCount - 1, currentData.episodeCount);
      const episodeCountToGenerate = endEpisode - startEpisode + 1;

      console.log(`[EpisodePlan] Current episodes: ${currentEpisodeCount}, Generating: ${startEpisode}~${endEpisode}`);

      const lastEpisode = currentData.episodePlans[currentData.episodePlans.length - 1];

      // 이미 모든 에피소드가 생성된 경우
      if (startEpisode > currentData.episodeCount) {
        setError('모든 에피소드가 이미 생성되었습니다.');
        setIsGenerating(false);
        return;
      }

      // 스토리 구조에서 현재 에피소드가 속한 막 찾기
      const storyStructure = currentData.storyStructure;
      let currentAct = null;
      let currentActInfo = '';
      let relevantPlotPoints = '';

      if (storyStructure?.acts) {
        for (const act of storyStructure.acts) {
          // episodeRange 파싱 (예: "1-25화" -> [1, 25])
          const rangeMatch = act.episodeRange?.match(/(\d+)-(\d+)/);
          if (rangeMatch) {
            const actStart = parseInt(rangeMatch[1]);
            const actEnd = parseInt(rangeMatch[2]);
            if (startEpisode >= actStart && startEpisode <= actEnd) {
              currentAct = act;
              break;
            }
          }
        }

        if (currentAct) {
          currentActInfo = `
📍 현재 막: ${currentAct.actNumber}막 "${currentAct.title}" (${currentAct.episodeRange})
- 설명: ${currentAct.description}
- 감정톤: ${currentAct.emotionalTone}
- 주요사건: ${currentAct.keyEvents?.join(', ')}
- 중심캐릭터: ${currentAct.characterFocus?.join(', ')}`;
        }

        // 현재 범위에 해당하는 주요 플롯 포인트 찾기
        if (storyStructure.majorPlotPoints) {
          const relevantPoints = storyStructure.majorPlotPoints.filter(
            (p: any) => p.episode >= startEpisode && p.episode <= endEpisode
          );
          if (relevantPoints.length > 0) {
            relevantPlotPoints = `
🎯 이 구간의 주요 플롯 포인트:
${relevantPoints.map((p: any) => `- ${p.episode}화: [${p.type}] ${p.description}`).join('\n')}`;
          }
        }
      }

      // 결말 사용 제한 계산 (90% 이후에만 결말 허용)
      const totalEps = currentData.episodeCount;
      const resolutionStartEp = Math.floor(totalEps * 0.90);
      const canUseResolution = startEpisode >= resolutionStartEp;
      const progressPercent = Math.round((startEpisode / totalEps) * 100);

      // 허용되는 emotionalArc 값
      let allowedArcs = '';
      if (canUseResolution) {
        allowedArcs = 'climax, falling, resolution 사용 가능 (결말 구간)';
      } else if (startEpisode >= Math.floor(totalEps * 0.75)) {
        allowedArcs = 'rising, climax, falling만 사용 (절정 구간, resolution 금지!)';
      } else if (startEpisode >= Math.floor(totalEps * 0.50)) {
        allowedArcs = 'rising, climax만 사용 (위기 구간, resolution/falling 금지!)';
      } else {
        allowedArcs = 'exposition, rising만 사용 (발단/전개 구간, climax/resolution 금지!)';
      }

      // 이전 에피소드 요약 (최근 3개)
      const recentEpisodes = currentData.episodePlans.slice(-3);
      const recentSummary = recentEpisodes.length > 0
        ? `\n최근 전개:\n${recentEpisodes.map(ep => `- ${ep.episodeNumber}화 "${ep.title}": ${ep.summary}`).join('\n')}`
        : '';

      const prompt = `웹툰 "${currentData.title}" 에피소드 ${startEpisode}~${endEpisode}화 생성.

📊 전체: ${totalEps}화 완결작 | 현재: ${startEpisode}~${endEpisode}화 (진행률 ${progressPercent}%)
${currentActInfo}
${relevantPlotPoints}
${recentSummary}

시놉시스: ${currentData.planning?.synopsis?.slice(0, 200)}
캐릭터: ${currentData.characters.slice(0, 5).map(c => c.name).join(', ')}
${lastEpisode ? `직전화(${lastEpisode.episodeNumber}화): "${lastEpisode.title}" - ${lastEpisode.endingHook}` : '첫 에피소드입니다.'}

⚠️ 필수 규칙:
1. 정확히 ${episodeCountToGenerate}개만 생성 (${startEpisode}~${endEpisode}화)
2. emotionalArc: ${allowedArcs}
3. ${totalEps}화가 완결! ${canUseResolution ? '결말 구간입니다.' : `결말은 ${resolutionStartEp}화 이후에만! 지금은 스토리 전개 중!`}
4. 이전 에피소드와 중복되는 사건/제목 금지
5. JSON만 출력, {로 시작

{"episodes":[
{"episodeNumber":${startEpisode},"title":"제목(중복금지)","summary":"요약30자","keyEvents":["새로운사건"],"emotionalArc":"rising","endingHook":"다음화떡밥","characters":["이름"],"locations":["장소"]}
]}`;

      console.log('[EpisodePlan] Prompt:', prompt);

      const response = await geminiService.generateText(prompt, {
        temperature: 0.8,
        maxTokens: 16000,
        useCache: false,  // 에피소드 생성은 항상 새로 생성
      });

      const result = parseJsonResponse(response);

      console.log('[EpisodePlan] Raw parsed result:', result);

      // 에피소드가 생성되었는지 확인
      if (!result.episodes || result.episodes.length === 0) {
        throw new Error('에피소드가 생성되지 않았습니다.');
      }

      // AI가 반환한 episodeNumber를 실제 시작 번호 기준으로 재할당
      // 그리고 최대 회차를 초과하지 않도록 필터링
      const correctedEpisodes = result.episodes
        .slice(0, episodeCountToGenerate) // 요청한 개수만큼만 사용
        .map((ep: any, idx: number) => ({
          ...ep,
          episodeNumber: startEpisode + idx,
        }))
        .filter((ep: any) => ep.episodeNumber <= currentData.episodeCount); // 최대 회차 초과 필터링

      console.log(`[EpisodePlan] Generated ${correctedEpisodes.length} episodes (filtered to max ${currentData.episodeCount}화)`);

      if (correctedEpisodes.length === 0) {
        setError('모든 에피소드가 이미 생성되었습니다.');
        return;
      }

      // 최신 데이터를 다시 가져와서 병합
      const latestData = dataRef.current;

      // 중복 방지: 이미 있는 에피소드 번호는 제외
      const existingNumbers = new Set(latestData.episodePlans.map((ep: any) => ep.episodeNumber));
      const newEpisodes = correctedEpisodes.filter((ep: any) => !existingNumbers.has(ep.episodeNumber));

      if (newEpisodes.length === 0) {
        setError('추가할 새 에피소드가 없습니다.');
        return;
      }

      updateData({
        episodePlans: [...latestData.episodePlans, ...newEpisodes],
      });
    } catch (err) {
      console.error('Episode plan generation failed:', err);
      setError('에피소드 플랜 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEpisodeEdit = (index: number, field: string, value: any) => {
    const newPlans = [...data.episodePlans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    updateData({ episodePlans: newPlans });
  };

  const handleDeleteEpisode = (index: number) => {
    if (!confirm(`${data.episodePlans[index].episodeNumber}화를 삭제하시겠습니까?`)) {
      return;
    }

    const newPlans = data.episodePlans.filter((_, i) => i !== index);
    // 삭제 후 에피소드 번호 재정렬
    const renumberedPlans = newPlans.map((ep, i) => ({
      ...ep,
      episodeNumber: i + 1,
    }));

    updateData({ episodePlans: renumberedPlans });

    // 선택된 에피소드가 삭제되면 선택 해제
    if (selectedEpisode === index) {
      setSelectedEpisode(null);
    } else if (selectedEpisode !== null && selectedEpisode > index) {
      setSelectedEpisode(selectedEpisode - 1);
    }
  };

  const handleDeleteAllEpisodes = () => {
    if (!confirm('모든 에피소드를 삭제하시겠습니까?')) {
      return;
    }
    updateData({ episodePlans: [] });
    setSelectedEpisode(null);
  };

  const getEmotionalArcColor = (arc: string) => {
    const colors: Record<string, string> = {
      exposition: 'primary',
      rising: 'warning',
      climax: 'danger',
      falling: 'info',
      resolution: 'success',
    };
    return colors[arc] || 'default';
  };

  const getEmotionalArcLabel = (arc: string) => {
    const labels: Record<string, string> = {
      exposition: '발단',
      rising: '상승',
      climax: '절정',
      falling: '하강',
      resolution: '결말',
    };
    return labels[arc] || arc;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">에피소드 플랜</h2>
        <p className="text-gray-400">
          각 에피소드의 내용을 계획합니다
        </p>
      </div>

      {/* Progress */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">에피소드 계획 진행</span>
          <span className="text-white font-medium">
            {data.episodePlans.length} / {data.episodeCount}화
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(data.episodePlans.length / data.episodeCount) * 100}%` }}
          />
        </div>
      </div>

      {data.episodePlans.length === 0 && !isGenerating ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
            <span className="text-5xl">📝</span>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            에피소드 플랜 생성
          </h3>
          <p className="text-gray-400 text-center mb-6 max-w-md">
            스토리 구조를 바탕으로 각 에피소드의 상세 계획을 작성합니다.
          </p>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-gray-400">생성할 에피소드 수:</span>
            <select
              value={generateCount}
              onChange={(e) => setGenerateCount(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              {[3, 5, 10].map(n => (
                <option key={n} value={n}>{n}화</option>
              ))}
            </select>
          </div>
          <Button onClick={generateEpisodePlans} variant="primary" size="lg" disabled={isGenerating}>
            {isGenerating ? '생성 중...' : '에피소드 플랜 생성하기'}
          </Button>
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {isGenerating && (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-gray-400">AI가 에피소드를 계획하고 있습니다...</p>
            </div>
          )}

          {/* Episode List */}
          <div className="grid grid-cols-2 gap-4">
            {data.episodePlans.map((episode, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  relative rounded-xl p-4 border-2 transition-all duration-200
                  ${selectedEpisode === index
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }
                `}
              >
                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEpisode(index);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                  title="에피소드 삭제"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div
                  onClick={() => setSelectedEpisode(selectedEpisode === index ? null : index)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2 pr-6">
                    <span className="text-3xl font-bold text-purple-400">
                      {episode.episodeNumber}
                    </span>
                    <Badge variant={getEmotionalArcColor(episode.emotionalArc) as any}>
                      {getEmotionalArcLabel(episode.emotionalArc)}
                    </Badge>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{episode.title}</h4>
                  <p className="text-sm text-gray-400 line-clamp-2">{episode.summary}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {episode.characters?.slice(0, 3).map((char: string, i: number) => (
                      <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Episode Detail Editor */}
          <AnimatePresence>
            {selectedEpisode !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center justify-between">
                    {data.episodePlans[selectedEpisode].episodeNumber}화 상세 편집
                    <button
                      onClick={() => setSelectedEpisode(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </h3>

                  <TextArea
                    label="제목"
                    value={data.episodePlans[selectedEpisode].title}
                    onChange={(e) => handleEpisodeEdit(selectedEpisode, 'title', e.target.value)}
                    rows={1}
                  />

                  <TextArea
                    label="요약"
                    value={data.episodePlans[selectedEpisode].summary}
                    onChange={(e) => handleEpisodeEdit(selectedEpisode, 'summary', e.target.value)}
                    rows={3}
                  />

                  <TextArea
                    label="엔딩 훅 (떡밥)"
                    value={data.episodePlans[selectedEpisode].endingHook}
                    onChange={(e) => handleEpisodeEdit(selectedEpisode, 'endingHook', e.target.value)}
                    rows={2}
                    helperText="다음 화로 이어지는 궁금증을 유발하는 요소"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">주요 사건</label>
                    {data.episodePlans[selectedEpisode].keyEvents?.map((event: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <span className="text-purple-400">{i + 1}.</span>
                        <input
                          type="text"
                          value={event}
                          onChange={(e) => {
                            const newEvents = [...data.episodePlans[selectedEpisode].keyEvents];
                            newEvents[i] = e.target.value;
                            handleEpisodeEdit(selectedEpisode, 'keyEvents', newEvents);
                          }}
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate More & Delete All */}
          {!isGenerating && (
            <div className="flex items-center justify-between pt-4">
              {/* 전체 삭제 버튼 */}
              {data.episodePlans.length > 0 && (
                <Button onClick={handleDeleteAllEpisodes} variant="danger" size="sm">
                  전체 삭제
                </Button>
              )}
              {data.episodePlans.length === 0 && <div />}

              {/* 추가 생성 또는 완료 메시지 */}
              {data.episodePlans.length < data.episodeCount ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <select
                      value={generateCount}
                      onChange={(e) => setGenerateCount(Number(e.target.value))}
                      className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      {[3, 5, 10].map(n => (
                        <option key={n} value={n}>{n}화 추가</option>
                      ))}
                    </select>
                    <Button
                      onClick={() => {
                        console.log('[Button] onClick triggered, isGenerating:', isGenerating);
                        generateEpisodePlans();
                      }}
                      variant="primary"
                      disabled={isGenerating}
                    >
                      {isGenerating ? '생성 중...' : '다음 에피소드 생성'}
                    </Button>
                  </div>
                  <span className="text-xs text-gray-500">
                    남은 에피소드: {data.episodeCount - data.episodePlans.length}화
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">모든 에피소드 생성 완료! ({data.episodeCount}화)</span>
                </div>
              )}

              {/* 에러 메시지 */}
              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg w-full">
                  <p className="text-red-400 font-medium">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
