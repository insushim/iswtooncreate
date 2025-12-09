/**
 * Gemini API 응답에서 JSON을 안전하게 파싱합니다.
 * Gemini가 ```json 코드 블록으로 감싸서 응답하는 경우를 처리합니다.
 * 잘린 JSON도 복구를 시도합니다.
 */
export function parseJsonResponse<T = any>(response: string): T {
  let jsonStr = response.trim();

  // ```json 또는 ``` 코드 블록 제거
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }

  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }

  jsonStr = jsonStr.trim();

  // JSON 시작점 찾기 (앞에 불필요한 텍스트가 있을 수 있음)
  const jsonStartIndex = jsonStr.indexOf('{');
  if (jsonStartIndex > 0) {
    jsonStr = jsonStr.slice(jsonStartIndex);
  }

  // 먼저 정상 파싱 시도
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // 파싱 실패시 복구 시도
    console.warn('JSON parsing failed, attempting recovery...');
    return repairAndParseJson<T>(jsonStr);
  }
}

/**
 * 잘린 JSON을 복구하여 파싱합니다.
 */
function repairAndParseJson<T>(jsonStr: string): T {
  let repaired = jsonStr;

  // 1단계: 마지막 완전한 객체를 찾아서 자르기
  // 배열 내 객체들 중 마지막으로 완전히 닫힌 객체까지만 사용
  const lastCompleteObjectEnd = findLastCompleteObjectInArray(repaired);
  if (lastCompleteObjectEnd > 0) {
    repaired = repaired.substring(0, lastCompleteObjectEnd);
  }

  // 2단계: 열린 괄호 카운트
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (const char of repaired) {
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
    if (char === '[') openBrackets++;
    if (char === ']') openBrackets--;
  }

  // 끝에 불완전한 쉼표 제거
  repaired = repaired.replace(/,\s*$/, '');

  // 닫히지 않은 괄호 닫기
  while (openBrackets > 0) {
    repaired += ']';
    openBrackets--;
  }
  while (openBraces > 0) {
    repaired += '}';
    openBraces--;
  }

  try {
    return JSON.parse(repaired);
  } catch (e) {
    // 3단계: 더 공격적인 복구 - 배열 내 완전한 객체들만 추출
    const arrayMatch = repaired.match(/"(characters|episodes|acts|panels)":\s*\[/);
    if (arrayMatch) {
      const key = arrayMatch[1];
      const arrayStart = repaired.indexOf(arrayMatch[0]);
      const bracketStart = repaired.indexOf('[', arrayStart);

      // 완전한 객체들만 추출
      const objects = extractCompleteObjects(repaired.substring(bracketStart + 1));
      if (objects.length > 0) {
        const reconstructed = `{"${key}":[${objects.join(',')}]}`;
        try {
          return JSON.parse(reconstructed);
        } catch {}
      }
    }

    // 4단계: 마지막 완전한 배열 항목 찾기 (기존 로직)
    const match = repaired.match(/^(\{[\s\S]*"(?:characters|episodes|acts|panels)":\s*\[[\s\S]*\})\s*,?\s*(?:\{[^}]*)?$/);
    if (match) {
      try {
        let partial = match[1];
        if (!partial.endsWith(']')) partial += ']';
        if (!partial.endsWith('}')) partial += '}';
        return JSON.parse(partial);
      } catch {}
    }

    // 최후의 수단: 원래 오류 던지기
    throw new Error(`JSON 파싱 실패: AI 응답이 불완전합니다. 다시 시도해주세요.`);
  }
}

/**
 * 배열 내에서 마지막으로 완전히 닫힌 객체의 끝 위치를 찾습니다.
 */
function findLastCompleteObjectInArray(jsonStr: string): number {
  let lastCompleteEnd = -1;
  let depth = 0;
  let inString = false;
  let escape = false;
  let inArray = false;
  let objectStart = -1;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '[') {
      inArray = true;
    } else if (char === '{') {
      if (inArray && depth === 1) {
        objectStart = i;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (inArray && depth === 1 && objectStart !== -1) {
        lastCompleteEnd = i + 1;
      }
    } else if (char === ']') {
      if (depth === 1) {
        inArray = false;
      }
    }
  }

  return lastCompleteEnd;
}

/**
 * 문자열에서 완전한 JSON 객체들을 추출합니다.
 */
function extractCompleteObjects(str: string): string[] {
  const objects: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{') {
      if (depth === 0) {
        start = i;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const obj = str.substring(start, i + 1);
        // 유효한 JSON인지 확인
        try {
          JSON.parse(obj);
          objects.push(obj);
        } catch {
          // 불완전한 객체는 무시
        }
        start = -1;
      }
    }
  }

  return objects;
}
