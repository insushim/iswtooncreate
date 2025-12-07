import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, LoadingSpinner, Dropdown, TextArea } from '@/components/common';
import { geminiService } from '@/services/gemini/GeminiService';
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
  const { currentProject } = useProjectStore();
  const { addToast } = useUIStore();

  const handleGenerateImage = async (resolution: 'preview' | 'high' = 'preview') => {
    if (!currentProject) return;

    setIsGenerating(true);

    try {
      // Build prompt from panel data
      const characterDescriptions = panel.characters
        .map((c) => `${c.characterName}: ${c.expression} expression, ${c.pose} pose, facing ${c.facing}`)
        .join('; ');

      const prompt = `
        ${panel.composition}
        Characters: ${characterDescriptions}
        Background: ${panel.background.description}, ${panel.background.timeOfDay}, ${panel.background.weather}
        Mood: ${panel.mood}
        Lighting: ${panel.lighting}
        Camera: ${panel.cameraAngle}
      `.trim();

      // Get reference images for character consistency
      const referenceImages = currentProject.characters
        .filter((c) => panel.characters.some((pc) => pc.characterId === c.id))
        .flatMap((c) => c.referenceImages.filter((r) => r.type === 'anchor').map((r) => r.imageData))
        .slice(0, 3);

      const result = await geminiService.generateImage(prompt, {
        resolution,
        styleAnchor: currentProject.styleGuide.anchorPrompt,
        referenceImages,
        useCache: true,
      });

      if (resolution === 'preview') {
        setPreviewImage(result.imageData);
      } else {
        onUpdate({
          generatedImage: {
            id: Date.now().toString(),
            resolution,
            imageData: result.imageData,
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

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-purple-400">#{panel.panelNumber}</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            panel.status === 'approved' ? 'bg-green-500/20 text-green-400' :
            panel.status === 'preview' ? 'bg-yellow-500/20 text-yellow-400' :
            panel.status === 'regenerating' ? 'bg-blue-500/20 text-blue-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {panel.status === 'approved' ? '승인됨' :
             panel.status === 'preview' ? '프리뷰' :
             panel.status === 'regenerating' ? '재생성 중' : '대기'}
          </span>
        </div>
        <div className="flex gap-2">
          <Dropdown
            options={panelSizes}
            value={panel.size}
            onChange={(value) => onUpdate({ size: value as PanelSize })}
            placeholder="크기"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4">
        {/* Image Preview */}
        <div className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden relative">
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
                className="w-full h-full object-cover"
              />
            ) : panel.generatedImage ? (
              <motion.img
                key="generated"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={panel.generatedImage.imageData}
                alt={`Panel ${panel.panelNumber}`}
                className="w-full h-full object-cover"
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
                  <span className="text-4xl mb-2 block">🎨</span>
                  <p className="text-gray-400 text-sm">이미지를 생성해주세요</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Panel Settings */}
        <div className="space-y-4">
          <Dropdown
            label="카메라 앵글"
            options={cameraAngles}
            value={panel.cameraAngle}
            onChange={(value) => onUpdate({ cameraAngle: value as CameraAngle })}
          />

          <TextArea
            label="장면 설명"
            value={panel.composition}
            onChange={(e) => onUpdate({ composition: e.target.value })}
            rows={3}
            placeholder="패널에 표현할 장면을 설명해주세요"
          />

          <TextArea
            label="분위기 & 조명"
            value={`${panel.mood}, ${panel.lighting}`}
            onChange={(e) => {
              const [mood, lighting] = e.target.value.split(',').map((s) => s.trim());
              onUpdate({ mood, lighting });
            }}
            rows={2}
            placeholder="분위기, 조명"
          />

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {previewImage ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setPreviewImage(null)}
                  fullWidth
                >
                  다시 생성
                </Button>
                <Button
                  variant="primary"
                  onClick={handleApprovePreview}
                  fullWidth
                >
                  승인
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleGenerateImage('high')}
                  disabled={isGenerating}
                >
                  고해상도
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                onClick={() => handleGenerateImage('preview')}
                disabled={isGenerating}
                loading={isGenerating}
                fullWidth
              >
                {panel.generatedImage ? '재생성' : '이미지 생성'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Characters in Panel */}
      {panel.characters.length > 0 && (
        <div className="px-4 pb-4">
          <p className="text-sm text-gray-400 mb-2">등장 캐릭터</p>
          <div className="flex flex-wrap gap-2">
            {panel.characters.map((char, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-700 rounded-full text-sm text-white"
              >
                {char.characterName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
