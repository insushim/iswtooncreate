import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BasicInfoStep,
  GenreStyleStep,
  PlanningStep,
  WorldBuildingStep,
  CharacterStep,
  StoryStructureStep,
  EpisodePlanStep,
  ReviewStep,
} from './steps';
import { WizardProgress } from './WizardProgress';
import { useProjectStore } from '@/stores/projectStore';
import { Button, Toast } from '@/components/common';

const WIZARD_STORAGE_KEY = 'webtoon_wizard_progress';

const STEPS = [
  { id: 'basic', title: '기본 정보', component: BasicInfoStep },
  { id: 'genre', title: '장르 & 스타일', component: GenreStyleStep },
  { id: 'planning', title: 'AI 기획', component: PlanningStep },
  { id: 'world', title: '세계관', component: WorldBuildingStep },
  { id: 'character', title: '캐릭터', component: CharacterStep },
  { id: 'story', title: '스토리 구조', component: StoryStructureStep },
  { id: 'episode', title: '에피소드', component: EpisodePlanStep },
  { id: 'review', title: '최종 확인', component: ReviewStep },
];

export interface WizardData {
  title: string;
  briefConcept: string;
  targetAudience: string;
  episodeCount: number;
  genre: string;
  subGenres: string[];
  mood: string[];
  artStyle: string;
  planning?: {
    synopsis: string;
    coreMessage: string;
    targetAnalysis: string;
    uniquePoints: string[];
    expectedDirection: string;
  };
  worldBuilding?: {
    era: string;
    setting: string;
    mainLocations: {
      id: string;
      name: string;
      description: string;
      significance: string;
      variations: any[];
    }[];
    specialRules?: string[];
    socialStructure?: string;
    technology?: string;
  };
  characters: any[];
  storyStructure?: {
    acts: any[];
    majorPlotPoints: any[];
    subplots: any[];
    themes: string[];
  };
  episodePlans: any[];
  styleGuide?: any;
}

const initialData: WizardData = {
  title: '',
  briefConcept: '',
  targetAudience: 'all',
  episodeCount: 10,
  genre: '',
  subGenres: [],
  mood: [],
  artStyle: 'korean-webtoon',
  characters: [],
  episodePlans: [],
};

interface StepWizardProps {
  editProjectId?: string;
}

export const StepWizard: React.FC<StepWizardProps> = ({ editProjectId }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);

  // 스텝 변경 시 isGenerating 초기화
  useEffect(() => {
    setIsGenerating(false);
  }, [currentStep]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedProgress, setSavedProgress] = useState<{ step: number; data: WizardData } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const navigate = useNavigate();
  const { createProject, setCurrentProject } = useProjectStore();

  // 기존 프로젝트 편집 모드: 프로젝트 데이터 로드
  useEffect(() => {
    if (editProjectId) {
      const loadProject = async () => {
        await setCurrentProject(editProjectId);
        const project = useProjectStore.getState().currentProject;
        if (project) {
          setIsEditMode(true);
          setWizardData({
            title: project.title,
            briefConcept: project.briefConcept,
            targetAudience: project.targetAudience,
            episodeCount: project.episodeCount,
            genre: project.genre,
            subGenres: project.subGenres || [],
            mood: project.mood || [],
            artStyle: project.artStyle,
            planning: project.planning,
            worldBuilding: project.worldBuilding,
            characters: project.characters || [],
            storyStructure: (project as any).storyStructure,
            episodePlans: project.episodes?.map(ep => ({
              episodeNumber: ep.episodeNumber,
              title: ep.title,
              summary: ep.summary,
              openingHook: (ep as any).openingHook || '',
              endingHook: ep.endingHook || '',
              keyScenes: (ep as any).keyScenes || [],
            })) || [],
            styleGuide: project.styleGuide,
          });
          // 편집 모드에서는 에피소드 스텝으로 바로 이동
          setCurrentStep(6); // episode step
        }
      };
      loadProject();
    }
  }, [editProjectId, setCurrentProject]);

  // 저장된 진행 상황 확인 (새 프로젝트일 때만)
  useEffect(() => {
    if (editProjectId) return; // 편집 모드면 스킵
    const saved = localStorage.getItem(WIZARD_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.data && parsed.data.title) {
          setSavedProgress(parsed);
          setShowResumeDialog(true);
        }
      } catch {}
    }
  }, [editProjectId]);

  // 진행 상황 자동 저장 (스텝 또는 데이터 변경 시)
  useEffect(() => {
    if (wizardData.title) {
      const progress = { step: currentStep, data: wizardData };
      localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(progress));
    }
  }, [currentStep, wizardData]);

  const handleResume = () => {
    if (savedProgress) {
      setWizardData(savedProgress.data);
      setCurrentStep(savedProgress.step);
    }
    setShowResumeDialog(false);
  };

  const handleStartNew = () => {
    localStorage.removeItem(WIZARD_STORAGE_KEY);
    setShowResumeDialog(false);
  };

  const CurrentStepComponent = STEPS[currentStep].component;

  const updateData = useCallback((updates: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleGoToStep = useCallback(
    (stepIndex: number) => {
      // 편집 모드에서는 모든 스텝으로 자유롭게 이동 가능
      if (isEditMode || stepIndex <= currentStep) {
        setCurrentStep(stepIndex);
      }
    },
    [currentStep, isEditMode]
  );

  // 에디터로 돌아가기 (편집 모드) - 변경사항 저장 후 이동
  const handleGoToEditor = useCallback(async () => {
    if (!editProjectId) return;

    try {
      setIsGenerating(true);
      const { updateProject, addEpisode, deleteEpisode } = useProjectStore.getState();
      const currentProject = useProjectStore.getState().currentProject;

      // 프로젝트 기본 정보 업데이트
      await updateProject(editProjectId, {
        planning: wizardData.planning,
        worldBuilding: wizardData.worldBuilding,
        subGenres: wizardData.subGenres as any,
      });

      // 기존 에피소드 삭제 후 새로 추가 (에피소드 플랜 동기화)
      if (currentProject?.episodes) {
        for (const ep of currentProject.episodes) {
          await deleteEpisode(editProjectId, ep.id);
        }
      }

      // 새 에피소드 플랜 저장
      for (const ep of wizardData.episodePlans) {
        await addEpisode(editProjectId, {
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          summary: ep.summary || '',
          status: 'planning',
          panels: [],
          keyEvents: ep.keyEvents || [],
          emotionalArc: ep.emotionalArc || 'exposition',
          endingHook: ep.endingHook || '',
          characters: ep.characters || [],
          locations: ep.locations || [],
          wordCount: 0,
          estimatedReadTime: 0,
          translations: new Map(),
        });
      }

      console.log(`[StepWizard] 저장 완료: ${wizardData.episodePlans.length}개 에피소드`);
      setToast({ message: `${wizardData.episodePlans.length}개 에피소드가 저장되었습니다!`, type: 'success' });

      setTimeout(() => {
        navigate(`/editor/${editProjectId}`);
      }, 500);
    } catch (error) {
      console.error('Save failed:', error);
      setToast({ message: '저장에 실패했습니다.', type: 'error' });
      setIsGenerating(false);
    }
  }, [editProjectId, navigate, wizardData]);

  const handleComplete = useCallback(async () => {
    try {
      setIsGenerating(true);

      const project = await createProject({
        title: wizardData.title,
        genre: wizardData.genre,
        targetAudience: wizardData.targetAudience,
        mood: wizardData.mood,
        briefConcept: wizardData.briefConcept,
        artStyle: wizardData.artStyle,
        episodeCount: wizardData.episodeCount,
      });

      const { updateProject, addCharacter, addEpisode } = useProjectStore.getState();

      // Update with additional data (planning, worldBuilding, storyStructure)
      await updateProject(project.id, {
        planning: wizardData.planning,
        worldBuilding: wizardData.worldBuilding,
        subGenres: wizardData.subGenres as any,
      });

      // Save characters
      for (const char of wizardData.characters) {
        await addCharacter(project.id, {
          name: char.name || '',
          koreanName: char.koreanName || char.name || '',
          role: char.role || 'supporting',
          age: char.age || 20,
          gender: char.gender || 'other',
          personality: char.personality || [],
          appearance: {
            height: char.appearance?.height || '',
            bodyType: char.appearance?.bodyType || '',
            skinTone: char.appearance?.skinTone || '',
            hairColor: char.appearance?.hairColor || '',
            hairStyle: char.appearance?.hairStyle || '',
            eyeColor: char.appearance?.eyeColor || '',
            eyeShape: char.appearance?.eyeShape || '',
            faceShape: char.appearance?.faceShape || '',
            distinguishingFeatures: char.appearance?.distinguishingFeatures || [],
            defaultOutfit: char.appearance?.defaultOutfit || '',
            accessories: char.appearance?.accessories || [],
          },
          backstory: char.backstory || char.background || '',
          motivation: char.motivation || '',
          arc: char.arc || '',
          relationships: char.relationships || [],
          speechPattern: char.speechPattern || {
            formality: 'casual',
            vocabulary: [],
            speechHabits: [],
            emotionalTendency: '',
          },
          visualPrompt: char.visualPrompt || '',
          referenceImages: char.referenceImages || [],
          expressions: char.expressions || [],
          poses: char.poses || [],
          outfits: char.outfits || [],
        });
      }

      // Save episode plans
      for (const ep of wizardData.episodePlans) {
        await addEpisode(project.id, {
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          summary: ep.summary || '',
          status: 'planning',
          panels: [],
          keyEvents: ep.keyEvents || [],
          emotionalArc: ep.emotionalArc || 'exposition',
          endingHook: ep.endingHook || '',
          characters: ep.characters || [],
          locations: ep.locations || [],
          wordCount: 0,
          estimatedReadTime: 0,
          translations: new Map(),
        });
      }

      // 저장된 진행 상황 삭제
      localStorage.removeItem(WIZARD_STORAGE_KEY);

      setToast({ message: '프로젝트가 생성되었습니다!', type: 'success' });

      setTimeout(() => {
        navigate(`/editor/${project.id}`);
      }, 1500);
    } catch (error) {
      console.error('Project creation failed:', error);
      setToast({ message: '프로젝트 생성에 실패했습니다.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  }, [wizardData, createProject, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* 진행 상황 복구 대화상자 */}
      {showResumeDialog && savedProgress && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-6 max-w-md mx-4 border border-gray-700"
          >
            <h3 className="text-xl font-bold text-white mb-2">이전 작업이 있습니다</h3>
            <p className="text-gray-400 mb-4">
              "<span className="text-purple-400">{savedProgress.data.title}</span>" 프로젝트의
              <span className="text-white font-medium"> {STEPS[savedProgress.step].title}</span> 단계까지 작업하셨습니다.
            </p>
            <div className="text-sm text-gray-500 mb-6">
              {savedProgress.data.characters.length > 0 && (
                <p>캐릭터 {savedProgress.data.characters.length}명 생성됨</p>
              )}
              {savedProgress.data.episodePlans.length > 0 && (
                <p>에피소드 {savedProgress.data.episodePlans.length}화 계획됨</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={handleStartNew} className="flex-1">
                새로 시작
              </Button>
              <Button variant="primary" onClick={handleResume} className="flex-1">
                이어서 작업
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => isEditMode ? handleGoToEditor() : navigate('/dashboard')}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {isEditMode ? '에디터로 돌아가기' : '대시보드'}
          </button>

          <h1 className="text-2xl font-bold text-white">
            {isEditMode ? `${wizardData.title} - 프로젝트 설정` : '새 웹툰 프로젝트'}
          </h1>

          {isEditMode && (
            <Button variant="primary" size="sm" onClick={handleGoToEditor}>
              에디터로 이동
            </Button>
          )}
          {!isEditMode && <div className="w-24" />}
        </div>

        {/* Progress */}
        <WizardProgress steps={STEPS} currentStep={currentStep} onStepClick={handleGoToStep} />

        {/* Step Content */}
        <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent
                data={wizardData}
                updateData={updateData}
                onNext={handleNext}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 0}>
            이전
          </Button>

          <div className="flex gap-3">
            {currentStep < STEPS.length - 1 ? (
              <Button variant="primary" onClick={handleNext} disabled={isGenerating}>
                다음
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleComplete}
                disabled={isGenerating}
                loading={isGenerating}
              >
                프로젝트 생성
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};
