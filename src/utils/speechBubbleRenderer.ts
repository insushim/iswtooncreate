/**
 * Canvas API를 사용하여 이미지에 한글 대사를 합성합니다.
 * 이미지 상단에 깔끔한 흰색 영역을 추가하고 대사 텍스트만 표시합니다.
 */

interface SpeechBubbleOptions {
  text: string;
  position?: { x: number; y: number }; // 퍼센트 (0-100)
  fontSize?: number;
  fontFamily?: string;
  maxWidth?: number;
  bubbleStyle?: 'normal' | 'thought' | 'shout';
  tailDirection?: 'down' | 'left' | 'right'; // 말풍선 꼬리 방향
}

/**
 * 이미지에 대사를 합성하여 새 이미지를 반환합니다.
 * 이미지 상단에 흰색 영역을 추가하고 대사 텍스트만 깔끔하게 표시합니다.
 */
export async function renderSpeechBubble(
  imageData: string,
  options: SpeechBubbleOptions
): Promise<string> {
  const {
    text,
    fontSize = 26,
    fontFamily = "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
    maxWidth = 400,
    bubbleStyle = 'normal',
  } = options;

  if (!text.trim()) {
    return imageData; // 대사가 없으면 원본 반환
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // 텍스트 크기 미리 계산
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      tempCtx.font = `bold ${fontSize}px ${fontFamily}`;
      const lines = wrapText(tempCtx, text, maxWidth);
      const lineHeight = fontSize * 1.5;
      const totalTextHeight = lines.length * lineHeight;
      const padding = 20;

      // 대사 영역 높이
      const topMargin = totalTextHeight + padding * 2;

      // 최종 캔버스 (원본 이미지 + 상단 대사 영역)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 캔버스 크기 설정
      canvas.width = img.width;
      canvas.height = img.height + topMargin;

      // 상단 대사 영역 - 흰색 배경
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, topMargin);

      // 하단에 얇은 구분선
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, topMargin);
      ctx.lineTo(canvas.width, topMargin);
      ctx.stroke();

      // 원본 이미지를 아래쪽에 그리기
      ctx.drawImage(img, 0, topMargin);

      // 대사 텍스트 스타일
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // 텍스트 색상 (스타일에 따라)
      if (bubbleStyle === 'shout') {
        ctx.fillStyle = '#d32f2f'; // 빨간색 (외침)
      } else if (bubbleStyle === 'thought') {
        ctx.fillStyle = '#666666'; // 회색 (생각)
      } else {
        ctx.fillStyle = '#1a1a1a'; // 검정 (일반)
      }

      // 대사 텍스트 그리기 (중앙 정렬)
      const textStartY = padding;
      lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, textStartY + index * lineHeight);
      });

      // 결과 반환
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageData;
  });
}

/**
 * 텍스트를 지정된 너비에 맞게 여러 줄로 나눕니다.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const words = text.split('');
  let currentLine = '';

  for (const char of words) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * 여러 대사를 이미지에 합성합니다.
 */
export async function renderMultipleSpeechBubbles(
  imageData: string,
  dialogues: Array<{
    text: string;
    position?: { x: number; y: number };
    bubbleStyle?: 'normal' | 'thought' | 'shout';
  }>
): Promise<string> {
  let result = imageData;

  for (const dialogue of dialogues) {
    if (dialogue.text.trim()) {
      result = await renderSpeechBubble(result, {
        text: dialogue.text,
        position: dialogue.position,
        bubbleStyle: dialogue.bubbleStyle,
      });
    }
  }

  return result;
}
