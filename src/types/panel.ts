export type PanelSize = 'full' | 'large' | 'medium' | 'small' | 'wide' | 'tall' | 'custom';

export type CameraAngle = 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'bird-eye' | 'worm-eye' | 'dutch-angle' | 'over-shoulder' | 'pov';

export type DialogueType = 'speech' | 'thought' | 'narration' | 'sfx' | 'whisper' | 'shout';

export type BubbleStyle = 'normal' | 'thought' | 'shout' | 'whisper' | 'narration' | 'electric' | 'wavy' | 'jagged';

export interface Panel {
  id: string;
  episodeId: string;
  panelNumber: number;
  size: PanelSize;
  customSize?: { width: number; height: number };
  cameraAngle: CameraAngle;
  composition: string;
  characters: PanelCharacter[];
  background: PanelBackground;
  dialogues: PanelDialogue[];
  sfx: SoundEffect[];
  mood: string;
  lighting: string;
  visualPrompt: string;
  generatedImage?: GeneratedImage;
  status: 'pending' | 'preview' | 'approved' | 'regenerating';
  notes?: string;
}

export interface PanelCharacter {
  characterId: string;
  characterName: string;
  position: { x: number; y: number };
  scale: number;
  expression: string;
  pose: string;
  action: string;
  facing: 'left' | 'right' | 'front' | 'back';
  layer: number;
}

export interface PanelBackground {
  locationId?: string;
  locationName: string;
  description: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weather: string;
  mood: string;
  focusPoint: string;
  depth: 'shallow' | 'medium' | 'deep';
}

export interface PanelDialogue {
  id: string;
  characterId?: string;
  characterName?: string;
  text: string;
  type: DialogueType;
  bubbleStyle: BubbleStyle;
  position: { x: number; y: number };
  size: { width: number; height: number };
  tailDirection?: 'left' | 'right' | 'top' | 'bottom' | 'none';
  fontSize: 'small' | 'medium' | 'large';
  emphasis?: string[];
}

export interface SoundEffect {
  id: string;
  text: string;
  style: 'impact' | 'motion' | 'ambient' | 'emotion';
  position: { x: number; y: number };
  rotation: number;
  scale: number;
  color: string;
}

export interface GeneratedImage {
  id: string;
  resolution: 'preview' | 'standard' | 'high';
  imageData: string;
  promptUsed: string;
  generatedAt: Date;
  fromCache: boolean;
  cost: number;
}
