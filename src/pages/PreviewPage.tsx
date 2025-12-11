import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, LoadingSpinner } from '@/components/common';
import { useProjectStore } from '@/stores';

const PreviewPage: React.FC = () => {
  const { projectId, episodeId } = useParams<{ projectId: string; episodeId?: string }>();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useProjectStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      if (projectId) {
        await setCurrentProject(projectId);
        setIsLoading(false);
      }
    };
    loadProject();
  }, [projectId, setCurrentProject]);

  useEffect(() => {
    if (currentProject && episodeId) {
      const index = currentProject.episodes.findIndex((e) => e.id === episodeId);
      if (index >= 0) {
        setSelectedEpisodeIndex(index);
      }
    }
  }, [currentProject, episodeId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">프로젝트를 찾을 수 없습니다</h2>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            대시보드로 이동
          </Button>
        </div>
      </div>
    );
  }

  const currentEpisode = currentProject.episodes[selectedEpisodeIndex];

  return (
    <div className={`min-h-screen bg-gray-950 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/editor/${projectId}`)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-white font-bold">{currentProject.title}</h1>
              {currentEpisode && (
                <p className="text-gray-400 text-sm">
                  {currentEpisode.episodeNumber}화 - {currentEpisode.title}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Episode Selector */}
            <select
              value={selectedEpisodeIndex}
              onChange={(e) => setSelectedEpisodeIndex(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              {currentProject.episodes.map((ep, index) => (
                <option key={ep.id} value={index}>
                  {ep.episodeNumber}화 - {ep.title}
                </option>
              ))}
            </select>

            <Button
              variant="ghost"
              onClick={() => setIsFullscreen(!isFullscreen)}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isFullscreen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V5H5v4h4zm6 0V5h4v4h-4zm-6 6v4H5v-4h4zm6 0v4h4v-4h-4z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4m8 0h4v4m0 8v4h-4m-8 0H4v-4" />
                  )}
                </svg>
              }
            >
              {isFullscreen ? '나가기' : '전체화면'}
            </Button>
          </div>
        </div>
      </header>

      {/* Webtoon Viewer */}
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <AnimatePresence mode="wait">
          {currentEpisode ? (
            <motion.div
              key={currentEpisode.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-1"
            >
              {[...currentEpisode.panels]
                .sort((a, b) => a.panelNumber - b.panelNumber)
                .map((panel, index) => (
                  <motion.div
                    key={panel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    {/* Image or Placeholder */}
                    {/* 대사는 이미 이미지에 합성되어 있으므로 오버레이 제거 */}
                    <div className="relative">
                      {panel.generatedImage ? (
                        <img
                          src={panel.generatedImage.imageData}
                          alt={`Panel ${panel.panelNumber}`}
                          className="w-full"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full aspect-[3/4] bg-gray-800 flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-4xl mb-2 block">🎨</span>
                            <p className="text-gray-400">이미지 생성 필요</p>
                            <p className="text-gray-500 text-sm">패널 {panel.panelNumber}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

              {/* Episode End */}
              <div className="py-12 text-center">
                <p className="text-gray-400 mb-4">- {currentEpisode.episodeNumber}화 끝 -</p>
                {currentEpisode.endingHook && (
                  <p className="text-purple-400 italic">{currentEpisode.endingHook}</p>
                )}

                {/* Navigation */}
                <div className="flex justify-center gap-4 mt-8">
                  <Button
                    variant="secondary"
                    disabled={selectedEpisodeIndex === 0}
                    onClick={() => setSelectedEpisodeIndex(selectedEpisodeIndex - 1)}
                  >
                    이전 화
                  </Button>
                  <Button
                    variant="primary"
                    disabled={selectedEpisodeIndex === currentProject.episodes.length - 1}
                    onClick={() => setSelectedEpisodeIndex(selectedEpisodeIndex + 1)}
                  >
                    다음 화
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <span className="text-4xl mb-4 block">📚</span>
              <p className="text-gray-400">에피소드가 없습니다</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PreviewPage;
