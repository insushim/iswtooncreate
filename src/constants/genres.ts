export const GENRES = [
  { id: 'romance', label: '로맨스', icon: '💕', color: 'pink' },
  { id: 'action', label: '액션', icon: '💥', color: 'red' },
  { id: 'fantasy', label: '판타지', icon: '🧙', color: 'purple' },
  { id: 'drama', label: '드라마', icon: '🎭', color: 'blue' },
  { id: 'comedy', label: '코미디', icon: '😂', color: 'yellow' },
  { id: 'thriller', label: '스릴러', icon: '😱', color: 'gray' },
  { id: 'horror', label: '공포', icon: '👻', color: 'slate' },
  { id: 'slice-of-life', label: '일상', icon: '☀️', color: 'orange' },
  { id: 'sports', label: '스포츠', icon: '⚽', color: 'green' },
  { id: 'school', label: '학원물', icon: '🏫', color: 'cyan' },
  { id: 'historical', label: '사극', icon: '🏯', color: 'amber' },
  { id: 'sci-fi', label: 'SF', icon: '🚀', color: 'indigo' },
  { id: 'mystery', label: '미스터리', icon: '🔍', color: 'violet' },
  { id: 'bl', label: 'BL', icon: '👬', color: 'sky' },
  { id: 'gl', label: 'GL', icon: '👭', color: 'rose' },
] as const;

export type GenreId = typeof GENRES[number]['id'];

export const getGenreById = (id: string) => {
  return GENRES.find((genre) => genre.id === id);
};

export const getGenreLabel = (id: string) => {
  return getGenreById(id)?.label || id;
};
