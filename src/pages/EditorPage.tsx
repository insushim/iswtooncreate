import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EditorToolbar, PanelEditor, Timeline } from '@/components/editor';
import { Button, LoadingSpinner, Tabs, Card } from '@/components/common';
import { useProjectStore, useUIStore } from '@/stores';
import { useAuthStore } from '@/stores/authStore';
import { geminiService } from '@/services/gemini/GeminiService';
import { parseJsonResponse } from '@/utils/parseJsonResponse';
import { exportEpisode } from '@/utils/exportWebtoon';
import type { Panel } from '@/types';

const EditorPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentProject, setCurrentProject, updatePanel, addPanel, deletePanel } = useProjectStore();
  const { selectedEpisodeId, setSelectedEpisode, selectedPanelId, setSelectedPanel, addToast } = useUIStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPanels, setIsGeneratingPanels] = useState(false);

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

  // AI 패널 자동 생성
  const generatePanelsForEpisode = async () => {
    if (!currentEpisode || !currentProject) return;

    setIsGeneratingPanels(true);
    addToast({ message: '패널을 생성하고 있습니다...', type: 'info' });

    try {
      // 세계관 정보
      const worldInfo = currentProject.worldBuilding;
      const eraInfo = worldInfo?.era || '고대 한국';
      const settingInfo = worldInfo?.setting || '역사물';

      // 60~80개 패널 생성 (웹툰 1화 적정 분량)
      const targetPanelCount = 70;

      const prompt = `웹툰 ${currentEpisode.episodeNumber}화 콘티. JSON으로 패널 ${targetPanelCount}개 생성.

줄거리: ${currentEpisode.summary}
세계관: ${eraInfo}, ${settingInfo}

출력형식:
{"panels":[
{"n":1,"img":"영어로 그림설명","dialog":"한국어 대사"},
{"n":2,"img":"영어로 그림설명","dialog":""}
]}

규칙:
1. 반드시 ${targetPanelCount}개 패널 생성 (웹툰 1화 분량)
2. img = 영어로만! 그림 설명 (구도, 표정, 배경 상세히)
3. dialog = 한국어 대사만. 캐릭터가 실제로 말하는 것!
4. dialog에 장면설명 절대 넣지마
5. 대사 없는 장면은 dialog를 빈칸 ""으로
6. 환생/빙의 스토리면 처음은 현대, 중간에 고대로 전환
7. 다양한 앵글 사용: 클로즈업, 미디엄샷, 와이드샷, 버드아이 등
8. 감정 표현 장면은 클로즈업으로
9. 액션/배경 설명은 와이드샷으로
10. 대화 장면은 미디엄샷으로
11. 1~${targetPanelCount}번까지 순서대로 생성`;

      const response = await geminiService.generateText(prompt, {
        temperature: 0.8,
        maxTokens: 32000, // 70개 패널을 위해 토큰 증가
        useCache: false,
      });

      // 디버깅: AI 원본 응답 확인
      console.log('[AI Response Raw]:', response);

      const result = parseJsonResponse(response);

      // 디버깅: 파싱된 결과 확인
      console.log('[Parsed Result]:', JSON.stringify(result, null, 2));

      if (!result.panels || result.panels.length === 0) {
        throw new Error('패널이 생성되지 않았습니다.');
      }

      // 패널 추가
      for (const panelData of result.panels) {
        // 디버깅: 각 패널 데이터 확인
        console.log('[Panel Data]:', JSON.stringify(panelData, null, 2));

        const panelNum = panelData.n || panelData.panelNumber || 1;
        const imgDesc = panelData.img || panelData.sceneDescription || '';
        // dialog 필드에서 대사 가져오기 (talk, dialog, dialogue, speech 모두 체크)
        let dialogue = panelData.dialog ?? panelData.dialogue ?? panelData.talk ?? panelData.speech ?? panelData.text ?? '';

        // 디버깅: 원본 대사 확인
        console.log(`[Panel ${panelNum}] Dialog field:`, panelData.dialog, '| Dialogue field:', panelData.dialogue, '| Final:', dialogue);

        // 대사가 영어 장면설명처럼 보이면 제거 (한국어 대사는 유지)
        // 영어가 주를 이루는 경우만 제거 (한국어 포함 시 유지)
        const hasKorean = /[가-힣]/.test(dialogue);
        const isEnglishDescription = !hasKorean && /^[a-zA-Z\s,.\-'":;!?]+$/.test(dialogue);
        if (dialogue && isEnglishDescription) {
          console.log(`[Panel ${panelNum}] Filtered out English description:`, dialogue);
          dialogue = '';
        }
        const charName = panelData.who || panelData.character || '';

        const panel: Omit<Panel, 'id'> = {
          episodeId: currentEpisode.id,
          panelNumber: panelNum,
          size: 'medium',
          cameraAngle: 'medium-shot',
          composition: imgDesc,
          characters: charName ? [{
            characterId: '',
            characterName: charName,
            position: { x: 50, y: 50 },
            scale: 1,
            expression: 'neutral',
            pose: 'standing',
            action: '',
            facing: 'front',
            layer: 1,
          }] : [],
          background: {
            locationName: '',
            description: imgDesc,
            timeOfDay: 'afternoon',
            weather: '',
            mood: '',
            focusPoint: '',
            depth: 'medium',
          },
          dialogues: dialogue ? [{
            id: `dlg-${Date.now()}-${panelNum}`,
            text: dialogue,
            type: 'speech',
            bubbleStyle: 'normal',
            position: { x: 50, y: 20 },
            size: { width: 200, height: 80 },
            fontSize: 'medium',
          }] : [],
          sfx: [],
          mood: '',
          lighting: 'natural',
          visualPrompt: imgDesc,
          status: 'pending',
        };

        await addPanel(currentEpisode.id, panel);
      }

      // 프로젝트 다시 로드
      await setCurrentProject(projectId!);

      addToast({ message: `${result.panels.length}개 패널이 생성되었습니다!`, type: 'success' });
    } catch (err) {
      console.error('Panel generation failed:', err);
      addToast({ message: '패널 생성에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    } finally {
      setIsGeneratingPanels(false);
    }
  };

  // 패널 삭제
  const handleDeletePanel = async (panelId: string) => {
    if (!selectedEpisodeId) return;
    await deletePanel(selectedEpisodeId, panelId);
    setSelectedPanel(null);
    addToast({ message: '패널이 삭제되었습니다', type: 'success' });
  };

  // 전체 패널 삭제
  const handleDeleteAllPanels = async () => {
    if (!currentEpisode) return;
    for (const panel of currentEpisode.panels) {
      await deletePanel(currentEpisode.id, panel.id);
    }
    setSelectedPanel(null);
    addToast({ message: '모든 패널이 삭제되었습니다', type: 'success' });
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

  // 현재 에피소드 인덱스
  const currentEpisodeIndex = currentProject?.episodes.findIndex(e => e.id === selectedEpisodeId) ?? -1;
  const hasPrevEpisode = currentEpisodeIndex > 0;
  const hasNextEpisode = currentEpisodeIndex < (currentProject?.episodes.length ?? 0) - 1;

  // 이전/다음 에피소드로 이동
  const goToPrevEpisode = () => {
    if (hasPrevEpisode && currentProject) {
      const prevEpisode = currentProject.episodes[currentEpisodeIndex - 1];
      setSelectedEpisode(prevEpisode.id);
      if (prevEpisode.panels.length > 0) {
        setSelectedPanel(prevEpisode.panels[0].id);
      } else {
        setSelectedPanel(null);
      }
    }
  };

  const goToNextEpisode = () => {
    if (hasNextEpisode && currentProject) {
      const nextEpisode = currentProject.episodes[currentEpisodeIndex + 1];
      setSelectedEpisode(nextEpisode.id);
      if (nextEpisode.panels.length > 0) {
        setSelectedPanel(nextEpisode.panels[0].id);
      } else {
        setSelectedPanel(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        {/* 왼쪽: 뒤로가기 + 프로젝트 정보 */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/create/${projectId}`)}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            프로젝트 설정
          </Button>
          <div className="text-gray-400">|</div>
          <h1 className="text-white font-bold">{currentProject.title}</h1>
        </div>

        {/* 중앙: 에피소드 네비게이션 */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevEpisode}
            disabled={!hasPrevEpisode}
            className={!hasPrevEpisode ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>

          <div className="bg-gray-700 rounded-lg px-4 py-2 min-w-[200px] text-center">
            <span className="text-purple-400 font-bold">
              {currentEpisode ? `${currentEpisode.episodeNumber}화` : '에피소드 선택'}
            </span>
            {currentEpisode && (
              <span className="text-gray-400 ml-2 text-sm">
                / {currentProject.episodes.length}화
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextEpisode}
            disabled={!hasNextEpisode}
            className={!hasNextEpisode ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        {/* 오른쪽: 클라우드 동기화 상태 */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <span>자동 동기화 중</span>
            </div>
          ) : (
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <span>로그인하여 동기화</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar
        projectTitle={currentProject.title}
        episodeTitle={currentEpisode?.title || '에피소드 선택'}
        onSave={() => addToast({ message: '저장되었습니다 (자동 저장됨)', type: 'success' })}
        onPreview={() => navigate(`/preview/${projectId}`)}
        onExport={async () => {
          if (!currentEpisode) {
            addToast({ message: '에피소드를 선택해주세요', type: 'error' });
            return;
          }
          const panelsWithImages = currentEpisode.panels.filter(p => p.generatedImage?.imageData);
          if (panelsWithImages.length === 0) {
            addToast({ message: '내보낼 이미지가 없습니다', type: 'error' });
            return;
          }
          try {
            addToast({ message: '이미지를 병합하고 있습니다...', type: 'info' });
            await exportEpisode(currentEpisode, { format: 'long-image' });
            addToast({ message: '내보내기 완료!', type: 'success' });
          } catch (err) {
            console.error('Export failed:', err);
            addToast({ message: '내보내기에 실패했습니다', type: 'error' });
          }
        }}
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
                onDeletePanel={handleDeletePanel}
                onDeleteAllPanels={handleDeleteAllPanels}
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
                      <p className="text-gray-400 mb-2">
                        {currentEpisode.panels.length === 0
                          ? '이 에피소드에 패널이 없습니다'
                          : '패널을 선택하거나 새로 추가하세요'}
                      </p>
                      {currentEpisode.panels.length === 0 && (
                        <p className="text-gray-500 text-sm mb-4">
                          AI가 에피소드 내용을 기반으로 패널을 자동 생성합니다
                        </p>
                      )}
                      <Button
                        variant="primary"
                        className="mt-4"
                        onClick={generatePanelsForEpisode}
                        disabled={isGeneratingPanels}
                        loading={isGeneratingPanels}
                      >
                        {isGeneratingPanels ? 'AI 패널 생성 중...' : 'AI 패널 자동 생성'}
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
