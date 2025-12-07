import React from 'react';
import { motion } from 'framer-motion';
import type { WizardData } from '../StepWizard';

interface GenreStyleStepProps {
  data: WizardData;
  updateData: (updates: Partial<WizardData>) => void;
  onNext: () => void;
  isGenerating: boolean;
}

const genres = [
  { id: 'romance', label: '로맨스', icon: '💕', color: 'pink' },
  { id: 'action', label: '액션', icon: '⚔️', color: 'red' },
  { id: 'fantasy', label: '판타지', icon: '🧙', color: 'purple' },
  { id: 'slice-of-life', label: '일상', icon: '☕', color: 'green' },
  { id: 'thriller', label: '스릴러', icon: '🔪', color: 'gray' },
  { id: 'comedy', label: '코미디', icon: '😂', color: 'yellow' },
  { id: 'sci-fi', label: 'SF', icon: '🚀', color: 'blue' },
  { id: 'drama', label: '드라마', icon: '🎭', color: 'orange' },
  { id: 'horror', label: '호러', icon: '👻', color: 'slate' },
  { id: 'mystery', label: '미스터리', icon: '🔍', color: 'indigo' },
];

const artStyles = [
  {
    id: 'korean-webtoon',
    label: '한국 웹툰',
    description: '깔끔한 선화와 밝은 색감',
    preview: '🇰🇷',
  },
  {
    id: 'japanese-manga',
    label: '일본 만화',
    description: '스크린톤과 역동적 구도',
    preview: '🇯🇵',
  },
  {
    id: 'american-comic',
    label: '미국 코믹스',
    description: '굵은 선과 강렬한 채색',
    preview: '🇺🇸',
  },
  {
    id: 'pastel-soft',
    label: '파스텔 톤',
    description: '부드럽고 따뜻한 분위기',
    preview: '🎨',
  },
  {
    id: 'watercolor',
    label: '수채화',
    description: '은은하고 감성적인 스타일',
    preview: '💧',
  },
  {
    id: 'noir-contrast',
    label: '느와르',
    description: '강한 명암 대비',
    preview: '🌑',
  },
  {
    id: 'chibi-cute',
    label: '치비/귀여움',
    description: '큰 눈과 단순화된 체형',
    preview: '🥰',
  },
  {
    id: 'realistic',
    label: '사실적',
    description: '세밀한 묘사와 디테일',
    preview: '📷',
  },
];

const moods = [
  '밝은', '어두운', '따뜻한', '차가운', '긴장감', '편안한',
  '신비로운', '유쾌한', '감성적', '역동적', '몽환적', '잔잔한',
];

export const GenreStyleStep: React.FC<GenreStyleStepProps> = ({
  data,
  updateData,
}) => {
  const handleGenreSelect = (genreId: string) => {
    if (data.genre === genreId) {
      updateData({ genre: '' });
    } else {
      updateData({ genre: genreId });
    }
  };

  const handleSubGenreToggle = (genreId: string) => {
    const subGenres = data.subGenres.includes(genreId)
      ? data.subGenres.filter((g) => g !== genreId)
      : [...data.subGenres, genreId].slice(0, 3);
    updateData({ subGenres });
  };

  const handleMoodToggle = (mood: string) => {
    const moodList = data.mood.includes(mood)
      ? data.mood.filter((m) => m !== mood)
      : [...data.mood, mood].slice(0, 4);
    updateData({ mood: moodList });
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">장르와 스타일을 선택해주세요</h2>
        <p className="text-gray-400">AI가 선택한 스타일에 맞춰 이미지를 생성합니다</p>
      </div>

      {/* Main Genre */}
      <div>
        <h3 className="text-lg font-medium text-white mb-3">메인 장르 (1개 선택)</h3>
        <div className="grid grid-cols-5 gap-3">
          {genres.map((genre) => (
            <motion.button
              key={genre.id}
              onClick={() => handleGenreSelect(genre.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                p-4 rounded-xl border-2 transition-all duration-200
                flex flex-col items-center justify-center gap-2
                ${
                  data.genre === genre.id
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }
              `}
            >
              <span className="text-2xl">{genre.icon}</span>
              <span className="text-sm font-medium text-white">{genre.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Sub Genres */}
      <div>
        <h3 className="text-lg font-medium text-white mb-3">서브 장르 (최대 3개)</h3>
        <div className="flex flex-wrap gap-2">
          {genres
            .filter((g) => g.id !== data.genre)
            .map((genre) => (
              <motion.button
                key={genre.id}
                onClick={() => handleSubGenreToggle(genre.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium
                  transition-all duration-200
                  ${
                    data.subGenres.includes(genre.id)
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500'
                      : 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-gray-500'
                  }
                `}
              >
                {genre.icon} {genre.label}
              </motion.button>
            ))}
        </div>
      </div>

      {/* Art Style */}
      <div>
        <h3 className="text-lg font-medium text-white mb-3">아트 스타일</h3>
        <div className="grid grid-cols-4 gap-3">
          {artStyles.map((style) => (
            <motion.button
              key={style.id}
              onClick={() => updateData({ artStyle: style.id })}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${
                  data.artStyle === style.id
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }
              `}
            >
              <span className="text-3xl mb-2 block">{style.preview}</span>
              <span className="text-sm font-medium text-white block">{style.label}</span>
              <span className="text-xs text-gray-400">{style.description}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div>
        <h3 className="text-lg font-medium text-white mb-3">분위기 (최대 4개)</h3>
        <div className="flex flex-wrap gap-2">
          {moods.map((mood) => (
            <motion.button
              key={mood}
              onClick={() => handleMoodToggle(mood)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-200
                ${
                  data.mood.includes(mood)
                    ? 'bg-pink-500/30 text-pink-300 border border-pink-500'
                    : 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-gray-500'
                }
              `}
            >
              {mood}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
