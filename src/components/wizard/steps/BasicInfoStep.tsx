import React from 'react';
import { Input, TextArea, Slider, Dropdown } from '@/components/common';
import type { WizardData } from '../StepWizard';

interface BasicInfoStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  isGenerating: boolean;
}

const targetAudienceOptions = [
  { value: 'all', label: '전체 이용가' },
  { value: 'teens', label: '10대' },
  { value: '20s', label: '20대' },
  { value: '30plus', label: '30대 이상' },
];

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  data,
  updateData,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">작품의 기본 정보를 입력해주세요</h2>
        <p className="text-gray-400">AI가 이 정보를 바탕으로 기획의도서를 작성합니다</p>
      </div>

      <Input
        label="작품 제목"
        placeholder="예: 어느 날 공주가 되어버렸다"
        value={data.title}
        onChange={(e) => updateData({ title: e.target.value })}
      />

      <TextArea
        label="작품 컨셉 (간단한 설명)"
        placeholder="예: 현대 직장인이 이세계의 악역 공주로 빙의하여 죽음을 피하기 위해 고군분투하는 로맨스 판타지"
        value={data.briefConcept}
        onChange={(e) => updateData({ briefConcept: e.target.value })}
        rows={4}
        showCount
        maxLength={500}
      />

      <Dropdown
        label="타겟 독자층"
        options={targetAudienceOptions}
        value={data.targetAudience}
        onChange={(value) => updateData({ targetAudience: value })}
      />

      <Slider
        label="예상 회차 수"
        value={data.episodeCount}
        onChange={(value) => updateData({ episodeCount: value })}
        min={5}
        max={200}
        step={5}
        formatValue={(v) => `${v}화`}
      />

      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
        <h3 className="text-sm font-medium text-gray-400 mb-2">입력 팁</h3>
        <ul className="text-sm text-gray-500 space-y-1">
          <li>• 제목은 작품의 분위기를 잘 나타내는 것이 좋습니다</li>
          <li>• 컨셉에는 주인공, 배경, 핵심 갈등을 포함해주세요</li>
          <li>• 회차 수는 나중에 변경할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
};
