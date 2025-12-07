export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor';

export interface Character {
  id: string;
  projectId: string;
  name: string;
  koreanName: string;
  role: CharacterRole;
  age: number;
  gender: 'male' | 'female' | 'non-binary' | 'other';
  personality: string[];
  appearance: CharacterAppearance;
  backstory: string;
  motivation: string;
  arc: string;
  relationships: CharacterRelationship[];
  speechPattern: SpeechPattern;
  visualPrompt: string;
  referenceImages: ReferenceImage[];
  expressions: ExpressionPreset[];
  poses: PosePreset[];
  outfits: Outfit[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CharacterAppearance {
  height: string;
  bodyType: string;
  skinTone: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  eyeShape: string;
  faceShape: string;
  distinguishingFeatures: string[];
  defaultOutfit: string;
  accessories: string[];
}

export interface CharacterRelationship {
  characterId: string;
  characterName: string;
  relation: string;
  dynamics: string;
  evolution?: string;
}

export interface SpeechPattern {
  formality: 'formal' | 'casual' | 'mixed';
  dialect?: string;
  vocabulary: string[];
  catchphrase?: string;
  speechHabits: string[];
  emotionalTendency: string;
}

export interface ReferenceImage {
  id: string;
  type: 'anchor' | 'expression' | 'pose' | 'outfit';
  imageData: string;
  promptUsed: string;
  createdAt: Date;
}

export interface ExpressionPreset {
  id: string;
  name: string;
  emotion: string;
  intensity: 'subtle' | 'normal' | 'intense';
  description: string;
  imageData?: string;
}

export interface PosePreset {
  id: string;
  name: string;
  category: 'standing' | 'sitting' | 'action' | 'emotional';
  description: string;
  imageData?: string;
}

export interface Outfit {
  id: string;
  name: string;
  occasion: string;
  description: string;
  colors: string[];
  imageData?: string;
}
