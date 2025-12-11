/**
 * 이미지 후처리 유틸리티
 * 현재는 후처리를 비활성화하고 원본 이미지를 반환
 * (AI가 생성한 텍스트 문제는 프롬프트 레벨에서 해결)
 */

interface TextRemovalResult {
  imageData: string;
  hadText: boolean;
  processedAt: Date;
}

/**
 * 이미지 후처리 (현재 비활성화 - 원본 반환)
 * 텍스트 제거 후처리가 오히려 이미지 품질을 저하시키므로 비활성화
 */
export async function postProcessImage(
  imageData: string,
  _options: {
    useAI?: boolean;
    fallbackToBlur?: boolean;
  } = {}
): Promise<TextRemovalResult> {
  // 후처리 비활성화 - 원본 이미지 그대로 반환
  return {
    imageData,
    hadText: false,
    processedAt: new Date(),
  };
}
