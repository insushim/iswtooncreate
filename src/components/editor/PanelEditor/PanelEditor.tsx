import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, LoadingSpinner, Dropdown } from '@/components/common';
import { geminiService } from '@/services/gemini/GeminiService';
import { renderSpeechBubble } from '@/utils/speechBubbleRenderer';
import type { Panel, PanelSize, CameraAngle } from '@/types';
import { useProjectStore, useUIStore } from '@/stores';

interface PanelEditorProps {
  panel: Panel;
  episodeId: string;
  onUpdate: (updates: Partial<Panel>) => void;
}

const panelSizes: { value: PanelSize; label: string }[] = [
  { value: 'full', label: '전체' },
  { value: 'large', label: '대형' },
  { value: 'medium', label: '중형' },
  { value: 'small', label: '소형' },
  { value: 'wide', label: '가로형' },
  { value: 'tall', label: '세로형' },
];

const cameraAngles: { value: CameraAngle; label: string }[] = [
  { value: 'close-up', label: '클로즈업' },
  { value: 'medium-shot', label: '미디엄샷' },
  { value: 'wide-shot', label: '와이드샷' },
  { value: 'extreme-close-up', label: '익스트림 클로즈업' },
  { value: 'bird-eye', label: '버드아이' },
  { value: 'worm-eye', label: '웜아이' },
  { value: 'dutch-angle', label: '더치앵글' },
  { value: 'over-shoulder', label: '오버숄더' },
  { value: 'pov', label: 'POV' },
];

export const PanelEditor: React.FC<PanelEditorProps> = ({
  panel,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  episodeId: _episodeId,
  onUpdate,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const { currentProject } = useProjectStore();
  const { addToast } = useUIStore();

  const handleGenerateImage = async (resolution: 'preview' | 'high' = 'preview') => {
    if (!currentProject) return;

    setIsGenerating(true);

    try {
      // 현재 에피소드 찾기
      const currentEpisode = currentProject.episodes.find(ep =>
        ep.panels.some(p => p.id === panel.id)
      );
      const currentPanelIndex = currentEpisode?.panels.findIndex(p => p.id === panel.id) ?? -1;

      // 앞 5개 씬 참조 정보 수집 (일관성 유지용)
      let previousScenesContext = '';
      if (currentEpisode && currentPanelIndex > 0) {
        const startIdx = Math.max(0, currentPanelIndex - 5);
        const previousPanels = currentEpisode.panels.slice(startIdx, currentPanelIndex);

        if (previousPanels.length > 0) {
          const prevContexts = previousPanels.map((p, idx) => {
            const chars = p.characters.map(c => c.characterName).join(', ');
            return `Panel ${startIdx + idx + 1}: ${p.composition?.slice(0, 100) || 'no description'}${chars ? ` [Characters: ${chars}]` : ''} [Camera: ${p.cameraAngle}] [Mood: ${p.mood || 'neutral'}] [Lighting: ${p.lighting}]`;
          }).join('\n');
          previousScenesContext = `\n\nPREVIOUS PANELS CONTEXT (maintain visual consistency with these):\n${prevContexts}`;
        }
      }

      // 장면 설명 (영어만 사용)
      const sceneDesc = panel.composition || panel.background?.description || '';

      // 세계관/시대 배경 가져오기
      const worldSetting = currentProject.worldBuilding;
      const era = worldSetting?.era || '';
      const setting = worldSetting?.setting || '';

      // 피드백에서 시대 오버라이드 감지 (피드백이 최우선!)
      const feedbackRequestsModern = /현대|modern|사무실|office|아파트|apartment|도시|city|스마트폰|컴퓨터|노트북/i.test(feedback);
      const feedbackRequestsAncient = /고대|ancient|고구려|삼국|조선|고려|한복|전통/i.test(feedback);

      // 세계관 기반 시대/의상 스타일 결정
      let eraStyle = '';
      let costumeStyle = '';
      let isHistorical = false;

      // 피드백이 현대를 요청하면 현대로 설정 (세계관 무시!)
      if (feedbackRequestsModern) {
        eraStyle = 'modern contemporary Korean setting, current day Seoul, modern buildings, urban environment';
        costumeStyle = 'modern Korean fashion, casual modern clothing';
        isHistorical = false;
        console.log('[PanelEditor] Feedback requests modern setting - overriding worldbuilding');
      }
      // 피드백이 고대를 요청하면 고대로 설정
      else if (feedbackRequestsAncient) {
        eraStyle = 'ancient Korean historical setting, traditional architecture';
        costumeStyle = 'traditional Korean hanbok';
        isHistorical = true;
        console.log('[PanelEditor] Feedback requests ancient setting');
      }
      // 피드백에 시대 지정이 없으면 세계관 사용
      else if (era.includes('철기') || era.includes('고구려') || era.includes('ancient') || era.includes('삼국') ||
          setting.includes('철기') || setting.includes('고구려') || setting.includes('삼국')) {
        eraStyle = 'ancient Korean Three Kingdoms period, traditional hanok architecture, wooden structures';
        costumeStyle = 'ancient Korean hanbok, layered silk robes, traditional hair accessories';
        isHistorical = true;
      } else if (era.includes('조선') || setting.includes('조선')) {
        eraStyle = 'Joseon Dynasty Korea, traditional hanok, paper windows';
        costumeStyle = 'Joseon era hanbok';
        isHistorical = true;
      } else if (era.includes('고려') || setting.includes('고려')) {
        eraStyle = 'Goryeo Dynasty Korea, Buddhist temples, traditional architecture';
        costumeStyle = 'Goryeo era traditional clothing';
        isHistorical = true;
      } else if (era.includes('현대') || era.includes('modern') || setting.includes('현대')) {
        eraStyle = 'modern contemporary Korean setting, current day';
        costumeStyle = 'modern Korean fashion';
        isHistorical = false;
      }

      // 장면 설명에서도 시대 감지 (세계관 없고 피드백 없을 때)
      if (!eraStyle) {
        const isModernScene = /modern|office|computer|contemporary|apartment|city|urban|smartphone|laptop|desk|cubicle/i.test(sceneDesc);
        if (isModernScene) {
          eraStyle = 'modern contemporary Korean setting, current day';
          costumeStyle = 'modern Korean fashion';
        }
      }

      // 역사물인 경우 강력한 시대 일관성 경고 추가
      const historicalWarning = isHistorical
        ? '\n\nCRITICAL ERA CONSISTENCY: This is a HISTORICAL setting. ABSOLUTELY NO modern elements allowed - no modern buildings, no electricity, no modern clothing, no glasses, no modern hairstyles. Everything must be period-accurate.'
        : '';


      // 패널에 등장하는 캐릭터의 상세 정보 가져오기 (영어로) - 일관성 강화
      const characterDetails = panel.characters.map((pc) => {
        const fullCharacter = currentProject.characters.find(
          (c) => c.name === pc.characterName || c.koreanName === pc.characterName
        );
        if (fullCharacter) {
          const gender = fullCharacter.gender === 'female' ? 'beautiful young Korean woman' :
                        fullCharacter.gender === 'male' ? 'handsome young Korean man' : 'Korean person';
          const age = fullCharacter.age || 25;
          const hairColor = fullCharacter.appearance?.hairColor || 'black';
          const hairStyle = fullCharacter.appearance?.hairStyle || 'long';
          const eyeColor = fullCharacter.appearance?.eyeColor || 'dark brown';
          const bodyType = fullCharacter.appearance?.bodyType || 'slim';
          const height = fullCharacter.appearance?.height || '';
          const skinTone = fullCharacter.appearance?.skinTone || 'fair';
          const faceShape = fullCharacter.appearance?.faceShape || 'oval';
          const eyeShape = fullCharacter.appearance?.eyeShape || 'almond';
          const features = fullCharacter.appearance?.distinguishingFeatures?.join(', ') || '';
          const defaultOutfit = fullCharacter.appearance?.defaultOutfit || '';

          // 캐릭터의 기본 의상이 있으면 사용, 없으면 시대에 맞는 의상 (세계관 우선)
          const clothing = defaultOutfit
            ? defaultOutfit
            : costumeStyle || (isHistorical ? 'traditional Korean hanbok' : 'modern Korean clothing');

          // 캐릭터 역할에 따른 의상 품질
          const roleBasedClothing = fullCharacter.role === 'protagonist'
            ? `elegant ${clothing}, high quality fabric`
            : fullCharacter.role === 'antagonist'
              ? `imposing ${clothing}, dark tones`
              : clothing;

          // 더 상세한 캐릭터 설명으로 일관성 강화
          return `[CHARACTER: ${fullCharacter.name}] ${gender}, exactly ${age} years old, MUST have ${hairColor} ${hairStyle} hair, ${eyeColor} ${eyeShape} eyes, ${skinTone} skin, ${faceShape} face, ${bodyType} body${height ? `, ${height}` : ''}, wearing ${roleBasedClothing}${features ? `. Distinctive features: ${features}` : ''}. CRITICAL: Keep this character's face and appearance EXACTLY consistent with reference image provided.`;
        }
        return isHistorical ? 'Korean person in traditional hanbok, period-accurate clothing' : 'Korean person in modern clothing';
      }).join('\n');

      // 대사는 Canvas로 합성하므로 AI는 말풍선을 그리지 않음
      const dialogueText = panel.dialogues?.[0]?.text || '';

      // 패널 속성 정보
      const panelMood = panel.mood || 'peaceful';
      const panelLighting = panel.lighting || 'natural';
      const panelSize = panel.size || 'medium';
      const panelCamera = panel.cameraAngle || 'medium-shot';

      // 조명 설명 매핑
      const lightingDescriptions: Record<string, string> = {
        natural: 'bright natural daylight, clear illumination',
        sunset: 'warm golden hour lighting, orange and pink tones',
        night: 'dark nighttime atmosphere with moonlight, blue shadows',
        indoor: 'soft indoor artificial lighting, warm ambient',
        dramatic: 'high contrast dramatic lighting, deep shadows, strong highlights',
        soft: 'soft diffused lighting, gentle shadows',
        backlight: 'strong backlight creating silhouette effect, rim lighting',
        neon: 'colorful neon glow, cyberpunk atmosphere',
      };

      // 분위기 설명 매핑
      const moodDescriptions: Record<string, string> = {
        happy: 'bright cheerful atmosphere, warm colors',
        sad: 'melancholic mood, muted colors, somber tone',
        angry: 'intense aggressive mood, sharp contrasts',
        romantic: 'soft romantic atmosphere, warm pink tones',
        tense: 'suspenseful tension, dramatic shadows',
        mysterious: 'enigmatic mysterious mood, dark atmosphere',
        comedic: 'light humorous tone, exaggerated expressions',
        peaceful: 'calm serene atmosphere, gentle lighting',
        dramatic: 'intense dramatic mood, high contrast',
        nostalgic: 'warm nostalgic feeling, sepia tones',
      };

      // 카메라 앵글 설명 매핑
      const cameraDescriptions: Record<string, string> = {
        'close-up': 'close-up shot focusing on face and expression',
        'extreme-close-up': 'extreme close-up on eyes or specific detail',
        'medium-shot': 'medium shot showing upper body',
        'wide-shot': 'wide establishing shot showing full scene with background',
        'bird-eye': 'bird\'s eye view from above looking down',
        'worm-eye': 'low angle worm\'s eye view looking up',
        'dutch-angle': 'tilted dutch angle creating unease',
        'over-shoulder': 'over the shoulder perspective',
        'pov': 'first person point of view',
      };

      const lightingDesc = lightingDescriptions[panelLighting] || 'natural lighting';
      const moodDesc = moodDescriptions[panelMood] || 'neutral atmosphere';
      const cameraDesc = cameraDescriptions[panelCamera] || 'medium shot';

      // 웹툰 스타일 이미지 생성용 프롬프트
      // 피드백이 있으면 최우선으로 적용
      const feedbackSection = feedback
        ? `\n\n**CRITICAL USER FEEDBACK (MUST APPLY)**: ${feedback}\nThis feedback overrides any conflicting settings above.`
        : '';

      const prompt = `Webtoon illustration, Korean manhwa style, clean detailed lineart, cel-shading, professional quality.

SCENE DESCRIPTION:
${sceneDesc}

VISUAL STYLE:
- Panel type: ${panelSize} panel
- Camera: ${cameraDesc}
- Lighting: ${lightingDesc}
- Mood/Atmosphere: ${moodDesc}

${characterDetails ? `CHARACTERS IN SCENE:\n${characterDetails}` : ''}

${eraStyle ? `SETTING/ERA: ${eraStyle}` : ''}
${costumeStyle ? `COSTUME STYLE: ${costumeStyle}` : ''}
${historicalWarning}
${previousScenesContext}
${feedbackSection}

IMPORTANT: Maintain visual consistency with character appearances. Use ${cameraDesc} composition. Create ${moodDesc} with ${lightingDesc}.`;

      console.log('[PanelEditor] Generated prompt:', prompt);


      // 패널에 등장하는 캐릭터들의 레퍼런스 이미지 수집 (최대 14개 - Gemini 3 Pro Image 지원)
      const allRefImages: string[] = [];

      // 1. 캐릭터 참조 이미지 수집 (얼굴, 표정, 포즈, 의상)
      for (const pc of panel.characters) {
        const fullCharacter = currentProject.characters.find(
          (c) => c.name === pc.characterName || c.koreanName === pc.characterName
        );
        if (fullCharacter) {
          // anchor 이미지 (기본 얼굴/외모) - 최우선
          const anchorImages = fullCharacter.referenceImages?.filter(img => img.type === 'anchor') || [];
          for (const img of anchorImages.slice(0, 2)) {
            allRefImages.push(img.imageData);
          }

          // 표정 참조 이미지 (패널의 감정에 맞는 것)
          const expressionImages = fullCharacter.expressions?.filter(exp => exp.imageData) || [];
          for (const exp of expressionImages.slice(0, 1)) {
            if (exp.imageData) allRefImages.push(exp.imageData);
          }

          // 포즈 참조 이미지
          const poseImages = fullCharacter.poses?.filter(pose => pose.imageData) || [];
          for (const pose of poseImages.slice(0, 1)) {
            if (pose.imageData) allRefImages.push(pose.imageData);
          }

          // 의상 참조 이미지
          const outfitImages = fullCharacter.outfits?.filter(outfit => outfit.imageData) || [];
          for (const outfit of outfitImages.slice(0, 1)) {
            if (outfit.imageData) allRefImages.push(outfit.imageData);
          }

          // 기타 레퍼런스 이미지
          const otherRefs = fullCharacter.referenceImages?.filter(img => img.type !== 'anchor') || [];
          for (const img of otherRefs.slice(0, 1)) {
            allRefImages.push(img.imageData);
          }
        }
      }

      // 2. 배경/장소 참조 이미지 수집
      if (currentProject.worldBuilding?.mainLocations) {
        const locationName = panel.background?.description?.toLowerCase() || '';
        for (const location of currentProject.worldBuilding.mainLocations) {
          if (locationName.includes(location.name.toLowerCase())) {
            // 해당 장소의 시간대/날씨 변형 이미지
            for (const variation of location.variations || []) {
              if (variation.generatedImage) {
                allRefImages.push(variation.generatedImage);
                break; // 하나만 사용
              }
            }
          }
        }
      }

      // 3. 이전 패널의 이미지 (화 내 일관성) - 최대 5개 참조
      if (currentEpisode && currentPanelIndex > 0) {
        const startIdx = Math.max(0, currentPanelIndex - 5);
        const previousPanels = currentEpisode.panels.slice(startIdx, currentPanelIndex);

        // 가장 최근 패널부터 역순으로 추가 (최신이 더 중요)
        for (let i = previousPanels.length - 1; i >= 0; i--) {
          const prevPanel = previousPanels[i];
          if (prevPanel.generatedImage?.imageData && allRefImages.length < 12) {
            allRefImages.push(prevPanel.generatedImage.imageData);
          }
        }
      }

      // 최대 14개로 제한 (Gemini 3 Pro Image 한계)
      const characterRefImages = allRefImages.slice(0, 14);

      const result = await geminiService.generateImage(prompt, {
        resolution,
        styleAnchor: '',
        referenceImages: characterRefImages,
        useCache: false,
      });

      // 대사가 있으면 Canvas로 한글 텍스트 합성 (이미지 상단에)
      let finalImageData = result.imageData;
      if (dialogueText) {
        try {
          const bubbleStyle = panel.dialogues?.[0]?.bubbleStyle;
          const validBubbleStyle = (bubbleStyle === 'thought' || bubbleStyle === 'shout') ? bubbleStyle : 'normal';
          finalImageData = await renderSpeechBubble(result.imageData, {
            text: dialogueText,
            position: panel.dialogues?.[0]?.position || { x: 50, y: 15 },
            fontSize: 28,
            bubbleStyle: validBubbleStyle,
          });
        } catch (err) {
          console.error('Speech bubble rendering failed:', err);
        }
      }

      if (resolution === 'preview') {
        setPreviewImage(finalImageData);
      } else {
        onUpdate({
          generatedImage: {
            id: Date.now().toString(),
            resolution,
            imageData: finalImageData,
            promptUsed: prompt,
            generatedAt: new Date(),
            fromCache: result.fromCache,
            cost: result.cost,
          },
          status: 'approved',
        });
        setPreviewImage(null);
      }

      addToast({
        message: resolution === 'preview' ? '프리뷰가 생성되었습니다' : '고해상도 이미지가 생성되었습니다',
        type: 'success',
      });
    } catch (error) {
      console.error('Image generation failed:', error);
      addToast({
        message: '이미지 생성에 실패했습니다',
        type: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprovePreview = () => {
    if (previewImage) {
      onUpdate({
        generatedImage: {
          id: Date.now().toString(),
          resolution: 'preview',
          imageData: previewImage,
          promptUsed: panel.visualPrompt,
          generatedAt: new Date(),
          fromCache: false,
          cost: 0.001,
        },
        status: 'approved',
      });
      setPreviewImage(null);
    }
  };

  // 대사 텍스트
  const dialogueText = panel.dialogues?.[0]?.text || '';

  // 한글 변환 맵
  const cameraLabels: Record<string, string> = { 'close-up': '클로즈업', 'extreme-close-up': '익스트림', 'medium-shot': '미디엄', 'wide-shot': '와이드', 'bird-eye': '버드아이', 'worm-eye': '웜아이', 'dutch-angle': '더치', 'over-shoulder': '오버숄더', 'pov': 'POV' };
  const moodLabels: Record<string, string> = { happy: '밝음', sad: '슬픔', angry: '분노', romantic: '로맨틱', tense: '긴장', mysterious: '미스터리', comedic: '코믹', peaceful: '평화', dramatic: '극적', nostalgic: '향수' };
  const lightingLabels: Record<string, string> = { natural: '자연광', sunset: '석양', night: '야간', indoor: '실내', dramatic: '극적', soft: '소프트', backlight: '역광', neon: '네온' };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-purple-400">#{panel.panelNumber}</span>
          {panel.characters?.[0]?.characterName && (
            <span className="text-sm text-gray-300">{panel.characters[0].characterName}</span>
          )}
          {/* 패널 속성 뱃지 */}
          <div className="flex gap-1.5">
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
              {cameraLabels[panel.cameraAngle] || panel.cameraAngle}
            </span>
            {panel.mood && (
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                {moodLabels[panel.mood] || panel.mood}
              </span>
            )}
            {panel.lighting && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                {lightingLabels[panel.lighting] || panel.lighting}
              </span>
            )}
          </div>
        </div>
        <Dropdown
          options={panelSizes}
          value={panel.size}
          onChange={(value) => onUpdate({ size: value as PanelSize })}
          placeholder="크기"
        />
      </div>

      {/* Main Content - 더 넓은 레이아웃 */}
      <div className="p-4">
        {/* 대사 표시 (있을 경우) */}
        {dialogueText && (
          <div className="mb-4 p-3 bg-white/10 rounded-lg border-l-4 border-purple-500">
            <p className="text-sm text-gray-400 mb-1">💬 대사</p>
            <p className="text-white text-lg font-medium">"{dialogueText}"</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {/* Image Preview - 더 큰 영역 */}
          <div className="col-span-2">
            <div className="aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden relative">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <LoadingSpinner size="lg" className="mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">이미지 생성 중...</p>
                    </div>
                  </motion.div>
                ) : previewImage ? (
                  <motion.img
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-contain bg-gray-950"
                  />
                ) : panel.generatedImage ? (
                  <motion.img
                    key="generated"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    src={panel.generatedImage.imageData}
                    alt={`Panel ${panel.panelNumber}`}
                    className="w-full h-full object-contain bg-gray-950"
                  />
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <span className="text-5xl mb-3 block">🎨</span>
                      <p className="text-gray-400">이미지를 생성해주세요</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Panel Settings - 우측 */}
          <div className="space-y-3">
            <Dropdown
              label="앵글"
              options={cameraAngles}
              value={panel.cameraAngle}
              onChange={(value) => onUpdate({ cameraAngle: value as CameraAngle })}
            />

            <div>
              <label className="block text-xs text-gray-400 mb-1">장면 설명</label>
              <textarea
                value={panel.composition}
                onChange={(e) => onUpdate({ composition: e.target.value })}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm resize-none"
                placeholder="장면 설명..."
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">대사 수정</label>
              <textarea
                value={dialogueText}
                onChange={(e) => {
                  const newDialogues = panel.dialogues?.length
                    ? [{ ...panel.dialogues[0], text: e.target.value }]
                    : [{ id: `dlg-${Date.now()}`, text: e.target.value, type: 'speech' as const, bubbleStyle: 'normal' as const, position: { x: 50, y: 20 }, size: { width: 200, height: 80 }, fontSize: 'medium' as const }];
                  onUpdate({ dialogues: newDialogues });
                }}
                rows={2}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm resize-none"
                placeholder="캐릭터 대사..."
              />
            </div>
          </div>
        </div>

        {/* 피드백 입력 및 재생성 */}
        <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
          <label className="block text-sm text-gray-300 mb-2">✏️ 그림 보완점 (재생성 시 반영)</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={2}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm resize-none mb-3"
            placeholder="예: 표정을 더 밝게, 배경을 어둡게, 앵글을 클로즈업으로... (대사는 위 '대사 수정'에 입력)"
          />

          <div className="flex gap-2 flex-wrap">
            {/* 이미지 생성/재생성 버튼 - 항상 표시 */}
            <Button
              variant="primary"
              onClick={() => handleGenerateImage('preview')}
              disabled={isGenerating}
              loading={isGenerating}
            >
              {panel.generatedImage || previewImage ? '🔄 재생성' : '🎨 이미지 생성'}
            </Button>

            {/* 프리뷰가 있을 때만 승인/취소 버튼 표시 */}
            {previewImage && (
              <>
                <Button variant="primary" onClick={handleApprovePreview} size="sm">
                  ✓ 승인
                </Button>
                <Button variant="secondary" onClick={() => setPreviewImage(null)} size="sm">
                  취소
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
