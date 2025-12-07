import React, { useState, useCallback } from 'react';
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

export const StepWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const navigate = useNavigate();
  const { createProject } = useProjectStore();

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
      if (stepIndex <= currentStep) {
        setCurrentStep(stepIndex);
      }
    },
    [currentStep]
  );

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

      // Update with additional data
      const { updateProject } = useProjectStore.getState();
      await updateProject(project.id, {
        planning: wizardData.planning,
        worldBuilding: wizardData.worldBuilding,
        subGenres: wizardData.subGenres as any,
      });

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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            돌아가기
          </button>

          <h1 className="text-2xl font-bold text-white">새 웹툰 프로젝트</h1>

          <div className="w-24" />
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
