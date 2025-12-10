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
 */
export async function renderSpeechBubble(
  imageData: string,
  options: SpeechBubbleOptions
): Promise<string> {
  const {
    text,
    position = { x: 50, y: 35 }, // 인물에 더 가깝게 (35%로 변경)
    fontSize = 26, // 더 큰 폰트
    fontFamily = "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
    maxWidth = 300, // 더 넓은 말풍선
    bubbleStyle = 'normal',
    tailDirection = 'down',
  } = options;

  if (!text.trim()) {
    return imageData; // 대사가 없으면 원본 반환
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // 캔버스 크기를 이미지 크기로 설정
      canvas.width = img.width;
      canvas.height = img.height;

      // 원본 이미지 그리기
      ctx.drawImage(img, 0, 0);

      // 텍스트 스타일 설정
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // 텍스트를 여러 줄로 나누기
      const lines = wrapText(ctx, text, maxWidth);
      const lineHeight = fontSize * 1.4;
      const totalTextHeight = lines.length * lineHeight;

      // 말풍선 위치 계산 (이미지 기준 퍼센트)
      const bubbleX = (position.x / 100) * canvas.width;
      const bubbleY = (position.y / 100) * canvas.height;

      // 말풍선 크기 계산 - 더 크게
      const padding = 28;
      const bubbleWidth = Math.max(maxWidth + padding * 2, 180); // 최소 너비 보장
      const bubbleHeight = Math.max(totalTextHeight + padding * 2, 70); // 최소 높이 보장

      // 말풍선 그리기
      drawBubble(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, bubbleStyle, tailDirection);

      // 텍스트 그리기
      ctx.fillStyle = bubbleStyle === 'shout' ? '#cc0000' : '#000000';
      const textStartY = bubbleY - bubbleHeight / 2 + padding;

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
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  if (style === 'thought') {
    // 생각 말풍선 (구름 모양)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1.5;

    // 구름 모양으로 여러 원 겹치기
    ctx.beginPath();
    ctx.ellipse(x, y, halfWidth * 0.9, halfHeight * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();

    // 작은 원들 (생각 꼬리)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(x + 10, y + halfHeight + 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 18, y + halfHeight + 14, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // 일반/외침 말풍선 - 둥근 타원형 (웹툰 스타일)
    ctx.fillStyle = style === 'shout' ? '#fffde7' : '#ffffff';
    ctx.strokeStyle = style === 'shout' ? '#e53935' : '#222222';
    ctx.lineWidth = style === 'shout' ? 2.5 : 2;

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
      // 아래 방향 꼬리
      const tailX = x + 5;
      const tailY = y + halfHeight - 5;
      ctx.moveTo(tailX - 12, tailY);
      ctx.quadraticCurveTo(tailX, tailY + 20, tailX + 5, tailY + 18);
      ctx.quadraticCurveTo(tailX + 5, tailY + 5, tailX + 12, tailY);
    } else if (tailDirection === 'left') {
      const tailX = x - halfWidth + 5;
      const tailY = y + 5;
      ctx.moveTo(tailX, tailY - 10);
      ctx.quadraticCurveTo(tailX - 18, tailY, tailX - 16, tailY + 5);
      ctx.quadraticCurveTo(tailX - 5, tailY + 5, tailX, tailY + 10);
    } else if (tailDirection === 'right') {
      const tailX = x + halfWidth - 5;
      const tailY = y + 5;
      ctx.moveTo(tailX, tailY - 10);
      ctx.quadraticCurveTo(tailX + 18, tailY, tailX + 16, tailY + 5);
      ctx.quadraticCurveTo(tailX + 5, tailY + 5, tailX, tailY + 10);
    }

    ctx.fill();

    // 꼬리 테두리 (본체와 겹치는 부분 제외)
    ctx.beginPath();
    if (tailDirection === 'down') {
      const tailX = x + 5;
      const tailY = y + halfHeight - 5;
      ctx.moveTo(tailX - 12, tailY);
      ctx.quadraticCurveTo(tailX, tailY + 20, tailX + 5, tailY + 18);
      ctx.quadraticCurveTo(tailX + 5, tailY + 5, tailX + 12, tailY);
    }
    ctx.strokeStyle = style === 'shout' ? '#e53935' : '#222222';
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
