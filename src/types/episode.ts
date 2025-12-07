import type { Panel } from './panel';

export type EpisodeStatus = 'planning' | 'storyboard' | 'generating' | 'editing' | 'review' | 'complete';

export type EmotionalArc = 'exposition' | 'rising' | 'climax' | 'falling' | 'resolution';

export interface Episode {
  id: string;
  projectId: string;
  episodeNumber: number;
  title: string;
  summary: string;
  keyEvents: string[];
  emotionalArc: EmotionalArc;
  endingHook: string;
  panels: Panel[];
  characters: string[];
  locations: string[];
  status: EpisodeStatus;
  wordCount: number;
  estimatedReadTime: number;
  feedback?: EpisodeFeedback;
  translations: Map<string, TranslatedEpisode>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EpisodeFeedback {
  pacing: 'too-fast' | 'good' | 'too-slow';
  emotionalImpact: number;
  plotConsistency: number;
  characterConsistency: number;
  suggestions: string[];
  readerPrediction: ReaderPrediction;
}

export interface ReaderPrediction {
  engagement: number;
  emotionalResponse: string[];
  shareability: number;
  cliffhangerEffect: number;
}

export interface TranslatedEpisode {
  language: string;
  title: string;
  panels: TranslatedPanel[];
  translatedAt: Date;
}

export interface TranslatedPanel {
  panelId: string;
  dialogues: {
    originalText: string;
    translatedText: string;
  }[];
}
