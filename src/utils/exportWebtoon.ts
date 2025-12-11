/**
 * 웹툰 내보내기 유틸리티
 * - 개별 이미지 다운로드
 * - 전체 에피소드를 긴 이미지로 병합
 * - ZIP 파일로 내보내기
 */

import type { Panel, Episode } from '@/types';

/**
 * 패널들을 하나의 긴 이미지로 병합합니다.
 */
export async function mergeToLongImage(panels: Panel[]): Promise<string> {
  const sortedPanels = [...panels].sort((a, b) => a.panelNumber - b.panelNumber);

  // 이미지가 있는 패널만 필터링
  const panelsWithImages = sortedPanels.filter(p => p.generatedImage?.imageData);

  if (panelsWithImages.length === 0) {
    throw new Error('내보낼 이미지가 없습니다.');
  }

  // 모든 이미지 로드
  const images: HTMLImageElement[] = await Promise.all(
    panelsWithImages.map(panel => loadImage(panel.generatedImage!.imageData))
  );

  // 캔버스 크기 계산 (너비는 가장 넓은 이미지 기준, 높이는 모든 이미지 합)
  const maxWidth = Math.max(...images.map(img => img.width));
  const totalHeight = images.reduce((sum, img) => sum + img.height, 0);

  // 캔버스 생성
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  canvas.width = maxWidth;
  canvas.height = totalHeight;

  // 흰색 배경
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 이미지들을 세로로 배치
  let currentY = 0;
  for (const img of images) {
    // 이미지를 캔버스 중앙에 배치
    const x = (maxWidth - img.width) / 2;
    ctx.drawImage(img, x, currentY);
    currentY += img.height;
  }

  return canvas.toDataURL('image/png');
}

/**
 * 이미지를 로드합니다.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * 데이터 URL을 다운로드합니다.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 에피소드를 하나의 긴 이미지로 내보냅니다.
 */
export async function exportEpisodeAsLongImage(episode: Episode): Promise<void> {
  const longImage = await mergeToLongImage(episode.panels);
  const filename = `${episode.episodeNumber}화_${episode.title || 'episode'}.png`;
  downloadDataUrl(longImage, filename);
}

/**
 * 개별 패널을 이미지로 다운로드합니다.
 */
export function downloadPanel(panel: Panel, episodeNumber: number): void {
  if (!panel.generatedImage?.imageData) {
    throw new Error('이미지가 없습니다.');
  }

  const filename = `${episodeNumber}화_패널${panel.panelNumber}.png`;
  downloadDataUrl(panel.generatedImage.imageData, filename);
}

/**
 * 모든 패널을 개별 이미지로 다운로드합니다.
 */
export async function downloadAllPanels(episode: Episode): Promise<void> {
  const sortedPanels = [...episode.panels].sort((a, b) => a.panelNumber - b.panelNumber);
  const panelsWithImages = sortedPanels.filter(p => p.generatedImage?.imageData);

  for (const panel of panelsWithImages) {
    downloadPanel(panel, episode.episodeNumber);
    // 브라우저가 너무 많은 다운로드를 처리하지 못하므로 약간의 딜레이
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

/**
 * 내보내기 옵션 타입
 */
export interface ExportOptions {
  format: 'long-image' | 'individual' | 'zip';
  quality?: number;
}

/**
 * 에피소드를 내보냅니다.
 */
export async function exportEpisode(episode: Episode, options: ExportOptions): Promise<void> {
  const { format } = options;

  switch (format) {
    case 'long-image':
      await exportEpisodeAsLongImage(episode);
      break;
    case 'individual':
      await downloadAllPanels(episode);
      break;
    case 'zip':
      // ZIP 내보내기는 추후 구현 (JSZip 라이브러리 필요)
      await downloadAllPanels(episode);
      break;
    default:
      throw new Error('지원하지 않는 내보내기 형식입니다.');
  }
}
