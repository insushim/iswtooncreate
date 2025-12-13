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
  const [showMissingPanelModal, setShowMissingPanelModal] = useState(false);
  const [missingPanelNumbers, setMissingPanelNumbers] = useState<number[]>([]);

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

      // 캐릭터 정보 수집 (일관성 유지용)
      const characterInfos = currentProject.characters.map(c => {
        const gender = c.gender === 'female' ? 'woman' : c.gender === 'male' ? 'man' : 'person';
        const hairColor = c.appearance?.hairColor || 'black';
        const hairStyle = c.appearance?.hairStyle || 'long';
        const eyeColor = c.appearance?.eyeColor || 'dark brown';
        const outfit = c.appearance?.defaultOutfit || '';
        const features = c.appearance?.distinguishingFeatures?.join(', ') || '';
        return `${c.name}: ${gender}, ${hairColor} ${hairStyle} hair, ${eyeColor} eyes${outfit ? `, wearing ${outfit}` : ''}${features ? `, features: ${features}` : ''}`;
      }).join('\n');

      // 장소 정보 수집
      const locationInfos = worldInfo?.mainLocations?.map((loc: any) =>
        `${loc.name}: ${loc.description || ''}`
      ).join('\n') || '';

      // 60~80개 패널 생성 (웹툰 1화 적정 분량)
      const targetPanelCount = 70;

      const prompt = `웹툰 ${currentEpisode.episodeNumber}화 패널 ${targetPanelCount}개 생성. JSON 출력.

스토리: ${currentEpisode.summary}
배경: ${eraInfo}, ${settingInfo}
주요 이벤트: ${currentEpisode.keyEvents?.join(', ') || ''}

캐릭터:
${characterInfos}

장소:
${locationInfos}

⚠️⚠️⚠️ 매우 중요 - 반드시 이 형식으로 출력 ⚠️⚠️⚠️

{"panels":[
{"n":1,"size":"full","camera":"wide-shot","mood":"mysterious","lighting":"night","img":"[LOCATION: 어두운 사무실, 모니터 불빛만 비침] [CHARACTER: 하늘, 20대 여성, 검은 긴 머리 흐트러짐, 다크서클, 후드티] [ATMOSPHERE: 새벽 3시, 차가운 모니터 빛]","dialog":""},
{"n":2,"size":"small","camera":"extreme-close-up","mood":"tense","lighting":"dramatic","img":"[FOCUS: 디지털 시계 03:42 AM]","dialog":""},
{"n":3,"size":"medium","camera":"medium-shot","mood":"sad","lighting":"indoor","img":"[CHARACTER: 하늘, 지친 표정으로 키보드 타이핑]","dialog":"젠장..."}
]}

📌 각 패널에 반드시 포함할 6개 필드:
- "n": 패널 번호 (1-${targetPanelCount})
- "size": full/large/medium/small/wide 중 하나
- "camera": close-up/extreme-close-up/medium-shot/wide-shot/bird-eye/worm-eye/dutch-angle/over-shoulder 중 하나
- "mood": happy/sad/angry/romantic/tense/mysterious/comedic/peaceful/dramatic/nostalgic 중 하나
- "lighting": natural/sunset/night/indoor/dramatic/soft/backlight/neon 중 하나
- "img": 영어로 상세한 장면 설명
- "dialog": 한국어 대사 또는 ""

📊 다양하게 사용해야 할 비율:
- size: full 10개, large 15개, medium 30개, small 15개
- camera: 다양한 앵글을 씬에 맞게 사용
- mood: 장면 감정에 맞게 변경
- lighting: 시간대와 분위기에 맞게 변경

🎨 img 필드 작성법 (영어로):
[LOCATION: 장소 상세 - 건물, 가구, 소품]
[CHARACTER: 이름, 성별, 나이, 머리색+스타일, 눈색, 표정, 포즈, 의상 상세]
[ATMOSPHERE: 조명 방향, 그림자, 날씨]

규칙:
1. 정확히 ${targetPanelCount}개 패널 생성 (1-${targetPanelCount})
2. 모든 패널에 size, camera, mood, lighting 필드 필수!
3. img는 영어로만, dialog는 한국어로만
4. 대사 없는 장면은 dialog를 "" 로
5. JSON만 출력, { 로 시작`;

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

        // AI가 생성한 패널 속성 추출 (기본값 포함)
        const panelSize = panelData.size || 'medium';
        const cameraAngle = panelData.camera || 'medium-shot';
        const panelMood = panelData.mood || 'peaceful';
        const panelLighting = panelData.lighting || 'natural';

        // 디버깅: AI가 반환한 원본 값 확인
        console.log(`[Panel ${panelNum}] AI Values - size: ${panelData.size}, camera: ${panelData.camera}, mood: ${panelData.mood}, lighting: ${panelData.lighting}`);

        // 유효한 값인지 검증
        const validSizes = ['full', 'large', 'medium', 'small', 'wide', 'tall'];
        const validCameras = ['close-up', 'medium-shot', 'wide-shot', 'extreme-close-up', 'bird-eye', 'worm-eye', 'dutch-angle', 'over-shoulder', 'pov'];
        const validMoods = ['happy', 'sad', 'angry', 'romantic', 'tense', 'mysterious', 'comedic', 'peaceful', 'dramatic', 'nostalgic'];
        const validLighting = ['natural', 'sunset', 'night', 'indoor', 'dramatic', 'soft', 'backlight', 'neon'];

        const finalSize = validSizes.includes(panelSize) ? panelSize : 'medium';
        const finalCamera = validCameras.includes(cameraAngle) ? cameraAngle : 'medium-shot';
        const finalMood = validMoods.includes(panelMood) ? panelMood : 'peaceful';
        const finalLighting = validLighting.includes(panelLighting) ? panelLighting : 'natural';

        // 시간대 결정 (조명 기반)
        let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'afternoon';
        if (panelLighting === 'night') timeOfDay = 'night';
        else if (panelLighting === 'sunset') timeOfDay = 'evening';
        else if (panelLighting === 'soft') timeOfDay = 'morning';

        const panel: Omit<Panel, 'id'> = {
          episodeId: currentEpisode.id,
          panelNumber: panelNum,
          size: finalSize as any,
          cameraAngle: finalCamera as any,
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
            timeOfDay,
            weather: '',
            mood: finalMood,
            focusPoint: '',
            depth: finalSize === 'wide' || finalCamera === 'wide-shot' ? 'deep' : finalCamera === 'close-up' || finalCamera === 'extreme-close-up' ? 'shallow' : 'medium',
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
          mood: finalMood,
          lighting: finalLighting,
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

  // 빠진 패널 번호 찾기 (목표 패널 수: 70개)
  const findMissingPanels = (): number[] => {
    if (!currentEpisode) return [];

    const targetPanelCount = 70; // 목표 패널 수
    const existingNumbers = new Set(currentEpisode.panels.map(p => p.panelNumber));
    const missing: number[] = [];

    // 1번부터 목표 개수까지 확인
    for (let i = 1; i <= targetPanelCount; i++) {
      if (!existingNumbers.has(i)) {
        missing.push(i);
      }
    }

    return missing;
  };

  // 빠진 패널 확인 및 모달 표시
  const checkMissingPanels = () => {
    const missing = findMissingPanels();
    if (missing.length > 0) {
      setMissingPanelNumbers(missing);
      setShowMissingPanelModal(true);
    } else {
      addToast({ message: '빠진 패널이 없습니다!', type: 'success' });
    }
  };

  // 빠진 패널만 생성
  const generateMissingPanels = async (panelNumbers: number[]) => {
    if (!currentEpisode || !currentProject || panelNumbers.length === 0) return;

    setIsGeneratingPanels(true);
    setShowMissingPanelModal(false);
    addToast({ message: `${panelNumbers.length}개 빠진 패널을 생성하고 있습니다...`, type: 'info' });

    try {
      // 세계관 정보
      const worldInfo = currentProject.worldBuilding;
      const eraInfo = worldInfo?.era || '고대 한국';
      const settingInfo = worldInfo?.setting || '역사물';

      // 캐릭터 정보 수집
      const characterInfos = currentProject.characters.map(c => {
        const gender = c.gender === 'female' ? 'woman' : c.gender === 'male' ? 'man' : 'person';
        const hairColor = c.appearance?.hairColor || 'black';
        const hairStyle = c.appearance?.hairStyle || 'long';
        const eyeColor = c.appearance?.eyeColor || 'dark brown';
        const outfit = c.appearance?.defaultOutfit || '';
        return `${c.name}: ${gender}, ${hairColor} ${hairStyle} hair, ${eyeColor} eyes${outfit ? `, wearing ${outfit}` : ''}`;
      }).join('\n');

      // 앞뒤 패널 컨텍스트 수집
      const getContextForPanel = (panelNum: number) => {
        const prevPanel = currentEpisode.panels.find(p => p.panelNumber === panelNum - 1);
        const nextPanel = currentEpisode.panels.find(p => p.panelNumber === panelNum + 1);

        let context = '';
        if (prevPanel) {
          context += `Previous panel ${panelNum - 1}: ${prevPanel.composition?.slice(0, 100) || 'no description'}\n`;
        }
        if (nextPanel) {
          context += `Next panel ${panelNum + 1}: ${nextPanel.composition?.slice(0, 100) || 'no description'}\n`;
        }
        return context;
      };

      // 빠진 패널들의 컨텍스트
      const panelContexts = panelNumbers.map(num => {
        return `Panel ${num} context:\n${getContextForPanel(num)}`;
      }).join('\n\n');

      const prompt = `빠진 패널만 생성. JSON 출력.

스토리: ${currentEpisode.summary}
배경: ${eraInfo}, ${settingInfo}

캐릭터:
${characterInfos}

생성할 패널 번호: ${panelNumbers.join(', ')}

앞뒤 문맥:
${panelContexts}

⚠️⚠️⚠️ 반드시 이 형식으로 출력 ⚠️⚠️⚠️

{"panels":[
{"n":${panelNumbers[0]},"size":"medium","camera":"close-up","mood":"tense","lighting":"dramatic","img":"[LOCATION: 장소] [CHARACTER: 이름, 머리색, 표정, 의상] [ATMOSPHERE: 조명]","dialog":"한국어 대사"}
]}

📌 각 패널에 반드시 포함할 6개 필드:
- "n": 패널 번호
- "size": full/large/medium/small/wide 중 하나
- "camera": close-up/extreme-close-up/medium-shot/wide-shot/bird-eye/worm-eye/dutch-angle/over-shoulder 중 하나
- "mood": happy/sad/angry/romantic/tense/mysterious/comedic/peaceful/dramatic/nostalgic 중 하나
- "lighting": natural/sunset/night/indoor/dramatic/soft/backlight/neon 중 하나
- "img": 영어로 장면 설명
- "dialog": 한국어 대사 또는 ""

규칙:
1. 정확히 ${panelNumbers.join(', ')} 번 패널만 생성 (${panelNumbers.length}개)
2. 모든 패널에 size, camera, mood, lighting 필드 필수!
3. 앞뒤 패널과 자연스럽게 연결
4. JSON만 출력`;

      const response = await geminiService.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 16000,
        useCache: false,
      });

      const result = parseJsonResponse(response);

      if (!result.panels || result.panels.length === 0) {
        throw new Error('패널이 생성되지 않았습니다.');
      }

      // 유효한 값 목록
      const validSizes = ['full', 'large', 'medium', 'small', 'wide', 'tall'];
      const validCameras = ['close-up', 'medium-shot', 'wide-shot', 'extreme-close-up', 'bird-eye', 'worm-eye', 'dutch-angle', 'over-shoulder', 'pov'];
      const validMoods = ['happy', 'sad', 'angry', 'romantic', 'tense', 'mysterious', 'comedic', 'peaceful', 'dramatic', 'nostalgic'];
      const validLighting = ['natural', 'sunset', 'night', 'indoor', 'dramatic', 'soft', 'backlight', 'neon'];

      // 패널 추가
      let addedCount = 0;
      for (const panelData of result.panels) {
        const panelNum = panelData.n || panelData.panelNumber;

        // 요청한 번호인지 확인
        if (!panelNumbers.includes(panelNum)) {
          console.log(`[Missing Panel] Skipping panel ${panelNum} - not in requested list`);
          continue;
        }

        // 이미 존재하는지 확인
        const exists = currentEpisode.panels.some(p => p.panelNumber === panelNum);
        if (exists) {
          console.log(`[Missing Panel] Panel ${panelNum} already exists, skipping`);
          continue;
        }

        const imgDesc = panelData.img || panelData.sceneDescription || '';
        let dialogue = panelData.dialog ?? panelData.dialogue ?? '';

        // 영어 설명 필터링
        const hasKorean = /[가-힣]/.test(dialogue);
        const isEnglishDescription = !hasKorean && /^[a-zA-Z\s,.\-'":;!?]+$/.test(dialogue);
        if (dialogue && isEnglishDescription) {
          dialogue = '';
        }

        const panelSize = panelData.size || 'medium';
        const cameraAngle = panelData.camera || 'medium-shot';
        const panelMood = panelData.mood || 'peaceful';
        const panelLighting = panelData.lighting || 'natural';

        const finalSize = validSizes.includes(panelSize) ? panelSize : 'medium';
        const finalCamera = validCameras.includes(cameraAngle) ? cameraAngle : 'medium-shot';
        const finalMood = validMoods.includes(panelMood) ? panelMood : 'peaceful';
        const finalLighting = validLighting.includes(panelLighting) ? panelLighting : 'natural';

        let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'afternoon';
        if (panelLighting === 'night') timeOfDay = 'night';
        else if (panelLighting === 'sunset') timeOfDay = 'evening';

        const panel: Omit<Panel, 'id'> = {
          episodeId: currentEpisode.id,
          panelNumber: panelNum,
          size: finalSize as any,
          cameraAngle: finalCamera as any,
          composition: imgDesc,
          characters: [],
          background: {
            locationName: '',
            description: imgDesc,
            timeOfDay,
            weather: '',
            mood: finalMood,
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
          mood: finalMood,
          lighting: finalLighting,
          visualPrompt: imgDesc,
          status: 'pending',
        };

        await addPanel(currentEpisode.id, panel);
        addedCount++;
      }

      // 프로젝트 다시 로드
      await setCurrentProject(projectId!);

      addToast({ message: `${addedCount}개 빠진 패널이 추가되었습니다!`, type: 'success' });
    } catch (err) {
      console.error('Missing panel generation failed:', err);
      addToast({ message: '빠진 패널 생성에 실패했습니다. 다시 시도해주세요.', type: 'error' });
    } finally {
      setIsGeneratingPanels(false);
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

                {/* 패널이 있을 때 빠진 패널 확인 버튼 */}
                {currentEpisode.panels.length > 0 && (
                  <div className="mt-4 flex gap-2 justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={checkMissingPanels}
                      disabled={isGeneratingPanels}
                    >
                      🔍 빠진 패널 확인
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        const missing = findMissingPanels();
                        if (missing.length > 0) {
                          setMissingPanelNumbers(missing);
                          setShowMissingPanelModal(true);
                        } else {
                          addToast({ message: '이미 70개 패널이 모두 있습니다!', type: 'success' });
                        }
                      }}
                      disabled={isGeneratingPanels}
                      loading={isGeneratingPanels}
                    >
                      ➕ 패널 추가 생성 ({70 - (currentEpisode?.panels.length || 0)}개 남음)
                    </Button>
                  </div>
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
                  <p className="text-white">{
                    ({ full: '전체', large: '대형', medium: '중형', small: '소형', wide: '가로형', tall: '세로형', custom: '커스텀' } as Record<string, string>)[currentPanel.size] || currentPanel.size
                  }</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">카메라 앵글</label>
                  <p className="text-white">{
                    { 'close-up': '클로즈업', 'extreme-close-up': '익스트림 클로즈업', 'medium-shot': '미디엄샷', 'wide-shot': '와이드샷', 'bird-eye': '버드아이', 'worm-eye': '웜아이', 'dutch-angle': '더치앵글', 'over-shoulder': '오버숄더', 'pov': 'POV' }[currentPanel.cameraAngle] || currentPanel.cameraAngle
                  }</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">분위기</label>
                  <p className="text-white">{
                    { happy: '밝음 😊', sad: '슬픔 😢', angry: '분노 😠', romantic: '로맨틱 💕', tense: '긴장 😰', mysterious: '미스터리 🔮', comedic: '코믹 😂', peaceful: '평화 🌿', dramatic: '극적 🎭', nostalgic: '향수 🌅' }[currentPanel.mood] || currentPanel.mood || '없음'
                  }</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">조명</label>
                  <p className="text-white">{
                    { natural: '자연광 ☀️', sunset: '석양 🌅', night: '야간 🌙', indoor: '실내 💡', dramatic: '극적 🎬', soft: '소프트 🌤️', backlight: '역광 ✨', neon: '네온 🌈' }[currentPanel.lighting] || currentPanel.lighting
                  }</p>
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

      {/* 빠진 패널 모달 */}
      {showMissingPanelModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700"
          >
            <h3 className="text-xl font-bold text-white mb-4">🔍 빠진 패널 발견</h3>

            <p className="text-gray-400 mb-4">
              다음 패널 번호가 빠져있습니다:
            </p>

            <div className="bg-gray-900 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {missingPanelNumbers.map(num => (
                  <span
                    key={num}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium"
                  >
                    #{num}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              총 {missingPanelNumbers.length}개의 패널이 빠져있습니다.
              AI가 앞뒤 컨텍스트를 참고하여 빠진 패널을 생성합니다.
            </p>

            <div className="flex gap-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => generateMissingPanels(missingPanelNumbers)}
                disabled={isGeneratingPanels}
                loading={isGeneratingPanels}
              >
                빠진 패널 생성
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowMissingPanelModal(false)}
              >
                취소
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EditorPage;
