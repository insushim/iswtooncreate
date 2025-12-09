import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, LoadingSpinner, Input, TextArea, Dropdown } from '@/components/common';
import { geminiService } from '@/services/gemini/GeminiService';
import { parseJsonResponse } from '@/utils/parseJsonResponse';
import type { WizardData } from '../StepWizard';

interface CharacterStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

const roleOptions = [
  { value: 'protagonist', label: '주인공' },
  { value: 'antagonist', label: '적대자' },
  { value: 'supporting', label: '조연' },
  { value: 'minor', label: '단역' },
];

const genderOptions = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
  { value: 'non-binary', label: '논바이너리' },
  { value: 'other', label: '기타' },
];

export const CharacterStep: React.FC<CharacterStepProps> = ({
  data,
  updateData,
  isGenerating,
  setIsGenerating,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(null);

  const generateCharacters = async () => {
    if (!data.planning || !data.worldBuilding) {
      setError('먼저 기획의도서와 세계관을 생성해주세요.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 회차에 따라 캐릭터 수 조절
      const characterCount = data.episodeCount <= 20 ? 5 : data.episodeCount <= 50 ? 7 : 10;

      const prompt = `웹툰 "${data.title}" (${data.genre})의 캐릭터 ${characterCount}명을 JSON으로 생성.

시놉시스: ${data.planning.synopsis}

중요: JSON만 출력. 설명 없이 바로 { 로 시작.

{"characters":[
  {"name":"이름","koreanName":"한글이름","role":"protagonist","age":20,"gender":"male","personality":["성격1","성격2"],"appearance":{"height":"175cm","hairColor":"검정","hairStyle":"단발","eyeColor":"갈색"},"backstory":"배경(50자이내)","motivation":"동기(30자이내)","arc":"성장(30자이내)"}
]}

role값: protagonist/antagonist/supporting/minor
gender값: male/female
필수구성: 주인공1-2, 적대자1-2, 조연${Math.max(2, characterCount - 4)}, 단역1-2
총 ${characterCount}명 생성. backstory,motivation,arc는 간결하게.`;

      const response = await geminiService.generateText(prompt, {
        temperature: 0.8,
        maxTokens: 12000,
        useCache: false,  // 캐릭터 생성은 항상 새로 생성
      });

      const result = parseJsonResponse(response);

      // 캐릭터가 충분히 생성되었는지 확인
      if (!result.characters || result.characters.length === 0) {
        throw new Error('캐릭터가 생성되지 않았습니다.');
      }

      updateData({ characters: result.characters });
    } catch (err) {
      console.error('Character generation failed:', err);
      setError('캐릭터 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCharacterEdit = (index: number, field: string, value: any) => {
    const newCharacters = [...data.characters];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newCharacters[index] = {
        ...newCharacters[index],
        [parent]: {
          ...(newCharacters[index] as any)[parent],
          [child]: value,
        },
      };
    } else {
      newCharacters[index] = { ...newCharacters[index], [field]: value };
    }
    updateData({ characters: newCharacters });
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      protagonist: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      antagonist: 'bg-red-500/20 text-red-400 border-red-500/30',
      supporting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      minor: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[role] || colors.minor;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">캐릭터 설정</h2>
        <p className="text-gray-400">
          작품에 등장하는 캐릭터들을 생성합니다
        </p>
      </div>

      {data.characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          {isGenerating ? (
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-gray-400">AI가 캐릭터들을 생성하고 있습니다...</p>
            </div>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-pink-500/20 flex items-center justify-center mb-6">
                <span className="text-5xl">👥</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                캐릭터 자동 생성
              </h3>
              <p className="text-gray-400 text-center mb-6 max-w-md">
                기획서와 세계관을 바탕으로 매력적인 캐릭터들을 생성합니다.
              </p>
              <Button onClick={generateCharacters} variant="primary" size="lg">
                캐릭터 생성하기
              </Button>
              {error && <p className="text-red-400 mt-4">{error}</p>}
            </>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Character Cards */}
          <div className="grid grid-cols-3 gap-4">
            {data.characters.map((character, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedCharacter(selectedCharacter === index ? null : index)}
                className={`
                  relative cursor-pointer rounded-xl p-4 border-2 transition-all duration-200
                  ${selectedCharacter === index
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }
                `}
              >
                {/* Role Badge */}
                <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(character.role)}`}>
                  {roleOptions.find(r => r.value === character.role)?.label}
                </span>

                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl mb-3">
                  {character.gender === 'female' ? '👩' : character.gender === 'male' ? '👨' : '🧑'}
                </div>

                {/* Basic Info */}
                <h4 className="text-lg font-bold text-white">{character.name}</h4>
                <p className="text-sm text-gray-400">{character.koreanName}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {character.age}세 · {character.appearance?.height}
                </p>

                {/* Personality Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {character.personality?.slice(0, 3).map((trait: string, i: number) => (
                    <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                      {trait}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Character Detail Editor */}
          <AnimatePresence>
            {selectedCharacter !== null && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    캐릭터 상세 정보 편집
                    <button
                      onClick={() => setSelectedCharacter(null)}
                      className="ml-auto text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="이름"
                      value={data.characters[selectedCharacter].name}
                      onChange={(e) => handleCharacterEdit(selectedCharacter, 'name', e.target.value)}
                    />
                    <Input
                      label="한국 이름"
                      value={data.characters[selectedCharacter].koreanName}
                      onChange={(e) => handleCharacterEdit(selectedCharacter, 'koreanName', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Dropdown
                      label="역할"
                      options={roleOptions}
                      value={data.characters[selectedCharacter].role}
                      onChange={(value) => handleCharacterEdit(selectedCharacter, 'role', value)}
                    />
                    <Input
                      label="나이"
                      type="number"
                      value={data.characters[selectedCharacter].age}
                      onChange={(e) => handleCharacterEdit(selectedCharacter, 'age', Number(e.target.value))}
                    />
                    <Dropdown
                      label="성별"
                      options={genderOptions}
                      value={data.characters[selectedCharacter].gender}
                      onChange={(value) => handleCharacterEdit(selectedCharacter, 'gender', value)}
                    />
                  </div>

                  <TextArea
                    label="배경 스토리"
                    value={data.characters[selectedCharacter].backstory}
                    onChange={(e) => handleCharacterEdit(selectedCharacter, 'backstory', e.target.value)}
                    rows={3}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="동기"
                      value={data.characters[selectedCharacter].motivation}
                      onChange={(e) => handleCharacterEdit(selectedCharacter, 'motivation', e.target.value)}
                    />
                    <Input
                      label="성장 방향"
                      value={data.characters[selectedCharacter].arc}
                      onChange={(e) => handleCharacterEdit(selectedCharacter, 'arc', e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Regenerate Button */}
          <div className="flex justify-center pt-4">
            <Button
              variant="ghost"
              onClick={generateCharacters}
              disabled={isGenerating}
              loading={isGenerating}
            >
              전체 다시 생성하기
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
