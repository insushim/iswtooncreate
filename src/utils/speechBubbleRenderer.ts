/**
 * Canvas API를 사용하여 이미지에 한글 대사를 합성합니다.
 * AI가 생성한 빈 말풍선 위에 깨끗한 한글 텍스트를 렌더링합니다.
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
 * 말풍선은 항상 이미지 상단 바깥 영역에 배치하여 인물과 겹치지 않도록 합니다.
 */
export async function renderSpeechBubble(
  imageData: string,
  options: SpeechBubbleOptions
): Promise<string> {
  const {
    text,
    fontSize = 28, // 더 큰 폰트
    fontFamily = "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
    maxWidth = 320, // 더 넓은 말풍선
    bubbleStyle = 'normal',
  } = options;

  if (!text.trim()) {
    return imageData; // 대사가 없으면 원본 반환
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // 말풍선을 위한 상단 여백 계산
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 텍스트 크기 미리 계산
      tempCtx.font = `bold ${fontSize}px ${fontFamily}`;
      const lines = wrapText(tempCtx, text, maxWidth);
      const lineHeight = fontSize * 1.4;
      const totalTextHeight = lines.length * lineHeight;
      const padding = 32;
      const bubbleHeight = Math.max(totalTextHeight + padding * 2, 80);

      // 말풍선이 들어갈 상단 여백 (말풍선 높이 + 여유 공간)
      const topMargin = bubbleHeight + 20;

      // 최종 캔버스 (원본 이미지 + 상단 여백)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 캔버스 크기 설정 (상단에 말풍선 공간 추가)
      canvas.width = img.width;
      canvas.height = img.height + topMargin;

      // 배경을 흰색으로 채우기 (말풍선 영역)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, topMargin);

      // 원본 이미지를 아래쪽에 그리기
      ctx.drawImage(img, 0, topMargin);

      // 텍스트 스타일 설정
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // 말풍선 위치 (상단 여백 중앙)
      const bubbleWidth = Math.max(maxWidth + padding * 2, 220);
      const bubbleX = canvas.width / 2; // 중앙 정렬
      const bubbleY = topMargin / 2; // 상단 여백 중앙

      // 말풍선 그리기 (꼬리는 아래로 - 이미지를 가리킴)
      drawBubble(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleStyle, 'down');

      // 텍스트 그리기
      ctx.fillStyle = bubbleStyle === 'shout' ? '#cc0000' : '#000000';
      const textStartY = bubbleY - totalTextHeight / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, bubbleX, textStartY + index * lineHeight);
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
 * 말풍선을 그립니다. (웹툰 스타일 - 둥근 타원형)
 */
function drawBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  style: 'normal' | 'thought' | 'shout',
  tailDirection: 'down' | 'left' | 'right' = 'down'
): void {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  ctx.save();

  // 그림자 효과
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 3;

  if (style === 'thought') {
    // 생각 말풍선 (구름 모양)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;

    // 구름 모양으로 여러 원 겹치기
    ctx.beginPath();
    ctx.ellipse(x, y, halfWidth * 0.9, halfHeight * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();

    // 작은 원들 (생각 꼬리)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + 10, y + halfHeight + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 20, y + halfHeight + 18, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // 일반/외침 말풍선 - 둥근 타원형 (웹툰 스타일)
    ctx.fillStyle = style === 'shout' ? '#fffde7' : '#ffffff';
    ctx.strokeStyle = style === 'shout' ? '#d32f2f' : '#1a1a1a';
    ctx.lineWidth = style === 'shout' ? 3 : 2.5;

    // 타원형 말풍선 본체
    ctx.beginPath();
    ctx.ellipse(x, y, halfWidth, halfHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();

    // 말풍선 꼬리 (삼각형) - 본체와 연결
    ctx.fillStyle = style === 'shout' ? '#fffde7' : '#ffffff';
    ctx.beginPath();

    if (tailDirection === 'down') {
      // 아래 방향 꼬리 (더 자연스럽게)
      const tailX = x;
      const tailY = y + halfHeight - 3;
      ctx.moveTo(tailX - 15, tailY);
      ctx.quadraticCurveTo(tailX, tailY + 25, tailX + 8, tailY + 22);
      ctx.quadraticCurveTo(tailX + 5, tailY + 8, tailX + 15, tailY);
    } else if (tailDirection === 'left') {
      const tailX = x - halfWidth + 5;
      const tailY = y + 5;
      ctx.moveTo(tailX, tailY - 12);
      ctx.quadraticCurveTo(tailX - 22, tailY, tailX - 20, tailY + 6);
      ctx.quadraticCurveTo(tailX - 5, tailY + 6, tailX, tailY + 12);
    } else if (tailDirection === 'right') {
      const tailX = x + halfWidth - 5;
      const tailY = y + 5;
      ctx.moveTo(tailX, tailY - 12);
      ctx.quadraticCurveTo(tailX + 22, tailY, tailX + 20, tailY + 6);
      ctx.quadraticCurveTo(tailX + 5, tailY + 6, tailX, tailY + 12);
    }

    ctx.fill();

    // 꼬리 테두리
    ctx.beginPath();
    if (tailDirection === 'down') {
      const tailX = x;
      const tailY = y + halfHeight - 3;
      ctx.moveTo(tailX - 15, tailY);
      ctx.quadraticCurveTo(tailX, tailY + 25, tailX + 8, tailY + 22);
      ctx.quadraticCurveTo(tailX + 5, tailY + 8, tailX + 15, tailY);
    }
    ctx.strokeStyle = style === 'shout' ? '#d32f2f' : '#1a1a1a';
    ctx.stroke();
  }

  ctx.restore();
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
