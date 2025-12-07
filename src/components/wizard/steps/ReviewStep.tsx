import React from 'react';
import { motion } from 'framer-motion';
import { Badge, ProgressBar, Card } from '@/components/common';
import type { WizardData } from '../StepWizard';

interface ReviewStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  isGenerating: boolean;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ data }) => {
  const calculateCompleteness = () => {
    let score = 0;
    const total = 6;

    if (data.title && data.briefConcept) score++;
    if (data.genre && data.artStyle) score++;
    if (data.planning) score++;
    if (data.worldBuilding) score++;
    if (data.characters.length > 0) score++;
    if (data.episodePlans.length > 0) score++;

    return (score / total) * 100;
  };

  const completeness = calculateCompleteness();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">최종 검토</h2>
        <p className="text-gray-400">
          프로젝트 설정을 확인하고 생성을 완료하세요
        </p>
      </div>

      {/* Completeness */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">프로젝트 완성도</h3>
          <span className="text-2xl font-bold text-purple-400">{Math.round(completeness)}%</span>
        </div>
        <ProgressBar value={completeness} color="primary" size="lg" />
      </Card>

      {/* Basic Info Summary */}
      <Card>
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span> 기본 정보
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-400 text-sm">제목</span>
            <p className="text-white font-medium">{data.title || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">장르</span>
            <p className="text-white font-medium">
              {data.genre || '-'}
              {data.subGenres.length > 0 && (
                <span className="text-gray-400 text-sm ml-2">
                  ({data.subGenres.join(', ')})
                </span>
              )}
            </p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">아트 스타일</span>
            <p className="text-white font-medium">{data.artStyle || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">예상 회차</span>
            <p className="text-white font-medium">{data.episodeCount}화</p>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-gray-400 text-sm">컨셉</span>
          <p className="text-white">{data.briefConcept || '-'}</p>
        </div>
        <div className="mt-4">
          <span className="text-gray-400 text-sm">분위기</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {data.mood.map((m, i) => (
              <Badge key={i} variant="primary">{m}</Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Planning Summary */}
      {data.planning && (
        <Card>
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <span className="text-xl">💡</span> 기획의도서
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-gray-400 text-sm">시놉시스</span>
              <p className="text-white text-sm">{data.planning.synopsis}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">핵심 메시지</span>
              <p className="text-white text-sm">{data.planning.coreMessage}</p>
            </div>
            <div>
              <span className="text-gray-400 text-sm">차별화 포인트</span>
              <ul className="text-white text-sm list-disc list-inside">
                {data.planning.uniquePoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Characters Summary */}
      <Card>
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span className="text-xl">👥</span> 캐릭터 ({data.characters.length}명)
        </h3>
        {data.characters.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {data.characters.map((char, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-700/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">
                    {char.gender === 'female' ? '👩' : char.gender === 'male' ? '👨' : '🧑'}
                  </span>
                  <span className="font-medium text-white">{char.name}</span>
                </div>
                <Badge
                  variant={
                    char.role === 'protagonist' ? 'warning' :
                    char.role === 'antagonist' ? 'danger' :
                    'default'
                  }
                  size="sm"
                >
                  {char.role === 'protagonist' ? '주인공' :
                   char.role === 'antagonist' ? '적대자' :
                   char.role === 'supporting' ? '조연' : '단역'}
                </Badge>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">캐릭터가 생성되지 않았습니다.</p>
        )}
      </Card>

      {/* Episode Plans Summary */}
      <Card>
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span className="text-xl">📝</span> 에피소드 플랜 ({data.episodePlans.length}/{data.episodeCount}화)
        </h3>
        {data.episodePlans.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.episodePlans.slice(0, 10).map((ep, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-700/50 rounded-lg p-2">
                <span className="text-lg font-bold text-purple-400 w-8">{ep.episodeNumber}</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{ep.title}</p>
                </div>
                <Badge variant="default" size="sm">{ep.emotionalArc}</Badge>
              </div>
            ))}
            {data.episodePlans.length > 10 && (
              <p className="text-gray-400 text-center text-sm">
                ... 외 {data.episodePlans.length - 10}화 더
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-400">에피소드 플랜이 생성되지 않았습니다.</p>
        )}
      </Card>

      {/* Estimated Cost */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <span className="text-xl">💰</span> 예상 비용
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-400">
              ${((data.episodeCount * 20 * 0.003) + (data.episodeCount * 0.01)).toFixed(2)}
            </p>
            <p className="text-gray-400 text-sm">이미지 생성</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">
              ${(data.episodeCount * 0.005).toFixed(2)}
            </p>
            <p className="text-gray-400 text-sm">텍스트 생성</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-400">
              ${((data.episodeCount * 20 * 0.003) + (data.episodeCount * 0.015)).toFixed(2)}
            </p>
            <p className="text-gray-400 text-sm">총 예상</p>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-4 text-center">
          * 캐시 적용 시 약 30-40% 절감 가능
        </p>
      </Card>

      {/* Ready Message */}
      {completeness >= 50 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30 text-center"
        >
          <span className="text-4xl mb-4 block">🎉</span>
          <h3 className="text-xl font-bold text-white mb-2">프로젝트 생성 준비 완료!</h3>
          <p className="text-gray-400">
            아래 "프로젝트 생성" 버튼을 클릭하여 웹툰 제작을 시작하세요.
          </p>
        </motion.div>
      ) : (
        <div className="bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/30 text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h3 className="text-xl font-bold text-white mb-2">추가 설정 필요</h3>
          <p className="text-gray-400">
            더 나은 결과를 위해 이전 단계에서 누락된 항목을 완성해주세요.
          </p>
        </div>
      )}
    </div>
  );
};
