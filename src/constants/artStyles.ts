export const ART_STYLES = [
  {
    id: 'korean-webtoon',
    label: '한국 웹툰',
    description: '선명한 색감, 깔끔한 라인',
    thumbnail: '/styles/korean-webtoon.jpg',
  },
  {
    id: 'japanese-manga',
    label: '일본 만화',
    description: '스크린톤, 역동적인 연출',
    thumbnail: '/styles/japanese-manga.jpg',
  },
  {
    id: 'american-comic',
    label: '미국 코믹',
    description: '진한 색감, 강렬한 명암',
    thumbnail: '/styles/american-comic.jpg',
  },
  {
    id: 'watercolor',
    label: '수채화',
    description: '부드러운 색감, 투명한 느낌',
    thumbnail: '/styles/watercolor.jpg',
  },
  {
    id: 'cel-shading',
    label: '셀 셰이딩',
    description: '애니메이션 스타일, 선명한 명암',
    thumbnail: '/styles/cel-shading.jpg',
  },
  {
    id: 'realistic',
    label: '리얼리스틱',
    description: '사실적인 묘사, 세밀한 디테일',
    thumbnail: '/styles/realistic.jpg',
  },
  {
    id: 'chibi',
    label: '치비/SD',
    description: '귀여운 등신대, 과장된 표현',
    thumbnail: '/styles/chibi.jpg',
  },
  {
    id: 'minimalist',
    label: '미니멀',
    description: '단순한 라인, 여백 활용',
    thumbnail: '/styles/minimalist.jpg',
  },
] as const;

export type ArtStyleId = typeof ART_STYLES[number]['id'];

export const getArtStyleById = (id: string) => {
  return ART_STYLES.find((style) => style.id === id);
};

export const getArtStyleLabel = (id: string) => {
  return getArtStyleById(id)?.label || id;
};
