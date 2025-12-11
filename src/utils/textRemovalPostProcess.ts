/**
 * 이미지에서 AI가 생성한 불필요한 텍스트를 감지하고 제거하는 후처리 유틸리티
 * Gemini 3 Pro Image의 인페인팅 기능을 활용
 */

import { geminiService } from '@/services/gemini/GeminiService';

interface TextRemovalResult {
  imageData: string;
  hadText: boolean;
  processedAt: Date;
}

/**
 * 이미지에서 텍스트 영역을 감지합니다.
 * Canvas API를 사용하여 텍스트로 보이는 고대비 영역을 찾습니다.
 */
async function detectTextRegions(imageData: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(false);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageDataObj.data;

      // 텍스트 특성 감지: 고대비 픽셀 클러스터 찾기
      let highContrastCount = 0;
      const threshold = 200; // 밝기 차이 임계값

      for (let y = 0; y < canvas.height - 1; y++) {
        for (let x = 0; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4;
          const idxRight = (y * canvas.width + x + 1) * 4;
          const idxDown = ((y + 1) * canvas.width + x) * 4;

          // 현재 픽셀의 밝기
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          // 오른쪽 픽셀의 밝기
          const brightnessRight = (data[idxRight] + data[idxRight + 1] + data[idxRight + 2]) / 3;
          // 아래 픽셀의 밝기
          const brightnessDown = (data[idxDown] + data[idxDown + 1] + data[idxDown + 2]) / 3;

          // 급격한 밝기 변화 감지 (텍스트 에지 특성)
          if (Math.abs(brightness - brightnessRight) > threshold ||
              Math.abs(brightness - brightnessDown) > threshold) {
            highContrastCount++;
          }
        }
      }

      // 전체 픽셀 대비 고대비 영역 비율
      const ratio = highContrastCount / (canvas.width * canvas.height);

      // 텍스트가 있을 가능성이 높은 경우 (비율이 일정 이상)
      // 일반적인 일러스트는 0.01 미만, 텍스트가 있으면 0.02 이상
      resolve(ratio > 0.015);
    };

    img.onerror = () => resolve(false);
    img.src = imageData;
  });
}

/**
 * Gemini를 사용하여 이미지 내 텍스트를 제거합니다.
 * 인페인팅 방식으로 텍스트 영역을 주변 배경으로 채웁니다.
 */
export async function removeTextFromImage(imageData: string): Promise<TextRemovalResult> {
  // 먼저 텍스트가 있는지 빠르게 검사
  const hasText = await detectTextRegions(imageData);

  if (!hasText) {
    return {
      imageData,
      hadText: false,
      processedAt: new Date(),
    };
  }

  try {
    // Gemini 3 Pro Image를 사용하여 텍스트 제거 인페인팅
    const result = await geminiService.generateImage(
      `[INPAINTING TASK: REMOVE ALL TEXT]

Look at this image and identify ALL text, letters, words, Korean characters, signs, labels, speech bubbles, or any written content.

Replace ALL detected text areas with the surrounding background seamlessly:
- Fill text areas with matching background colors and textures
- Maintain the original art style and shading
- Preserve all non-text elements (characters, objects, scenery)
- Ensure smooth blending with no visible patches

Output: The same image with all text completely removed and replaced with clean background.`,
      {
        resolution: 'standard',
        referenceImages: [imageData],
        useCache: false,
        forceRegenerate: true,
      }
    );

    return {
      imageData: result.imageData,
      hadText: true,
      processedAt: new Date(),
    };
  } catch (error) {
    console.error('Text removal failed:', error);
    // 실패 시 원본 반환
    return {
      imageData,
      hadText: true,
      processedAt: new Date(),
    };
  }
}

/**
 * Canvas 기반 로컬 텍스트 블러 처리 (API 호출 없이)
 * 텍스트로 의심되는 고대비 영역을 블러 처리합니다.
 */
export async function blurTextRegions(imageData: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(imageData);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageDataObj.data;
      const width = canvas.width;
      const height = canvas.height;

      // 텍스트 영역 마스크 생성
      const textMask = new Uint8Array(width * height);
      const threshold = 180;

      // 1단계: 고대비 픽셀 찾기
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

          // 주변 8픽셀과 비교
          let contrastCount = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              const nBrightness = (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
              if (Math.abs(brightness - nBrightness) > threshold) {
                contrastCount++;
              }
            }
          }

          // 주변과 대비가 높은 픽셀을 텍스트 후보로 마킹
          if (contrastCount >= 3) {
            textMask[y * width + x] = 1;
          }
        }
      }

      // 2단계: 마스크 확장 (텍스트 주변도 포함)
      const expandedMask = new Uint8Array(width * height);
      const expandRadius = 3;

      for (let y = expandRadius; y < height - expandRadius; y++) {
        for (let x = expandRadius; x < width - expandRadius; x++) {
          if (textMask[y * width + x] === 1) {
            for (let dy = -expandRadius; dy <= expandRadius; dy++) {
              for (let dx = -expandRadius; dx <= expandRadius; dx++) {
                expandedMask[(y + dy) * width + (x + dx)] = 1;
              }
            }
          }
        }
      }

      // 3단계: 마스크된 영역에 블러 적용
      const blurRadius = 5;
      for (let y = blurRadius; y < height - blurRadius; y++) {
        for (let x = blurRadius; x < width - blurRadius; x++) {
          if (expandedMask[y * width + x] === 1) {
            let rSum = 0, gSum = 0, bSum = 0;
            let count = 0;

            // 주변 픽셀 평균으로 블러
            for (let dy = -blurRadius; dy <= blurRadius; dy++) {
              for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                // 텍스트가 아닌 주변 픽셀만 사용
                if (expandedMask[(y + dy) * width + (x + dx)] === 0) {
                  const nIdx = ((y + dy) * width + (x + dx)) * 4;
                  rSum += data[nIdx];
                  gSum += data[nIdx + 1];
                  bSum += data[nIdx + 2];
                  count++;
                }
              }
            }

            if (count > 0) {
              const idx = (y * width + x) * 4;
              data[idx] = Math.round(rSum / count);
              data[idx + 1] = Math.round(gSum / count);
              data[idx + 2] = Math.round(bSum / count);
            }
          }
        }
      }

      ctx.putImageData(imageDataObj, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => resolve(imageData);
    img.src = imageData;
  });
}

/**
 * 이미지 후처리 파이프라인
 * 1. 텍스트 감지
 * 2. 텍스트가 있으면 Gemini로 제거 시도
 * 3. 실패 시 로컬 블러 처리
 */
export async function postProcessImage(
  imageData: string,
  options: {
    useAI?: boolean;
    fallbackToBlur?: boolean;
  } = {}
): Promise<TextRemovalResult> {
  const { useAI = true, fallbackToBlur = true } = options;

  // 텍스트 감지
  const hasText = await detectTextRegions(imageData);

  if (!hasText) {
    return {
      imageData,
      hadText: false,
      processedAt: new Date(),
    };
  }

  // AI 텍스트 제거 시도
  if (useAI) {
    try {
      const result = await removeTextFromImage(imageData);
      if (result.imageData !== imageData) {
        return result;
      }
    } catch (error) {
      console.warn('AI text removal failed, trying fallback:', error);
    }
  }

  // 폴백: 로컬 블러 처리
  if (fallbackToBlur) {
    const blurredImage = await blurTextRegions(imageData);
    return {
      imageData: blurredImage,
      hadText: true,
      processedAt: new Date(),
    };
  }

  return {
    imageData,
    hadText: true,
    processedAt: new Date(),
  };
}
