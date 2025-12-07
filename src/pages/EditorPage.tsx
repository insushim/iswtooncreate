import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EditorToolbar, PanelEditor, Timeline } from '@/components/editor';
import { Button, LoadingSpinner, Tabs, Card } from '@/components/common';
import { useProjectStore, useUIStore } from '@/stores';
import type { Panel } from '@/types';

const EditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject, updatePanel } = useProjectStore();
  const { selectedEpisodeId, setSelectedEpisode, selectedPanelId, setSelectedPanel, addToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);

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
    // Select first episode by default
    if (currentProject?.episodes.length && !selectedEpisodeId) {
      setSelectedEpisode(currentProject.episodes[0].id);
    }
  }, [currentProject, selectedEpisodeId, setSelectedEpisode]);

  const currentEpisode = currentProject?.episodes.find((e) => e.id === selectedEpisodeId);
  const currentPanel = currentEpisode?.panels.find((p) => p.id === selectedPanelId);

  const handlePanelUpdate = async (panelId: string, updates: Partial<Panel>) => {
    if (selectedEpisodeId) {
      await updatePanel(selectedEpisodeId, panelId, updates);
      addToast({ message: '패널이 업데이트되었습니다', type: 'success' });
    }
  };

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
        <Card className="text-center p-8">
          <h2 className="text-xl font-bold text-white mb-4">프로젝트를 찾을 수 없습니다</h2>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            대시보드로 이동
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Toolbar */}
      <EditorToolbar
        projectTitle={currentProject.title}
        episodeTitle={currentEpisode?.title || '에피소드 선택'}
        onSave={() => addToast({ message: '저장되었습니다', type: 'success' })}
        onPreview={() => navigate(`/preview/${projectId}`)}
        onExport={() => addToast({ message: '내보내기 준비 중...', type: 'info' })}
      />

      <div className="flex-1 flex">
        {/* Sidebar: Episodes */}
        <div className="w-64 bg-gray-800/50 border-r border-gray-700 p-4 overflow-y-auto">
          <h3 className="text-lg font-medium text-white mb-4">에피소드</h3>
          <div className="space-y-2">
            {currentProject.episodes.length > 0 ? (
              currentProject.episodes.map((episode) => (
                <motion.button
                  key={episode.id}
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    setSelectedEpisode(episode.id);
                    if (episode.panels.length > 0) {
                      setSelectedPanel(episode.panels[0].id);
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedEpisodeId === episode.id
                      ? 'bg-purple-600/30 border border-purple-500'
                      : 'bg-gray-700/50 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">
                      {episode.episodeNumber}화
                    </span>
                    <span className="text-gray-400 text-sm">
                      {episode.panels.length} 패널
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm truncate mt-1">
                    {episode.title}
                  </p>
                </motion.button>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                <p>에피소드가 없습니다</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    // TODO: Add episode creation
                  }}
                >
                  에피소드 추가
                </Button>
              </div>
            )}
          </div>

          {/* Characters */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-white mb-4">캐릭터</h3>
            <div className="space-y-2">
              {currentProject.characters.map((character) => (
                <div
                  key={character.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-gray-700/30"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm">
                    {character.gender === 'female' ? '👩' : '👨'}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{character.name}</p>
                    <p className="text-gray-400 text-xs">{character.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {currentEpisode ? (
            <>
              {/* Timeline */}
              <Timeline
                panels={currentEpisode.panels}
                selectedPanelId={selectedPanelId}
                onSelectPanel={setSelectedPanel}
              />

              {/* Panel Editor */}
              <div className="flex-1 mt-4 overflow-y-auto">
                {currentPanel ? (
                  <PanelEditor
                    panel={currentPanel}
                    episodeId={currentEpisode.id}
                    onUpdate={(updates) => handlePanelUpdate(currentPanel.id, updates)}
                  />
                ) : (
                  <Card className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <span className="text-4xl mb-4 block">🎬</span>
                      <p className="text-gray-400">패널을 선택하거나 새로 추가하세요</p>
                      <Button variant="primary" className="mt-4">
                        새 패널 추가
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card className="flex items-center justify-center h-full">
              <div className="text-center">
                <span className="text-4xl mb-4 block">📚</span>
                <p className="text-gray-400">에피소드를 선택하세요</p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar: Properties */}
        <div className="w-72 bg-gray-800/50 border-l border-gray-700 p-4 overflow-y-auto">
          <Tabs
            tabs={[
              { id: 'properties', label: '속성' },
              { id: 'dialogue', label: '대사' },
            ]}
            activeTab="properties"
            onChange={() => {}}
            variant="underline"
            fullWidth
          />

          <div className="mt-4">
            {currentPanel ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">패널 크기</label>
                  <p className="text-white">{currentPanel.size}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">카메라 앵글</label>
                  <p className="text-white">{currentPanel.cameraAngle}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">분위기</label>
                  <p className="text-white">{currentPanel.mood}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">조명</label>
                  <p className="text-white">{currentPanel.lighting}</p>
                </div>

                {/* Dialogues */}
                {currentPanel.dialogues.length > 0 && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">대사</label>
                    <div className="space-y-2">
                      {currentPanel.dialogues.map((dialogue) => (
                        <div
                          key={dialogue.id}
                          className="bg-gray-700/50 rounded-lg p-2"
                        >
                          <p className="text-xs text-purple-400">
                            {dialogue.characterName || '나레이션'}
                          </p>
                          <p className="text-white text-sm">{dialogue.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-center">패널을 선택하세요</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
