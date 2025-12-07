export type Genre = 'romance' | 'action' | 'fantasy' | 'slice-of-life' | 'thriller' | 'comedy' | 'sci-fi' | 'drama' | 'horror' | 'mystery';

export type ArtStyle =
  | 'korean-webtoon'
  | 'japanese-manga'
  | 'american-comic'
  | 'pastel-soft'
  | 'watercolor'
  | 'noir-contrast'
  | 'chibi-cute'
  | 'realistic';

export type TargetAudience = 'all' | 'teens' | '20s' | '30plus';

export type ProjectStatus = 'draft' | 'planning' | 'in-progress' | 'completed' | 'published';

export interface WebtoonProject {
  id: string;
  title: string;
  genre: Genre;
  subGenres: Genre[];
  targetAudience: TargetAudience;
  mood: string[];
  briefConcept: string;
  artStyle: ArtStyle;
  episodeCount: number;
  status: ProjectStatus;
  planning?: Planning;
  worldBuilding?: WorldBuilding;
  characters: Character[];
  episodes: Episode[];
  styleGuide: StyleGuide;
  costTracking: CostTracking;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface Planning {
  synopsis: string;
  coreMessage: string;
  targetAnalysis: string;
  uniquePoints: string[];
  expectedDirection: string;
  competitorAnalysis?: string;
}

export interface WorldBuilding {
  era: string;
  setting: string;
  mainLocations: Location[];
  specialRules?: string[];
  socialStructure?: string;
  technology?: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  significance: string;
  variations: LocationVariation[];
}

export interface LocationVariation {
  id: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weather: string;
  mood: string;
  generatedImage?: string;
  promptUsed?: string;
}

export interface StyleGuide {
  colorPalette: string[];
  lineWeight: 'thin' | 'medium' | 'thick';
  shadingStyle: 'flat' | 'cel' | 'soft' | 'detailed';
  characterProportions: 'realistic' | 'semi-realistic' | 'stylized' | 'chibi';
  backgroundDetail: 'minimal' | 'moderate' | 'detailed';
  effectsStyle: string;
  anchorPrompt: string;
}

export interface CostTracking {
  totalAPIcalls: number;
  imageGenerations: number;
  textGenerations: number;
  cachedResults: number;
  estimatedCost: number;
  savingsFromCache: number;
}

// Re-export for convenience
import type { Character } from './character';
import type { Episode } from './episode';

export type { Character, Episode };
