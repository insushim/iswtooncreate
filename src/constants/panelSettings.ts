export const PANEL_SIZES = [
  { id: 'small', label: '작은', ratio: 0.5, description: '감정 컷, 리액션' },
  { id: 'medium', label: '중간', ratio: 1, description: '일반 장면' },
  { id: 'large', label: '큰', ratio: 1.5, description: '중요 장면' },
  { id: 'full', label: '전체', ratio: 2, description: '임팩트 장면' },
] as const;

export const CAMERA_ANGLES = [
  { id: 'close-up', label: '클로즈업', description: '얼굴, 감정 표현' },
  { id: 'medium-shot', label: '미디엄샷', description: '상반신, 대화 장면' },
  { id: 'full-shot', label: '풀샷', description: '전신, 액션 장면' },
  { id: 'wide-shot', label: '와이드샷', description: '배경 포함, 상황 설명' },
  { id: 'bird-eye', label: '버드아이뷰', description: '위에서 내려다보는 시점' },
  { id: 'worm-eye', label: '웜즈아이뷰', description: '아래에서 올려다보는 시점' },
  { id: 'over-shoulder', label: '오버숄더', description: '어깨 너머로 보는 시점' },
  { id: 'dutch-angle', label: '더치앵글', description: '기울어진 카메라, 긴장감' },
] as const;

export const MOODS = [
  { id: 'happy', label: '밝음', color: '#FCD34D' },
  { id: 'sad', label: '슬픔', color: '#60A5FA' },
  { id: 'angry', label: '분노', color: '#EF4444' },
  { id: 'romantic', label: '로맨틱', color: '#F472B6' },
  { id: 'tense', label: '긴장', color: '#A78BFA' },
  { id: 'mysterious', label: '미스터리', color: '#6B7280' },
  { id: 'comedic', label: '코믹', color: '#FBBF24' },
  { id: 'peaceful', label: '평화로움', color: '#34D399' },
  { id: 'dramatic', label: '극적', color: '#8B5CF6' },
  { id: 'nostalgic', label: '향수', color: '#D97706' },
] as const;

export const LIGHTING_OPTIONS = [
  { id: 'natural', label: '자연광', description: '낮, 맑은 날' },
  { id: 'sunset', label: '석양', description: '황금빛, 따뜻한 톤' },
  { id: 'night', label: '야간', description: '어두운 배경, 달빛' },
  { id: 'indoor', label: '실내', description: '인공 조명' },
  { id: 'dramatic', label: '극적', description: '강한 명암 대비' },
  { id: 'soft', label: '소프트', description: '부드러운 조명' },
  { id: 'backlight', label: '역광', description: '뒤에서 비추는 빛' },
  { id: 'neon', label: '네온', description: '형광등, 사이버펑크' },
] as const;

export const BUBBLE_STYLES = [
  { id: 'normal', label: '일반', description: '기본 말풍선' },
  { id: 'thought', label: '생각', description: '둥근 구름 모양' },
  { id: 'shout', label: '외침', description: '뾰족한 모양' },
  { id: 'whisper', label: '속삭임', description: '점선 테두리' },
  { id: 'narration', label: '나레이션', description: '사각형 박스' },
  { id: 'sfx', label: '효과음', description: '스타일화된 텍스트' },
] as const;

export type PanelSize = typeof PANEL_SIZES[number]['id'];
export type CameraAngle = typeof CAMERA_ANGLES[number]['id'];
export type Mood = typeof MOODS[number]['id'];
export type Lighting = typeof LIGHTING_OPTIONS[number]['id'];
export type BubbleStyle = typeof BUBBLE_STYLES[number]['id'];
